// Export types
export type {
  PackageJson,
  RepositoryConfig,
  BugsConfig,
  AuthorConfig,
  FundingConfig,
  PackageConfig,
  PackageConfigs,
  SyncResult,
  VersionSyncResult,
  SyncPackagesOptions,
  SyncVersionsOptions,
  MonosyncConfig,
} from './types.js';

// Export sync-packages functionality
export {
  syncPackages,
  loadTemplate,
  loadMonosyncConfig,
  reorderPackageJson,
  writePackageJson,
  discoverPackages,
  findPackageJsonFiles,
} from './sync-packages.js';

// Export sync-versions functionality
export {
  syncVersions,
  findAllPackages,
  updatePackageVersion,
  getRootVersion as getVersionFromRoot,
} from './sync-versions.js';
