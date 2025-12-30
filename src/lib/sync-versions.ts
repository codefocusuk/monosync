import fs from 'fs';
import path from 'path';
import type { PackageJson, VersionSyncResult, SyncVersionsOptions } from './types.js';

export function log(message: string): void {
  console.log(`[VERSION-SYNC] ${message}`);
}

export function error(message: string): void {
  console.error(`[ERROR] ${message}`);
}

export function success(message: string): void {
  console.log(`[SUCCESS] ${message}`);
}

/**
 * Recursively finds all package.json files, excluding node_modules
 */
export function findAllPackages(
  dir: string,
  fileList: string[] = []
): string[] {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and hidden folders
      if (file !== 'node_modules' && !file.startsWith('.')) {
        findAllPackages(filePath, fileList);
      }
    } else if (file === 'package.json') {
      // Don't include the root package.json in the update list
      if (filePath !== path.join(dir, 'package.json')) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

/**
 * Get the version from the root package.json
 */
export function getRootVersion(rootDir: string): string {
  try {
    const rootPackagePath = path.join(rootDir, 'package.json');
    const rootPackage: PackageJson = JSON.parse(
      fs.readFileSync(rootPackagePath, 'utf8')
    );
    return rootPackage.version || '0.0.0';
  } catch (err) {
    error(`Could not read root package.json at ${rootDir}: ${(err as Error).message}`);
    process.exit(1);
  }
}

/**
 * Update the version in a package.json file
 */
export function updatePackageVersion(
  packagePath: string,
  newVersion: string,
  rootDir: string
): VersionSyncResult | null {
  try {
    const packageData: PackageJson = JSON.parse(
      fs.readFileSync(packagePath, 'utf8')
    );
    const oldVersion = packageData.version || '0.0.0';
    const relativePath = path.relative(rootDir, packagePath);

    if (oldVersion === newVersion) {
      return {
        name: packageData.name || relativePath,
        oldVersion,
        newVersion,
        changed: false,
      };
    }

    packageData.version = newVersion;
    fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2) + '\n');

    log(`${packageData.name}: ${oldVersion} → ${newVersion}`);
    return {
      name: packageData.name || relativePath,
      oldVersion,
      newVersion,
      changed: true,
    };
  } catch (err) {
    error(`Could not update ${packagePath}: ${(err as Error).message}`);
    return null;
  }
}

/**
 * Main synchronization function for versions
 */
export function syncVersions(
  rootDir: string,
  options: SyncVersionsOptions = {}
): VersionSyncResult[] {
  log('Scanning for packages...');

  const targetVersion = options.targetVersion || getRootVersion(rootDir);
  log(`Target version (from root): ${targetVersion}`);

  // Find all package.json files automatically
  const packageFiles = findAllPackages(rootDir);

  const results: VersionSyncResult[] = [];

  for (const pkgPath of packageFiles) {
    const result = updatePackageVersion(pkgPath, targetVersion, rootDir);
    if (result) {
      results.push(result);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('VERSION SYNCHRONIZATION COMPLETED');
  console.log('='.repeat(60));
  console.log(`📌 Target Version: ${targetVersion}`);
  console.log('📦 Summary:');

  results.forEach(({ name, oldVersion, newVersion, changed }) => {
    const status = changed ? '✅ Updated ' : '⚪ Unchanged';
    console.log(
      `   ${status} ${name.padEnd(30)}: ${oldVersion} → ${newVersion}`
    );
  });
  console.log('='.repeat(60));

  success(`Synchronized ${results.length} packages!`);
  return results;
}
