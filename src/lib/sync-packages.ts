import fs from 'fs';
import path from 'path';
import type {
  PackageJson,
  SyncResult,
  SyncPackagesOptions,
  MonosyncConfig,
} from './types.js';

export function log(message: string): void {
  console.log(`[PACKAGE-SYNC] ${message}`);
}

export function error(message: string): void {
  console.error(`[ERROR] ${message}`);
}

export function success(message: string): void {
  console.log(`[SUCCESS] ${message}`);
}

/**
 * Load configuration from .monosyncrc.json if it exists
 */
export function loadMonosyncConfig(rootDir: string): MonosyncConfig {
  const configPath = path.join(rootDir, '.monosyncrc.json');
  try {
    if (fs.existsSync(configPath)) {
      const config: MonosyncConfig = JSON.parse(
        fs.readFileSync(configPath, 'utf8')
      );
      return config;
    }
  } catch (err) {
    // Silently ignore config file errors - it's optional
  }
  return {};
}

/**
 * Recursively find all package.json files in a directory
 */
export function findPackageJsonFiles(
  dir: string,
  rootDir: string,
  exclude: string[] = ['node_modules', 'dist', 'build', '.git']
): string[] {
  const results: string[] = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(rootDir, fullPath);

      // Skip excluded directories
      if (exclude.some(ex => relativePath.includes(ex))) {
        continue;
      }

      if (entry.isDirectory()) {
        results.push(...findPackageJsonFiles(fullPath, rootDir, exclude));
      } else if (entry.name === 'package.json' && fullPath !== path.join(rootDir, 'package.json')) {
        results.push(fullPath);
      }
    }
  } catch (err) {
    // Skip directories we can't read
  }

  return results;
}

/**
 * Discover packages using pnpm-workspace.yaml, or fallback to directory scan
 */
export function discoverPackages(rootDir: string): string[] {
  // Try to read pnpm-workspace.yaml
  const workspacePath = path.join(rootDir, 'pnpm-workspace.yaml');
  if (fs.existsSync(workspacePath)) {
    try {
      const content = fs.readFileSync(workspacePath, 'utf8');
      // Simple YAML parsing for packages array
      const match = content.match(/packages:\s*\n((?:\s+-\s+.+\n?)+)/);
      if (match) {
        const patterns = match[1]
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.startsWith('-'))
          .map(line => line.substring(1).trim().replace(/['"]/g, ''));

        // For simplicity, if patterns contain wildcards, scan directories
        // Otherwise use the explicit paths
        const packages: string[] = [];
        for (const pattern of patterns) {
          if (pattern.includes('*')) {
            // Wildcard pattern - need to glob
            const baseDir = pattern.split('*')[0].replace(/\/$/, '');
            const searchDir = path.join(rootDir, baseDir);
            if (fs.existsSync(searchDir)) {
              const dirs = fs.readdirSync(searchDir, { withFileTypes: true });
              for (const dir of dirs) {
                if (dir.isDirectory()) {
                  const pkgPath = path.join(searchDir, dir.name, 'package.json');
                  if (fs.existsSync(pkgPath)) {
                    packages.push(pkgPath);
                  }
                }
              }
            }
          } else {
            const pkgPath = path.join(rootDir, pattern, 'package.json');
            if (fs.existsSync(pkgPath)) {
              packages.push(pkgPath);
            }
          }
        }
        if (packages.length > 0) {
          return packages;
        }
      }
    } catch (err) {
      // Fall through to directory scan
    }
  }

  // Fallback: scan common package directories
  const commonDirs = ['packages', 'apps', 'libs'];
  const packages: string[] = [];

  for (const dir of commonDirs) {
    const dirPath = path.join(rootDir, dir);
    if (fs.existsSync(dirPath)) {
      packages.push(...findPackageJsonFiles(dirPath, rootDir));
    }
  }

  return packages;
}

/**
 * Load the package template (optional - only for adding missing common fields)
 */
export function loadTemplate(
  rootDir: string,
  options: SyncPackagesOptions = {}
): PackageJson | null {
  const standardLocations = [
    path.join(rootDir, '.monosync', 'package-template.json'),
    path.join(rootDir, 'config', 'monosync', 'package-template.json'),
    path.join(rootDir, 'package-template.json'),
    path.join(rootDir, 'scripts', 'build-system', 'package-template.json'),
  ];

  if (options.templatePath) {
    const absolutePath = path.isAbsolute(options.templatePath)
      ? options.templatePath
      : path.join(rootDir, options.templatePath);
    if (fs.existsSync(absolutePath)) {
      try {
        const template = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
        delete template._template;
        delete template._version;
        return template;
      } catch (err) {
        error(`Could not load template: ${(err as Error).message}`);
      }
    }
  }

  for (const location of standardLocations) {
    if (fs.existsSync(location)) {
      try {
        const template = JSON.parse(fs.readFileSync(location, 'utf8'));
        delete template._template;
        delete template._version;
        return template;
      } catch (err) {
        // Try next location
      }
    }
  }

  return null;
}

/**
 * Standard field order for package.json
 */
const FIELD_ORDER = [
  'name',
  'version',
  'private',
  'type',
  'license',
  'description',
  'main',
  'module',
  'types',
  'repository',
  'homepage',
  'bugs',
  'author',
  'contributors',
  'keywords',
  'funding',
  'engines',
  'exports',
  'files',
  'scripts',
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'peerDependenciesMeta',
];

/**
 * Reorder package.json fields according to standard order
 */
export function reorderPackageJson(
  packageJson: PackageJson,
  template: PackageJson | null
): PackageJson {
  const ordered: PackageJson = {};

  // First, add fields in standard order
  for (const field of FIELD_ORDER) {
    if (field in packageJson) {
      ordered[field] = packageJson[field];
    }
  }

  // Then add any remaining fields (preserves custom fields)
  for (const field in packageJson) {
    if (!(field in ordered)) {
      ordered[field] = packageJson[field];
    }
  }

  // Optionally add missing common fields from template
  if (template) {
    // Only add these fields if they're missing and exist in template
    const commonFields = ['repository', 'homepage', 'bugs', 'author', 'engines', 'license'];
    for (const field of commonFields) {
      if (!(field in ordered) && field in template) {
        ordered[field] = template[field];
      }
    }

    // Special handling for repository directory
    if (template.repository && ordered.repository && typeof ordered.repository === 'object') {
      // Preserve the directory field from the original package.json
      const originalRepo = ordered.repository as any;
      const templateRepo = template.repository as any;
      ordered.repository = {
        ...templateRepo,
        directory: originalRepo.directory || originalRepo.directory,
      };
    }
  }

  // Re-order after adding template fields
  const finalOrdered: PackageJson = {};
  for (const field of FIELD_ORDER) {
    if (field in ordered) {
      finalOrdered[field] = ordered[field];
    }
  }

  // Add remaining fields
  for (const field in ordered) {
    if (!(field in finalOrdered)) {
      finalOrdered[field] = ordered[field];
    }
  }

  return finalOrdered;
}

/**
 * Write package.json to disk with proper formatting
 */
export function writePackageJson(
  packagePath: string,
  packageJson: PackageJson
): boolean {
  try {
    const formattedJson = JSON.stringify(packageJson, null, 2) + '\n';
    fs.writeFileSync(packagePath, formattedJson);
    return true;
  } catch (err) {
    error(`Could not write ${packagePath}: ${(err as Error).message}`);
    return false;
  }
}

/**
 * Main synchronization function - reorders package.json fields
 */
export function syncPackages(
  rootDir: string,
  options: SyncPackagesOptions = {}
): SyncResult[] {
  log('Starting package.json field reordering...');

  const template = loadTemplate(rootDir, options);
  if (template) {
    log('Loaded template for common fields');
  } else {
    log('No template found - will only reorder fields');
  }

  const packagePaths = discoverPackages(rootDir);
  log(`Found ${packagePaths.length} packages`);

  const results: SyncResult[] = [];

  for (const packagePath of packagePaths) {
    const relativePath = path.relative(rootDir, packagePath);

    try {
      // Read existing package.json
      const packageJson: PackageJson = JSON.parse(
        fs.readFileSync(packagePath, 'utf8')
      );

      const packageName = packageJson.name || path.dirname(relativePath);
      log(`Processing ${packageName}...`);

      // Reorder fields (and optionally add template fields)
      const reordered = reorderPackageJson(packageJson, template);

      // Write back
      const syncSuccess = writePackageJson(packagePath, reordered);

      results.push({
        name: packageName,
        directory: path.dirname(relativePath),
        success: syncSuccess,
      });

      if (syncSuccess) {
        log(`✅ ${packageName} synchronized`);
      } else {
        log(`❌ ${packageName} failed`);
      }
    } catch (err) {
      error(`Failed to process ${relativePath}: ${(err as Error).message}`);
      results.push({
        name: path.dirname(relativePath),
        directory: path.dirname(relativePath),
        success: false,
      });
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('PACKAGE SYNCHRONIZATION COMPLETED');
  console.log('='.repeat(70));
  console.log('📦 Package Results:');

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  results.forEach(({ name, success: syncSuccess }) => {
    const status = syncSuccess ? '✅ Success' : '❌ Failed';
    console.log(`   ${status} ${name}`);
  });

  console.log(`\n📊 Summary: ${successCount} successful, ${failCount} failed`);
  console.log('='.repeat(70));

  if (failCount > 0) {
    process.exit(1);
  }

  success('All packages synchronized successfully!');
  return results;
}
