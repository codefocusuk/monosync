export interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  main?: string;
  module?: string;
  types?: string;
  private?: boolean;
  license?: string;
  repository?: RepositoryConfig;
  homepage?: string;
  bugs?: BugsConfig;
  author?: AuthorConfig;
  contributors?: AuthorConfig[];
  keywords?: string[];
  funding?: FundingConfig | FundingConfig[];
  engines?: Record<string, string>;
  exports?: Record<string, any>;
  files?: string[];
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  [key: string]: any;
}

export interface RepositoryConfig {
  type: string;
  url: string;
  directory?: string;
}

export interface BugsConfig {
  url: string;
  email?: string;
}

export interface AuthorConfig {
  name: string;
  email?: string;
  url?: string;
}

export interface FundingConfig {
  type?: string;
  url: string;
}

export interface PackageConfig {
  directory: string;
  description?: string;
  main?: string;
  module?: string;
  types?: string;
  exports?: Record<string, any>;
  files?: string[];
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  keywords?: string[];
  [key: string]: any;
}

export interface PackageConfigs {
  packages: Record<string, PackageConfig>;
}

export interface SyncResult {
  name: string;
  directory: string;
  success: boolean;
}

export interface VersionSyncResult {
  name: string;
  oldVersion: string;
  newVersion: string;
  changed: boolean;
}

export interface MonosyncConfig {
  templatePath?: string;
  configsPath?: string;
}

export interface SyncPackagesOptions {
  validate?: boolean;
  verbose?: boolean;
  templatePath?: string;
  configsPath?: string;
  configDir?: string;
}

export interface SyncVersionsOptions {
  verbose?: boolean;
  targetVersion?: string;
}
