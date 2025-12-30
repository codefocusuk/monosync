import fs from 'fs';
import path from 'path';
import type {
  PackageJson,
  PackageConfig,
  PackageConfigs,
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
 * Resolve the template path using multiple strategies
 */
export function resolveTemplatePath(
  rootDir: string,
  options: SyncPackagesOptions = {}
): string {
  // Priority 1: Explicit option
  if (options.templatePath) {
    const absolutePath = path.isAbsolute(options.templatePath)
      ? options.templatePath
      : path.join(rootDir, options.templatePath);
    if (fs.existsSync(absolutePath)) {
      return absolutePath;
    }
    error(`Template not found at specified path: ${options.templatePath}`);
    process.exit(1);
  }

  // Priority 2: Config file
  const config = loadMonosyncConfig(rootDir);
  if (config.templatePath) {
    const absolutePath = path.isAbsolute(config.templatePath)
      ? config.templatePath
      : path.join(rootDir, config.templatePath);
    if (fs.existsSync(absolutePath)) {
      return absolutePath;
    }
  }

  // Priority 3: Standard locations (in order of preference)
  const standardLocations = [
    path.join(rootDir, '.monosync', 'package-template.json'),
    path.join(rootDir, 'config', 'monosync', 'package-template.json'),
    path.join(rootDir, 'package-template.json'),
    // Legacy support for old location
    path.join(rootDir, 'scripts', 'build-system', 'package-template.json'),
  ];

  // If configDir is specified, check there first
  if (options.configDir) {
    const configDirPath = path.isAbsolute(options.configDir)
      ? options.configDir
      : path.join(rootDir, options.configDir);
    standardLocations.unshift(
      path.join(configDirPath, 'package-template.json')
    );
  }

  for (const location of standardLocations) {
    if (fs.existsSync(location)) {
      return location;
    }
  }

  error(
    'Could not find package-template.json. Please create one at:\n' +
      '  .monosync/package-template.json (recommended)\n' +
      '  Or specify path with --template flag or .monosyncrc.json'
  );
  process.exit(1);
}

/**
 * Resolve the configs path using multiple strategies
 */
export function resolveConfigsPath(
  rootDir: string,
  options: SyncPackagesOptions = {}
): string {
  // Priority 1: Explicit option
  if (options.configsPath) {
    const absolutePath = path.isAbsolute(options.configsPath)
      ? options.configsPath
      : path.join(rootDir, options.configsPath);
    if (fs.existsSync(absolutePath)) {
      return absolutePath;
    }
    error(`Configs not found at specified path: ${options.configsPath}`);
    process.exit(1);
  }

  // Priority 2: Config file
  const config = loadMonosyncConfig(rootDir);
  if (config.configsPath) {
    const absolutePath = path.isAbsolute(config.configsPath)
      ? config.configsPath
      : path.join(rootDir, config.configsPath);
    if (fs.existsSync(absolutePath)) {
      return absolutePath;
    }
  }

  // Priority 3: Standard locations (in order of preference)
  const standardLocations = [
    path.join(rootDir, '.monosync', 'package-configs.json'),
    path.join(rootDir, 'config', 'monosync', 'package-configs.json'),
    path.join(rootDir, 'package-configs.json'),
    // Legacy support for old location
    path.join(rootDir, 'scripts', 'build-system', 'package-configs.json'),
  ];

  // If configDir is specified, check there first
  if (options.configDir) {
    const configDirPath = path.isAbsolute(options.configDir)
      ? options.configDir
      : path.join(rootDir, options.configDir);
    standardLocations.unshift(path.join(configDirPath, 'package-configs.json'));
  }

  for (const location of standardLocations) {
    if (fs.existsSync(location)) {
      return location;
    }
  }

  error(
    'Could not find package-configs.json. Please create one at:\n' +
      '  .monosync/package-configs.json (recommended)\n' +
      '  Or specify path with --configs flag or .monosyncrc.json'
  );
  process.exit(1);
}

/**
 * Deep merge utility function that handles objects, arrays, and primitives
 */
export function deepMerge(target: any, source: any): any {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (Array.isArray(source[key])) {
        // For arrays, merge and deduplicate
        const targetArray = Array.isArray(result[key]) ? result[key] : [];
        result[key] = [...new Set([...targetArray, ...source[key]])];
      } else if (typeof source[key] === 'object' && source[key] !== null) {
        // For objects, recursively merge
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        // For primitives, override
        result[key] = source[key];
      }
    }
  }

  return result;
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
    error(`Could not read root package.json: ${(err as Error).message}`);
    process.exit(1);
  }
}

/**
 * Load the package template
 */
export function loadTemplate(
  rootDir: string,
  options: SyncPackagesOptions = {}
): PackageJson {
  try {
    const templatePath = resolveTemplatePath(rootDir, options);
    const template: PackageJson = JSON.parse(
      fs.readFileSync(templatePath, 'utf8')
    );

    // Remove template metadata fields
    delete template._template;
    delete template._version;

    return template;
  } catch (err) {
    error(`Could not load package template: ${(err as Error).message}`);
    process.exit(1);
  }
}

/**
 * Load package configurations
 */
export function loadConfigs(
  rootDir: string,
  options: SyncPackagesOptions = {}
): Record<string, PackageConfig> {
  try {
    const configsPath = resolveConfigsPath(rootDir, options);
    const configs: PackageConfigs = JSON.parse(
      fs.readFileSync(configsPath, 'utf8')
    );
    return configs.packages;
  } catch (err) {
    error(`Could not load package configs: ${(err as Error).message}`);
    process.exit(1);
  }
}

/**
 * Generate a complete package.json by merging template and config
 */
export function generatePackageJson(
  packageName: string,
  template: PackageJson,
  config: PackageConfig,
  version: string
): PackageJson {
  // Start with template as base
  let packageJson: PackageJson = { ...template };

  // Add package-specific fields
  packageJson.name = packageName;
  packageJson.version = version;

  // Deep merge package-specific configuration
  packageJson = deepMerge(packageJson, config);

  // Add repository directory - always merge repository info from template
  if (packageJson.repository && config.directory) {
    packageJson.repository = {
      ...packageJson.repository,
      directory: config.directory,
    };
  } else if (config.directory && !packageJson.repository) {
    // Only create repository if directory is specified and no repository exists
    // This allows templates to fully control repository config
    packageJson.repository = {
      type: 'git',
      url: 'https://github.com/example/repo.git',
      directory: config.directory,
    };
  }

  // Ensure proper field ordering
  const orderedFields: PackageJson = {
    name: packageJson.name,
    version: packageJson.version,
    private: packageJson.private,
    license: packageJson.license,
    description: packageJson.description,
    main: packageJson.main,
    module: packageJson.module,
    types: packageJson.types,
    repository: packageJson.repository,
    homepage: packageJson.homepage,
    bugs: packageJson.bugs,
    author: packageJson.author,
    contributors: packageJson.contributors,
    keywords: packageJson.keywords,
    funding: packageJson.funding,
    engines: packageJson.engines,
    exports: packageJson.exports,
    files: packageJson.files,
    scripts: packageJson.scripts,
    dependencies: packageJson.dependencies,
    devDependencies: packageJson.devDependencies,
    peerDependencies: packageJson.peerDependencies,
  };

  // Remove undefined fields
  Object.keys(orderedFields).forEach((key) => {
    if (orderedFields[key] === undefined) {
      delete orderedFields[key];
    }
  });

  return orderedFields;
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
 * Validate package structure before syncing
 */
export function validatePackageStructure(
  rootDir: string,
  options: SyncPackagesOptions = {}
): void {
  log('Validating package structure...');

  const configs = loadConfigs(rootDir, options);
  let hasErrors = false;

  for (const [packageName, config] of Object.entries(configs)) {
    if (!config.directory) {
      error(`Missing directory for ${packageName}`);
      hasErrors = true;
      continue;
    }

    const packageDir = path.join(rootDir, config.directory);
    if (!fs.existsSync(packageDir)) {
      error(`Directory does not exist: ${config.directory}`);
      hasErrors = true;
      continue;
    }

    if (!config.description) {
      error(`Missing description for ${packageName}`);
      hasErrors = true;
    }

    if (!config.main || !config.module || !config.types) {
      error(`Missing entry points (main/module/types) for ${packageName}`);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    error('Package structure validation failed');
    process.exit(1);
  }

  success('Package structure validation passed');
}

/**
 * Main synchronization function
 */
export function syncPackages(
  rootDir: string,
  options: SyncPackagesOptions = {}
): SyncResult[] {
  log('Starting package.json synchronization...');

  if (options.validate) {
    validatePackageStructure(rootDir, options);
  }

  const version = getRootVersion(rootDir);
  const template = loadTemplate(rootDir, options);
  const configs = loadConfigs(rootDir, options);

  const templatePath = resolveTemplatePath(rootDir, options);
  const configsPath = resolveConfigsPath(rootDir, options);

  log(`Root version: ${version}`);
  log(`Template: ${path.relative(rootDir, templatePath)}`);
  log(`Configs: ${path.relative(rootDir, configsPath)}`);
  log(`Loaded template with ${Object.keys(template).length} base fields`);
  log(`Found ${Object.keys(configs).length} package configurations`);

  const results: SyncResult[] = [];

  for (const [packageName, config] of Object.entries(configs)) {
    log(`Processing ${packageName}...`);

    if (!config.directory) {
      error(`No directory specified for ${packageName}`);
      continue;
    }

    const packagePath = path.join(rootDir, config.directory, 'package.json');
    const packageJson = generatePackageJson(
      packageName,
      template,
      config,
      version
    );

    const syncSuccess = writePackageJson(packagePath, packageJson);

    results.push({
      name: packageName,
      directory: config.directory,
      success: syncSuccess,
    });

    if (syncSuccess) {
      log(`✅ ${packageName} updated successfully`);
    } else {
      log(`❌ ${packageName} failed to update`);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('PACKAGE SYNCHRONIZATION COMPLETED');
  console.log('='.repeat(70));
  console.log(`📌 Version: ${version}`);
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
