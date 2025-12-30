# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Flexible configuration paths** — No longer opinionated about directory structure
  - Support for `.monosyncrc.json` configuration file
  - CLI flags for custom paths (`--template`, `--configs`, `--config-dir`)
  - Multiple standard locations checked automatically (`.monosync/`, `config/monosync/`, root)
  - Legacy support for `scripts/build-system/` location
- Configuration resolution priority: CLI flags > .monosyncrc.json > standard locations
- New exported functions: `loadMonosyncConfig()`, `resolveTemplatePath()`, `resolveConfigsPath()`
- `MonosyncConfig` type for configuration file structure

### Changed

- **BREAKING**: `syncPackages()` signature changed from `(rootDir, scriptsDir, options)` to `(rootDir, options)`
- **BREAKING**: `validatePackageStructure()` signature changed to `(rootDir, options)`
- **BREAKING**: `loadTemplate()` and `loadConfigs()` now take `(rootDir, options)` instead of `scriptsDir`
- Recommended configuration directory is now `.monosync/` instead of `scripts/build-system/`
- CLI help text updated to reflect new configuration options
- README completely rewritten with flexible configuration examples

### Improved

- Better error messages when configuration files not found
- Shows which template and config files are being used during sync
- More flexible for different project structures and preferences

## [0.1.0] - 2025-12-30

### Added

- Initial release of `@codefocus/monosync`
- `sync-packages` command for template-based package.json synchronization
  - Deep merge support for nested objects and arrays
  - Per-package configuration overrides
  - Built-in validation for package structure
  - Proper field ordering in generated package.json files
- `sync-versions` command for automatic version synchronization
  - Recursive scanning of all package.json files
  - Excludes node_modules and root package.json
  - Option to specify custom target version
- TypeScript support with full type definitions
- CLI tools with help and version commands
- Comprehensive documentation and examples
- Zero runtime dependencies

### Features

- Template-based package synchronization
- Automatic version management across monorepo
- Deep merge with array deduplication
- Cross-platform support (Windows, macOS, Linux)
- Programmatic API for build scripts
- Validation mode to check structure before syncing

[0.1.0]: https://github.com/codefocusuk/monosync/releases/tag/v0.1.0
