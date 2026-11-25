/**
 * tests/e2e/harness/engine.js
 * Pure Node.js hierarchical test engine and runner.
 * Zero external npm dependencies.
 */

'use strict';

const assert = require('node:assert');
const { colors } = require('./colors');

class TestEngine {
  constructor(options = {}) {
    this.tiers = [];
    this.currentTier = null;
    this.currentFeature = null;
    this.options = options;
    this.stats = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      perTier: {}
    };
    this.failures = [];
  }

  tier(number, title, fn) {
    const t = {
      number,
      title,
      features: []
    };
    this.tiers.push(t);
    const prevTier = this.currentTier;
    this.currentTier = t;
    if (typeof fn === 'function') {
      fn();
    }
    this.currentTier = prevTier;
  }

  feature(id, title, fn) {
    if (!this.currentTier) {
      throw new Error(`feature() must be called inside tier() block (called for ${id})`);
    }
    const f = {
      id,
      title,
      tests: []
    };
    this.currentTier.features.push(f);
    const prevFeature = this.currentFeature;
    this.currentFeature = f;
    if (typeof fn === 'function') {
      fn();
    }
    this.currentFeature = prevFeature;
  }

  test(name, fn) {
    if (!this.currentFeature) {
      throw new Error(`test() must be called inside feature() block (called for "${name}")`);
    }
    this.currentFeature.tests.push({
      name,
      fn,
      tier: this.currentTier.number,
      featureId: this.currentFeature.id
    });
  }

  formatError(error) {
    if (!error) return 'Unknown error';
    const lines = [];
    const message = error.message || String(error);
    lines.push(colors.red(colors.bold(`Error: ${message}`)));

    if (error.expected !== undefined || error.actual !== undefined) {
      lines.push(colors.dim('  Expected: ') + colors.green(JSON.stringify(error.expected)));
      lines.push(colors.dim('  Actual:   ') + colors.red(JSON.stringify(error.actual)));
    }

    if (error.diagnostic) {
      lines.push(colors.dim('  Diagnostic: ') + colors.yellow(JSON.stringify(error.diagnostic, null, 2)));
    }

    if (error.stack) {
      const stackLines = error.stack
        .split('\n')
        .slice(1, 5)
        .map(l => colors.dim('    ' + l.trim()));
      lines.push(...stackLines);
    }

    return lines.join('\n');
  }

  printHeader(opts = {}) {
    const ws = opts.workspaceDir || this.options.workspaceDir || process.cwd();
    const title = colors.bold(colors.brightCyan('TALHA MASOOD PORTFOLIO — E2E TEST RUNNER'));
    const info = [
      colors.dim(`Node.js: ${process.version} | Platform: ${process.platform}`),
      colors.dim(`Workspace: ${ws}`),
      colors.dim(`Execution Mode: Native Pure Node (Zero External Dependencies)`),
      colors.dim(`Date: ${new Date().toISOString()}`)
    ];
    const activeTier = opts.tier ?? this.options.tier;
    const activeFeature = opts.feature ?? this.options.feature;
    const activeFilter = opts.filter ?? this.options.filter;
    if (activeTier) info.push(colors.yellow(`Filter: --tier ${activeTier}`));
    if (activeFeature) info.push(colors.yellow(`Filter: --feature ${activeFeature}`));
    if (activeFilter) info.push(colors.yellow(`Filter: --filter "${activeFilter}"`));

    console.log('\n' + colors.box(title, info, 78) + '\n');
  }

  isFeatureMatch(featureId, filter) {
    if (!filter) return true;
    const cleanFilter = filter.toLowerCase().replace(/^f/, '');
    const cleanId = featureId.toLowerCase().replace(/^f/, '');
    return cleanId === cleanFilter || featureId.toLowerCase() === filter.toLowerCase();
  }

  async run(cliOptions = {}) {
    const opts = { ...this.options, ...cliOptions };

    // Validate tier argument if provided
    if (opts.tier !== null && opts.tier !== undefined) {
      const normalizedTier = String(opts.tier).trim();
      if (!['1', '2', '3', '4'].includes(normalizedTier)) {
        console.error(colors.red(`\nError: Invalid tier "${opts.tier}". Must be 1, 2, 3, or 4.`));
        return false;
      }
      opts.tier = normalizedTier;
    }

    const startTime = Date.now();
    this.printHeader(opts);

    for (const t of this.tiers) {
      if (opts.tier && String(opts.tier) !== String(t.number)) {
        continue;
      }

      this.stats.perTier[t.number] = {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      };

      console.log(`\n${colors.bold(colors.brightCyan(`[TIER ${t.number}] ${t.title}`))}`);

      for (const f of t.features) {
        if (opts.feature && !this.isFeatureMatch(f.id, opts.feature)) {
          continue;
        }

        console.log(`  ${colors.yellow(`[${f.id}: ${f.title}]`)}`);

        for (const tst of f.tests) {
          if (opts.filter && !tst.name.toLowerCase().includes(opts.filter.toLowerCase())) {
            this.stats.skipped++;
            continue;
          }

          this.stats.total++;
          this.stats.perTier[t.number].total++;
          const tStart = Date.now();

          try {
            if (typeof tst.fn === 'function') {
              const res = tst.fn();
              if (res && typeof res.then === 'function') {
                await res;
              }
            }
            const dur = Date.now() - tStart;
            this.stats.passed++;
            this.stats.perTier[t.number].passed++;
            console.log(`    ${colors.green('✔')} ${tst.name} ${colors.dim(`(${dur}ms)`)}`);
          } catch (err) {
            const dur = Date.now() - tStart;
            this.stats.failed++;
            this.stats.perTier[t.number].failed++;
            console.log(`    ${colors.red('✖')} ${tst.name} ${colors.dim(`(${dur}ms)`)}`);
            this.failures.push({
              tier: t.number,
              feature: f.id,
              test: tst.name,
              error: err,
              duration: dur
            });
            console.log(this.formatError(err)
              .split('\n')
              .map(l => '      ' + l)
              .join('\n'));

            if (opts.bail) {
              console.log(colors.red('\n[BAIL] Halting suite execution on first failure as requested.'));
              break;
            }
          }
        }

        if (opts.bail && this.stats.failed > 0) break;
      }

      if (opts.bail && this.stats.failed > 0) break;
    }

    const totalDuration = Date.now() - startTime;
    this.printSummary(totalDuration);

    // Fail if zero tests were executed
    if (this.stats.total === 0) {
      const hasFilter = Boolean(opts.tier || opts.feature || opts.filter);
      if (hasFilter) {
        const filters = [];
        if (opts.tier) filters.push(`tier: ${opts.tier}`);
        if (opts.feature) filters.push(`feature: ${opts.feature}`);
        if (opts.filter) filters.push(`filter: "${opts.filter}"`);
        console.error(colors.red(`\nError: Filter criteria matched 0 tests (${filters.join(', ')}).`));
      } else {
        console.error(colors.red('\nError: No tests were executed.'));
      }
      return false;
    }

    return this.stats.failed === 0;
  }

  printSummary(totalDuration) {
    const lines = [];
    lines.push(colors.bold('TEST EXECUTION BREAKDOWN BY TIER'));
    lines.push('─'.repeat(74));

    for (const [tierNum, s] of Object.entries(this.stats.perTier)) {
      const rate = s.total > 0 ? Math.round((s.passed / s.total) * 100) : 0;
      const statusColor = s.failed === 0 && s.total > 0 ? colors.green : (s.failed > 0 ? colors.red : colors.dim);
      const tierLabel = `Tier ${tierNum}`.padEnd(28, ' ');
      const countLabel = `${s.passed} / ${s.total} passed (${rate}%)`.padStart(30, ' ');
      lines.push(`${tierLabel} ${statusColor(countLabel)}`);
    }

    lines.push('─'.repeat(74));
    let totalStatus;
    if (this.stats.total === 0) {
      totalStatus = colors.red('NO TESTS EXECUTED');
    } else if (this.stats.failed === 0) {
      totalStatus = colors.green('ALL TESTS PASSED (100%)');
    } else {
      totalStatus = colors.red(`${this.stats.failed} TEST(S) FAILED`);
    }

    lines.push(`Total Tests: ${this.stats.total} | Passed: ${colors.green(this.stats.passed)} | Failed: ${colors.red(this.stats.failed)} | Skipped: ${colors.yellow(this.stats.skipped)}`);
    lines.push(`Execution Duration: ${totalDuration}ms`);
    lines.push(`Final Result: ${totalStatus}`);

    console.log('\n' + colors.box(colors.bold('E2E TEST SUITE SUMMARY'), lines, 78) + '\n');
  }
}

const engine = new TestEngine();

module.exports = {
  TestEngine,
  engine,
  assert
};
