#!/usr/bin/env node

import { fileURLToPath } from 'url';
import path from 'path';
import process from 'process';
import fs from 'fs';
import { syncPackages } from '../lib/sync-packages.js';
import type { SyncPackagesOptions } from '../lib/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = process.cwd();

function printUsage(): void {
  console.log(`
Usage: sync-packages [options]

Description:
  Reorders package.json fields across your monorepo to maintain consistency.
  Automatically discovers packages from pnpm-workspace.yaml or scans common directories.
  Optionally adds missing common fields from a template.

Options:
  --template <path>     Path to package-template.json (optional)
  -h, --help            Show this help message
  -v, --version         Show version number

How it works:
  1. Auto-discovers all package.json files in your workspace
  2. Reads each package.json preserving all values
  3. Reorders fields to a standard order for consistency
  4. Optionally adds missing common fields from template (repository, author, etc.)
  5. Writes back with consistent formatting

Template (optional):
  If provided, the template adds missing common fields like repository, author, engines, etc.
  The template does NOT override existing values - it only fills in missing fields.

  Standard template locations:
    - .monosync/package-template.json (recommended)
    - config/monosync/package-template.json
    - package-template.json (root)

Examples:
  # Reorder all package.json files
  sync-packages

  # Reorder and add missing fields from template
  sync-packages --template .monosync/package-template.json
  `);
}

function printVersion(): void {
  const toolPackagePath = path.join(__dirname, '../../package.json');
  try {
    const pkg = JSON.parse(fs.readFileSync(toolPackagePath, 'utf8'));
    console.log(`sync-packages v${pkg.version}`);
  } catch {
    console.log('sync-packages (version unknown)');
  }
}

function parseArgs(args: string[]): SyncPackagesOptions {
  const options: SyncPackagesOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-h' || arg === '--help') {
      printUsage();
      process.exit(0);
    }

    if (arg === '-v' || arg === '--version') {
      printVersion();
      process.exit(0);
    }

    if (arg === '--template' && args[i + 1]) {
      options.templatePath = args[i + 1];
      i++;
      continue;
    }
  }

  return options;
}

function main(): void {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  syncPackages(ROOT_DIR, options);
}

main();
