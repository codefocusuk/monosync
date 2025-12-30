#!/usr/bin/env node

import { fileURLToPath } from 'url';
import path from 'path';
import process from 'process';
import fs from 'fs';
import { syncVersions } from '../lib/sync-versions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The root directory is the current working directory
const ROOT_DIR = process.cwd();

function printUsage(): void {
  console.log(`
Usage: sync-versions [options]

Options:
  --version <ver>   Use a specific version instead of root package.json
  -h, --help        Show this help message
  -v, --version     Show tool version number

Description:
  Recursively finds all package.json files in the project (excluding node_modules)
  and updates their version to match the root package.json version.

  By default, reads version from the root package.json.
  Use --version to specify a different version.
  `);
}

function printVersion(): void {
  // Read version from the package.json of this tool
  const toolPackagePath = path.join(__dirname, '../../package.json');
  try {
    const pkg = JSON.parse(fs.readFileSync(toolPackagePath, 'utf8'));
    console.log(`sync-versions v${pkg.version}`);
  } catch {
    console.log('sync-versions (version unknown)');
  }
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.includes('-h') || args.includes('--help')) {
    printUsage();
    process.exit(0);
  }

  if (args.includes('-v') && args.length === 1) {
    printVersion();
    process.exit(0);
  }

  let targetVersion: string | undefined;

  // Parse --version argument
  const versionIndex = args.indexOf('--version');
  if (versionIndex !== -1 && args[versionIndex + 1]) {
    targetVersion = args[versionIndex + 1];
  }

  syncVersions(ROOT_DIR, { targetVersion });
}

main();
