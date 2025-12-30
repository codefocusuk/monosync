# @codefocus/monosync

[![npm version](https://img.shields.io/npm/v/@codefocus/monosync.svg)](https://www.npmjs.com/package/@codefocus/monosync)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D14.0.0-green.svg)](https://nodejs.org/)

**Synchronize package.json files across monorepo workspaces with template-based configuration and version management**

Keep your monorepo packages consistent and up-to-date with automated synchronization of package.json fields and versions.

---

## Why this exists

Managing multiple packages in a monorepo is challenging:

- **Inconsistent metadata** — Different packages have different authors, licenses, or repository URLs
- **Version drift** — Keeping package versions synchronized with the root version
- **Manual updates** — Updating common fields across all packages is tedious and error-prone
- **Configuration sprawl** — Each package needs similar but slightly different configurations

`@codefocus/monosync` solves these problems with:

- **Template-based synchronization** — Define common fields once, apply everywhere
- **Per-package customization** — Override or extend template fields for specific packages
- **Automatic version sync** — Keep all package versions aligned with a single command
- **Flexible configuration** — Multiple ways to configure (CLI flags, config file, or standard locations)
- **Deep merge support** — Intelligently merge nested objects and arrays
- **Zero dependencies** — Lightweight and fast
- **TypeScript + CLI** — Use as a library or command-line tool

---

## Installation

Install as a dev dependency in your monorepo root:

```bash
npm install -D @codefocus/monosync
# or
yarn add -D @codefocus/monosync
# or
pnpm add -D @codefocus/monosync
```

Add scripts to your root `package.json`:

```json
{
  "scripts": {
    "sync:packages": "sync-packages",
    "sync:versions": "sync-versions"
  }
}
```

---

## Quick Start

### 1. Create configuration files

Create a `.monosync` directory in your project root:

```bash
mkdir .monosync
```

Create `.monosync/package-template.json` with common fields:

```json
{
  "license": "MIT",
  "author": {
    "name": "Your Name",
    "url": "https://yoursite.com"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/yourorg/yourrepo.git"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
```

Create `.monosync/package-configs.json` with per-package configurations:

```json
{
  "packages": {
    "@yourscope/package-a": {
      "directory": "packages/package-a",
      "description": "Package A description",
      "main": "./dist/index.js",
      "module": "./dist/index.mjs",
      "types": "./dist/index.d.ts"
    }
  }
}
```

### 2. Synchronize package.json files

```bash
npm run sync:packages
```

### 3. Synchronize all package versions

```bash
npm run sync:versions
```

---

## Configuration

`monosync` provides three flexible ways to configure paths:

### 1. Standard Locations (Recommended)

Place your configuration files in one of these locations (checked in order):

1. `.monosync/package-template.json` and `.monosync/package-configs.json` **(recommended)**
2. `config/monosync/package-template.json` and `config/monosync/package-configs.json`
3. `package-template.json` and `package-configs.json` (root directory)
4. `scripts/build-system/` (legacy support)

### 2. Configuration File

Create `.monosyncrc.json` in your project root:

```json
{
  "templatePath": "custom/path/template.json",
  "configsPath": "custom/path/configs.json"
}
```

### 3. CLI Flags

Override paths via command-line flags:

```bash
# Specify config directory
sync-packages --config-dir .monosync

# Specify individual files
sync-packages --template custom/template.json --configs custom/configs.json
```

### Priority Order

Configuration is resolved in this order (highest priority first):

1. CLI flags (`--template`, `--configs`, `--config-dir`)
2. `.monosyncrc.json` file
3. Standard locations

---

## Features

### sync-packages

Synchronizes package.json files based on a template and per-package configurations.

**What it does:**
- Loads a shared template with common fields (author, license, repository, etc.)
- Merges per-package configurations (entry points, dependencies, scripts)
- Generates complete package.json files with proper field ordering
- Validates package structure before synchronization
- Reports success/failure for each package

**Project Structure:**

```
your-monorepo/
├── package.json (root version)
├── .monosync/
│   ├── package-template.json
│   └── package-configs.json
└── packages/
    ├── package-a/
    │   └── package.json
    └── package-b/
        └── package.json
```

**Example `package-template.json`:**

```json
{
  "license": "MIT",
  "author": {
    "name": "Your Name",
    "url": "https://yoursite.com"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/yourorg/yourrepo.git"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
```

**Example `package-configs.json`:**

```json
{
  "packages": {
    "@yourscope/package-a": {
      "directory": "packages/package-a",
      "description": "Package A description",
      "main": "./dist/index.js",
      "module": "./dist/index.mjs",
      "types": "./dist/index.d.ts",
      "dependencies": {
        "some-lib": "^1.0.0"
      }
    },
    "@yourscope/package-b": {
      "directory": "packages/package-b",
      "description": "Package B description",
      "main": "./dist/index.js",
      "module": "./dist/index.mjs",
      "types": "./dist/index.d.ts"
    }
  }
}
```

### sync-versions

Recursively finds all package.json files and synchronizes their versions.

**What it does:**
- Scans entire project for package.json files (excludes node_modules)
- Reads version from root package.json
- Updates all child package versions
- Reports which packages changed and which stayed the same
- Skips the root package.json itself

**Usage:**

```bash
# Use root package.json version
sync-versions

# Use a specific version
sync-versions --version 2.0.0
```

---

## CLI Usage

### sync-packages

```bash
# Synchronize all packages (default location)
sync-packages

# Synchronize with custom config directory
sync-packages --config-dir custom/path

# Synchronize with custom files
sync-packages --template custom/template.json --configs custom/configs.json

# Validate structure without syncing
sync-packages validate

# Show help
sync-packages --help
```

**Options:**
- `--template <path>` - Path to package-template.json
- `--configs <path>` - Path to package-configs.json
- `--config-dir <path>` - Directory containing both files
- `-h, --help` - Show help message
- `-v, --version` - Show version number

### sync-versions

```bash
# Sync versions from root package.json
sync-versions

# Use a specific version
sync-versions --version 1.2.3

# Show help
sync-versions --help
```

---

## Programmatic Usage

You can also use these tools as a library in your build scripts:

```typescript
import { syncPackages, syncVersions } from '@codefocus/monosync';

// Synchronize packages (uses default locations)
const results = syncPackages(process.cwd(), {
  validate: true,
});

// Synchronize packages with custom paths
const customResults = syncPackages(process.cwd(), {
  validate: true,
  templatePath: 'custom/template.json',
  configsPath: 'custom/configs.json',
});

// Synchronize versions
const versionResults = syncVersions(process.cwd(), {
  targetVersion: '2.0.0', // optional
});
```

### API Reference

#### syncPackages(rootDir, options?)

Synchronizes package.json files based on template and configs.

**Parameters:**
- `rootDir` (string) — Path to monorepo root
- `options` (object, optional)
  - `validate` (boolean) — Run validation before sync
  - `verbose` (boolean) — Enable verbose logging
  - `templatePath` (string) — Custom template path
  - `configsPath` (string) — Custom configs path
  - `configDir` (string) — Directory containing both files

**Returns:** `SyncResult[]`

#### syncVersions(rootDir, options?)

Synchronizes package versions across the monorepo.

**Parameters:**
- `rootDir` (string) — Path to monorepo root
- `options` (object, optional)
  - `targetVersion` (string) — Use this version instead of root package.json
  - `verbose` (boolean) — Enable verbose logging

**Returns:** `VersionSyncResult[]`

---

## How it Works

### sync-packages

1. **Resolve paths** — Checks CLI flags, .monosyncrc.json, then standard locations
2. **Load template** — Reads shared configuration template
3. **Load configs** — Reads per-package configurations
4. **Validate** (optional) — Checks that all directories and required fields exist
5. **Generate** — For each package:
   - Starts with template as base
   - Deep merges package-specific config
   - Adds package name and version
   - Orders fields properly
6. **Write** — Writes formatted package.json to each package directory
7. **Report** — Shows success/failure summary

### sync-versions

1. **Scan** — Recursively finds all package.json files
2. **Filter** — Excludes node_modules and root package.json
3. **Read** — Gets target version from root or command line
4. **Update** — Updates version field in each package.json
5. **Report** — Shows which packages changed

---

## Configuration Examples

### Monorepo with shared dependencies

```json
{
  "packages": {
    "@myorg/core": {
      "directory": "packages/core",
      "description": "Core library",
      "main": "./dist/index.js",
      "types": "./dist/index.d.ts",
      "dependencies": {
        "some-lib": "^1.0.0"
      }
    },
    "@myorg/utils": {
      "directory": "packages/utils",
      "description": "Utility functions",
      "main": "./dist/index.js",
      "types": "./dist/index.d.ts",
      "dependencies": {
        "@myorg/core": "workspace:*"
      }
    }
  }
}
```

### Private and public packages

```json
{
  "packages": {
    "@myorg/internal": {
      "directory": "packages/internal",
      "description": "Internal tooling",
      "private": true,
      "main": "./dist/index.js"
    },
    "@myorg/public": {
      "directory": "packages/public",
      "description": "Public API",
      "main": "./dist/index.js",
      "keywords": ["api", "public"]
    }
  }
}
```

### Custom configuration locations

**.monosyncrc.json:**
```json
{
  "templatePath": "build-config/shared-template.json",
  "configsPath": "build-config/package-overrides.json"
}
```

---

## Comparison with Alternatives

### Manual updates
- ❌ Tedious and error-prone
- ❌ Easy to miss packages
- ❌ No validation

### @codefocus/monosync
- ✅ Automated and consistent
- ✅ Template-based with per-package overrides
- ✅ Built-in validation
- ✅ TypeScript support
- ✅ Flexible configuration

### Workspace protocols (pnpm/yarn/npm)
- These handle dependency management
- monosync handles metadata and version synchronization
- Use both together for complete monorepo management

---

## Who is this for?

- Teams maintaining monorepos with multiple packages
- Projects using pnpm/yarn/npm workspaces
- Anyone needing consistent package.json metadata
- CI/CD pipelines that need synchronized versions
- Projects that want flexible configuration without being opinionated

---

## Development

### Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Watch mode for development
npm run dev

# Run tests
npm test
```

### Project Structure

```
src/
├── bin/
│   ├── sync-packages.ts    # CLI for package sync
│   └── sync-versions.ts    # CLI for version sync
└── lib/
    ├── sync-packages.ts    # Package sync logic
    ├── sync-versions.ts    # Version sync logic
    ├── types.ts            # TypeScript definitions
    └── index.ts            # Public API exports
```

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.

---

## License

MIT © [CodeFocus](https://codefocus.co.uk)

---

## Support

- [Documentation](https://github.com/codefocusuk/monosync#readme)
- [Issue Tracker](https://github.com/codefocusuk/monosync/issues)
- [npm Package](https://www.npmjs.com/package/@codefocus/monosync)
