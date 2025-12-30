# @codefocus/monosync

[![npm version](https://img.shields.io/npm/v/@codefocus/monosync.svg)](https://www.npmjs.com/package/@codefocus/monosync)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D14.0.0-green.svg)](https://nodejs.org/)

**Keep your monorepo package.json files consistent with automatic field ordering and version synchronization**

Simple, lightweight tools for maintaining consistency across monorepo packages.

---

## Why this exists

Managing multiple packages in a monorepo leads to inconsistency:

- **Inconsistent field ordering** — Different packages have fields in different orders
- **Version drift** — Keeping package versions synchronized manually is tedious
- **Manual maintenance** — Updating common fields across packages is error-prone

`@codefocus/monosync` solves these problems by:

- **Auto-discovering packages** — No configuration needed, works with pnpm/yarn/npm workspaces
- **Preserving all values** — Never overwrites your package.json content
- **Reordering fields** — Maintains consistent field order across all packages
- **Syncing versions** — One command to align all package versions
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
    "sync": "sync-packages && sync-versions"
  }
}
```

---

## Quick Start

That's it! Just run:

```bash
npm run sync
```

This will:
1. Auto-discover all packages in your monorepo
2. Reorder package.json fields to a consistent order
3. Synchronize all package versions with the root version

**No configuration files needed.**

---

## What It Does

### sync-packages

**Reorders package.json fields** to maintain consistency across your monorepo.

- Auto-discovers packages from `pnpm-workspace.yaml` or scans standard directories (`packages/`, `apps/`, `libs/`)
- Reads each package.json and **preserves all values**
- Reorders fields to a standard order:
  - `name`, `version`, `private`, `type`, `license`, `description`
  - `main`, `module`, `types`
  - `repository`, `homepage`, `bugs`, `author`, `contributors`
  - `keywords`, `funding`, `engines`
  - `exports`, `files`, `scripts`
  - `dependencies`, `devDependencies`, `peerDependencies`, `peerDependenciesMeta`
- Writes back with consistent formatting (2-space indentation, trailing newline)

**Important:** This tool does NOT modify your values - it only reorders fields for consistency.

### sync-versions

**Synchronizes package versions** across your monorepo.

- Recursively finds all package.json files
- Reads version from root package.json
- Updates all child package versions
- Reports which packages changed

---

## Optional: Template for Common Fields

You can optionally provide a template to add missing common fields (like `repository`, `author`, `engines`):

Create `.monosync/package-template.json`:

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
    "node": ">=18.0.0"
  }
}
```

Now `sync-packages` will:
1. Reorder all fields
2. Add missing common fields from the template (without overwriting existing values)

The template is **completely optional** - sync-packages works fine without it.

---

## CLI Usage

### sync-packages

```bash
# Auto-discover and reorder all package.json files
sync-packages

# Use a template for adding missing common fields
sync-packages --template .monosync/package-template.json

# Show help
sync-packages --help
```

**Options:**
- `--template <path>` - Path to package-template.json (optional)
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

Use as a library in your build scripts:

```typescript
import { syncPackages, syncVersions } from '@codefocus/monosync';

// Reorder package.json fields (auto-discovers packages)
const results = syncPackages(process.cwd());

// Reorder and add missing common fields from template
const resultsWithTemplate = syncPackages(process.cwd(), {
  templatePath: '.monosync/package-template.json',
});

// Synchronize versions
const versionResults = syncVersions(process.cwd(), {
  targetVersion: '2.0.0', // optional
});
```

### API Reference

#### syncPackages(rootDir, options?)

Reorders package.json fields across your monorepo.

**Parameters:**
- `rootDir` (string) — Path to monorepo root
- `options` (object, optional)
  - `templatePath` (string) — Path to template for adding missing common fields

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

## How It Works

### sync-packages

1. **Auto-discover** — Reads `pnpm-workspace.yaml` or scans `packages/`, `apps/`, `libs/` directories
2. **Read** — Loads each package.json
3. **Reorder** — Reorders fields to standard order
4. **Add template fields** (optional) — Adds missing common fields from template if provided
5. **Write** — Writes formatted package.json back to disk
6. **Report** — Shows success/failure summary

### sync-versions

1. **Scan** — Recursively finds all package.json files
2. **Filter** — Excludes node_modules and root package.json
3. **Read** — Gets target version from root or command line
4. **Update** — Updates version field in each package.json
5. **Report** — Shows which packages changed

---

## Comparison with Alternatives

### Manual updates
- ❌ Tedious and error-prone
- ❌ Easy to miss packages
- ❌ Inconsistent field ordering

### Massive config files
- ❌ Duplicate all package.json content
- ❌ Maintain two sources of truth
- ❌ Values get out of sync

### @codefocus/monosync
- ✅ Zero configuration required
- ✅ Auto-discovers packages
- ✅ Preserves all values
- ✅ Only reorders fields for consistency
- ✅ Optional template for missing fields
- ✅ TypeScript support

### Workspace protocols (pnpm/yarn/npm)
- These handle dependency management
- monosync handles consistency and version synchronization
- Use both together for complete monorepo management

---

## Who is this for?

- Teams maintaining monorepos with multiple packages
- Projects using pnpm/yarn/npm workspaces
- Anyone wanting consistent package.json formatting
- CI/CD pipelines that need synchronized versions
- Projects that want automation without complex configuration

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

### v0.2.0

**BREAKING CHANGES:**
- Completely redesigned `sync-packages` to only reorder fields (no longer requires package-configs.json)
- Auto-discovers packages from workspace configuration
- Template is now optional and only adds missing common fields
- Removed `validate` command and complex configuration options

**Migration from v0.1.x:**
- Remove `package-configs.json` (no longer needed)
- Keep `package-template.json` if you want to add missing common fields (now optional)
- Update scripts: `sync-packages` now auto-discovers packages

### v0.1.0

- Initial release with template-based package synchronization

---

## License

MIT © [CodeFocus](https://codefocus.co.uk)

---

## Support

- [Documentation](https://github.com/codefocusuk/monosync#readme)
- [Issue Tracker](https://github.com/codefocusuk/monosync/issues)
- [npm Package](https://www.npmjs.com/package/@codefocus/monosync)
