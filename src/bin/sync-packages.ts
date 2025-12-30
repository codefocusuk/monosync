#!/usr/bin/env node

import { fileURLToPath } from 'url';
import path from 'path';
import process from 'process';
import fs from 'fs';
import { syncPackages, validatePackageStructure } from '../lib/sync-packages.js';
import type { SyncPackagesOptions } from '../lib/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = process.cwd();

function printUsage(): void {
  console.log(`
Usage: sync-packages [command] [options]

Commands:
  sync              Synchronize all package.json files (default)
  validate          Validate package structure without syncing

Options:
  --template <path>     Path to package-template.json
  --configs <path>      Path to package-configs.json
  --config-dir <path>   Directory containing both template and configs
  -h, --help            Show this help message
  -v, --version         Show version number

Configuration:
  monosync looks for configuration files in the following locations (in order):

  1. Command-line flags (--template, --configs, or --config-dir)
  2. .monosyncrc.json in project root
  3. Standard locations:
     - .monosync/package-template.json (recommended)
     - .monosync/package-configs.json
     - config/monosync/package-template.json
     - config/monosync/package-configs.json
     - package-template.json (root)
     - package-configs.json (root)

Example .monosyncrc.json:
  {
    "templatePath": ".monosync/package-template.json",
    "configsPath": ".monosync/package-configs.json"
  }

Examples:
  # Use default locations
  sync-packages

  # Specify config directory
  sync-packages --config-dir .monosync

  # Specify individual files
  sync-packages --template custom/template.json --configs custom/configs.json
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

function parseArgs(args: string[]): {
  command: string | undefined;
  options: SyncPackagesOptions;
} {
  let command: string | undefined;
  const options: SyncPackagesOptions = { validate: true };

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

    if (arg === '--configs' && args[i + 1]) {
      options.configsPath = args[i + 1];
      i++;
      continue;
    }

    if (arg === '--config-dir' && args[i + 1]) {
      options.configDir = args[i + 1];
      i++;
      continue;
    }

    if (!arg.startsWith('-') && !command) {
      command = arg;
    }
  }

  return { command, options };
}

function main(): void {
  const args = process.argv.slice(2);
  const { command, options } = parseArgs(args);

  switch (command) {
    case 'validate':
      validatePackageStructure(ROOT_DIR, options);
      break;
    case 'sync':
    case undefined:
      syncPackages(ROOT_DIR, options);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

main();
