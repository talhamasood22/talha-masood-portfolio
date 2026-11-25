/**
 * tests/e2e/runner.js
 * Central E2E Test Runner CLI for Talha Masood Portfolio.
 * Pure Node.js (zero external npm dependencies).
 * Supports CLI flags: --tier <1|2|3|4>, --feature <id>, --filter <keyword>, --workspace <dir>, --bail, --help.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { engine } = require('./harness/engine');
const { colors } = require('./harness/colors');
const { registerTier1 } = require('./tier1-feature-coverage.test');
const { registerTier2 } = require('./tier2-boundary-corner.test');
const { registerTier3 } = require('./tier3-cross-feature.test');
const { registerTier4 } = require('./tier4-application-scenarios.test');

const VALID_TIERS = ['1', '2', '3', '4'];

/**
 * Robust Workspace Directory Auto-Discovery:
 * Resolves portfolio repository root whether invoked from workspace root,
 * an internal subfolder (e.g. tests/e2e), or a foreign working directory (e.g. /tmp).
 */
function resolveWorkspaceDir(customDir = null) {
  if (customDir) {
    const resolved = path.resolve(customDir);
    if (fs.existsSync(resolved)) {
      return resolved;
    }
  }

  const cwd = process.cwd();
  // 1. Check if current working directory contains portfolio indicators
  if (
    fs.existsSync(path.join(cwd, 'package.json')) &&
    (fs.existsSync(path.join(cwd, 'src/data/portfolio.ts')) ||
     fs.existsSync(path.join(cwd, 'src/app/layout.tsx')) ||
     fs.existsSync(path.join(cwd, 'next.config.mjs')))
  ) {
    return cwd;
  }

  // 2. Fallback relative to tests/e2e directory (__dirname is tests/e2e)
  const repoRoot = path.resolve(__dirname, '../..');
  if (
    fs.existsSync(path.join(repoRoot, 'package.json')) &&
    (fs.existsSync(path.join(repoRoot, 'src/data/portfolio.ts')) ||
     fs.existsSync(path.join(repoRoot, 'src/app/layout.tsx')) ||
     fs.existsSync(path.join(repoRoot, 'next.config.mjs')))
  ) {
    return repoRoot;
  }

  // 3. Fallback if package.json exists in repoRoot
  if (fs.existsSync(path.join(repoRoot, 'package.json'))) {
    return repoRoot;
  }

  // 4. Default fallback to cwd
  return cwd;
}

function parseArgs(args) {
  const options = {
    tier: null,
    feature: null,
    filter: null,
    workspace: null,
    bail: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--bail' || arg === '-b') {
      options.bail = true;
    } else if (arg === '--tier' || arg === '-t') {
      options.tier = args[++i];
    } else if (arg.startsWith('--tier=')) {
      options.tier = arg.split('=')[1];
    } else if (arg === '--feature' || arg === '-f') {
      options.feature = args[++i];
    } else if (arg.startsWith('--feature=')) {
      options.feature = arg.split('=')[1];
    } else if (arg === '--filter' || arg === '-k') {
      options.filter = args[++i];
    } else if (arg.startsWith('--filter=')) {
      options.filter = arg.split('=')[1];
    } else if (arg === '--workspace' || arg === '-w') {
      options.workspace = args[++i];
    } else if (arg.startsWith('--workspace=')) {
      options.workspace = arg.split('=')[1];
    } else if (arg.startsWith('-')) {
      console.error(colors ? colors.red(`Error: Unrecognized option "${arg}". Use --help for usage information.`) : `Error: Unrecognized option "${arg}". Use --help for usage information.`);
      process.exit(1);
    }
  }

  return options;
}

function validateArgs(options) {
  // Validate --tier flag
  if (options.tier !== null) {
    if (options.tier === undefined || options.tier === '' || options.tier === true) {
      console.error(colors ? colors.red('Error: Flag --tier requires a value. Must be 1, 2, 3, or 4.') : 'Error: Flag --tier requires a value. Must be 1, 2, 3, or 4.');
      process.exit(1);
    }
    const normalizedTier = String(options.tier).trim();
    if (!VALID_TIERS.includes(normalizedTier)) {
      console.error(colors ? colors.red(`Error: Invalid tier "${options.tier}". Must be 1, 2, 3, or 4.`) : `Error: Invalid tier "${options.tier}". Must be 1, 2, 3, or 4.`);
      process.exit(1);
    }
    options.tier = normalizedTier;
  }

  // Validate --feature flag
  if (options.feature !== null) {
    if (options.feature === undefined || options.feature === '' || options.feature === true) {
      console.error(colors ? colors.red('Error: Flag --feature requires a value (e.g. F1, F6, F_CROSS, F_SCENARIOS).') : 'Error: Flag --feature requires a value (e.g. F1, F6, F_CROSS, F_SCENARIOS).');
      process.exit(1);
    }
    options.feature = String(options.feature).trim();
  }

  // Validate --filter flag
  if (options.filter !== null) {
    if (options.filter === undefined || options.filter === '' || options.filter === true) {
      console.error(colors ? colors.red('Error: Flag --filter requires a value (e.g. "Docker").') : 'Error: Flag --filter requires a value (e.g. "Docker").');
      process.exit(1);
    }
    options.filter = String(options.filter).trim();
  }

  // Validate --workspace flag
  if (options.workspace !== null) {
    if (options.workspace === undefined || options.workspace === '' || options.workspace === true) {
      console.error(colors ? colors.red('Error: Flag --workspace requires a directory path.') : 'Error: Flag --workspace requires a directory path.');
      process.exit(1);
    }
  }
}

function showHelp() {
  console.log(`
Talha Masood Portfolio — E2E Test Suite Runner

Usage:
  node tests/e2e/runner.js [options]

Options:
  --tier, -t <1|2|3|4>     Run only tests in specified tier (1: Feature, 2: Boundary, 3: Cross, 4: Scenarios)
  --feature, -f <id>       Filter tests by feature ID (e.g. F1, F6, F13, F_CROSS, F_SCENARIOS)
  --filter, -k <keyword>   Filter tests by substring match on test name
  --workspace, -w <dir>    Explicitly specify workspace directory (auto-discovered by default)
  --bail, -b               Stop execution on first test failure
  --help, -h               Show this help message

Examples:
  node tests/e2e/runner.js
  node tests/e2e/runner.js --tier 1
  node tests/e2e/runner.js --feature F6
  node tests/e2e/runner.js --filter "Docker"
`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  validateArgs(options);

  const workspaceDir = resolveWorkspaceDir(options.workspace);

  // Synchronize process working directory to discovered workspace
  try {
    process.chdir(workspaceDir);
  } catch {
    // If chdir fails (e.g. restricted environment), proceed with resolved path
  }

  // Register all 4 tiers with resolved workspace directory
  registerTier1(engine, workspaceDir);
  registerTier2(engine, workspaceDir);
  registerTier3(engine, workspaceDir);
  registerTier4(engine, workspaceDir);

  const passed = await engine.run({ ...options, workspaceDir });

  // Guard against zero-test executions
  if (engine.stats.total === 0) {
    const hasFilter = Boolean(options.tier || options.feature || options.filter);
    if (hasFilter) {
      const filters = [];
      if (options.tier) filters.push(`tier: ${options.tier}`);
      if (options.feature) filters.push(`feature: ${options.feature}`);
      if (options.filter) filters.push(`filter: "${options.filter}"`);
      console.error(colors ? colors.red(`\nError: Filter criteria matched 0 tests (${filters.join(', ')}).`) : `\nError: Filter criteria matched 0 tests (${filters.join(', ')}).`);
    } else {
      console.error(colors ? colors.red('\nError: No tests were executed.') : '\nError: No tests were executed.');
    }
    process.exit(1);
  }

  process.exit(passed ? 0 : 1);
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal Test Runner Exception:', err);
    process.exit(1);
  });
}

module.exports = {
  main,
  parseArgs,
  validateArgs,
  resolveWorkspaceDir,
  VALID_TIERS
};
