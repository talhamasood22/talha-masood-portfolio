/**
 * tests/e2e/tier3-cross-feature.test.js
 * Tier 3: Pairwise Cross-Feature Combinations (15 Interaction Tests)
 * Pure Node.js (zero external npm dependencies).
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert');
const { loadDocument, querySelector, querySelectorAll, getElementById } = require('./harness/html-parser');
const { getEffectiveDisplay, checkTouchTargetSize } = require('./harness/tailwind-inspector');
const { verifyDoubleBezel, verifyFocusVisibleRing, calculateContrastRatio, DESIGN_TOKENS } = require('./harness/design-token-verifier');
const { extractSections, extractSentences, findDuplicateSentences } = require('./harness/content-verifier');
const { validateDockerfile, validateCloudRunDeployScript, validateCloudBuildYaml } = require('./harness/docker-validator');

function registerTier3(engine, workspaceDir = process.cwd()) {
  engine.tier(3, 'Pairwise Cross-Feature Combinations (15 Interaction Tests)', () => {
    let doc;
    try {
      doc = loadDocument(workspaceDir);
    } catch {
      doc = { type: 'none', raw: '', ast: null };
    }

    engine.feature('F_CROSS', 'Pairwise Subsystem Integrations', () => {
      engine.test('T3.1: Viewport (375px) × Floating Nav & Drawer', () => {
        // Section nav hidden below lg, drawer trigger visible (SiteHeader)
        const hasMobileToggle = /lg:hidden/.test(doc.raw);
        const hasDesktopNav = /\bhidden\b[^"]*\blg:(block|flex)\b/.test(doc.raw);
        assert.ok(hasMobileToggle && hasDesktopNav, 'Floating nav hides desktop links and exposes mobile toggle at 375px');
      });

      engine.test('T3.2: Viewport (375px) × Hero & Profile Avatar', () => {
        // Avatar stacks cleanly above title on mobile (single-column flex/grid)
        const hasResponsiveLayout = /flex-col|lg:grid-cols|lg:flex-row/.test(doc.raw);
        assert.ok(hasResponsiveLayout, 'Hero section adapts from single-column on mobile to split layout on desktop');
      });

      engine.test('T3.3: Viewport (768px) × Bento Grid Projects', () => {
        const hasMdGrid = /md:grid-cols-[2-3]/.test(doc.raw);
        assert.ok(hasMdGrid, 'Projects bento grid activates multi-column layout at 768px tablet breakpoint');
      });

      engine.test('T3.4: Doppelrand Cards × Work Experience', () => {
        const hasDoubleBezel = verifyDoubleBezel(doc.raw);
        assert.ok(hasDoubleBezel.hasOuterBezel, 'Experience cards must utilize outer bezel and dark surface');
      });

      engine.test('T3.5: Doppelrand Cards × Skills Matrix', () => {
        // Retargeted to the role-based tokens (page / panel) that the theme
        // layer now exposes instead of the retired obsidian names.
        const hasCards = /rounded-(?:xl|2xl|chip|panel)/.test(doc.raw) && /bg-panel|bg-page|bg-slate-900/.test(doc.raw);
        assert.ok(hasCards, 'Skills matrix categories must be enclosed in Doppelrand surface cards');
      });

      engine.test('T3.6: Floating Nav Spy × Main Landmarks', () => {
        const navLinks = ['#hero', '#about', '#experience', '#projects', '#education', '#skills', '#contact'];
        let matched = 0;
        for (const link of navLinks) {
          if (doc.raw.includes(link)) matched++;
        }
        assert.ok(matched >= 4, `Floating nav links must target page section landmarks (found ${matched}/7)`);
      });

      engine.test('T3.7: Keyboard Focus Visible × Contact Form', () => {
        const hasFocus = verifyFocusVisibleRing(doc.raw);
        assert.ok(hasFocus.hasFocusRing, 'Form inputs and buttons must implement visible focus ring states');
      });

      engine.test('T3.8: Skip Link × Semantic Landmarks', () => {
        const hasSkip = /Skip to content|#main-content|sr-only/i.test(doc.raw);
        assert.ok(hasSkip, 'Document must provide accessible Skip to Content bypass link');
      });

      engine.test('T3.9: Next.js Standalone × Multi-Stage Dockerfile', () => {
        const nextConfigPath = path.join(workspaceDir, 'next.config.mjs');
        const dockerfilePath = path.join(workspaceDir, 'Dockerfile');

        let nextConfigStandalone = false;
        if (fs.existsSync(nextConfigPath)) {
          nextConfigStandalone = fs.readFileSync(nextConfigPath, 'utf8').includes('standalone');
        }

        let dockerfileCopiesStandalone = false;
        if (fs.existsSync(dockerfilePath)) {
          const val = validateDockerfile(fs.readFileSync(dockerfilePath, 'utf8'));
          dockerfileCopiesStandalone = val.copiesStandalone;
        }

        assert.ok(
          nextConfigStandalone && dockerfileCopiesStandalone,
          'Next.js standalone configuration must feed directly into Dockerfile runner stage'
        );
      });

      engine.test('T3.10: Dockerfile Port 8080 × Cloud Run Deploy Script', () => {
        const dockerfilePath = path.join(workspaceDir, 'Dockerfile');
        const scriptPath = path.join(workspaceDir, 'deploy-cloudrun.sh');

        if (!fs.existsSync(dockerfilePath) || !fs.existsSync(scriptPath)) {
          assert.fail('Both Dockerfile and deploy-cloudrun.sh must be present');
        }

        const dockerVal = validateDockerfile(fs.readFileSync(dockerfilePath, 'utf8'));
        const scriptVal = validateCloudRunDeployScript(fs.readFileSync(scriptPath, 'utf8'));

        assert.ok(
          dockerVal.setsPort8080 && scriptVal.usesPort8080,
          'Dockerfile PORT=8080 must match Cloud Run deployment script port configuration'
        );
      });

      engine.test('T3.11: Non-Duplication × Hero Metrics & Experience', () => {
        const sections = extractSections(doc);
        const heroSentences = extractSentences(sections.hero, 6);
        const expSentences = extractSentences(sections.experience, 6);
        const overlap = heroSentences.filter(s => expSentences.includes(s));
        assert.strictEqual(
          overlap.length,
          0,
          'Hero macro summary statements must be decoupled from detailed Experience sentences'
        );
      });

      engine.test('T3.12: Mobile Drawer × Screen Reader ARIA & Focus', () => {
        const hasAriaExpanded = /aria-expanded|aria-label|role=["']dialog["']/i.test(doc.raw);
        assert.ok(hasAriaExpanded, 'Mobile drawer must manage ARIA expanded state and screen reader accessibility');
      });

      engine.test('T3.13: Touch Target (≥44px) × Social & Contact Links', () => {
        const targetCheck = checkTouchTargetSize(doc.raw);
        assert.ok(targetCheck.compliant, 'All social links and contact actions must satisfy >= 44x44px touch bounding box');
      });

      engine.test('T3.14: Modern Typography × German Academic Modules', () => {
        const hasGermanModule = /Service Management|Cloud Computing|Evaluation/i.test(doc.raw);
        assert.ok(hasGermanModule, 'Modern typography must render long German academic course titles cleanly');
      });

      engine.test('T3.15: Cloud Build Pipeline × Dockerfile Build Args', () => {
        const yamlPath = path.join(workspaceDir, 'cloudbuild.yaml');
        const dockerfilePath = path.join(workspaceDir, 'Dockerfile');

        if (!fs.existsSync(yamlPath) || !fs.existsSync(dockerfilePath)) {
          assert.fail('Both cloudbuild.yaml and Dockerfile must exist');
        }

        const buildVal = validateCloudBuildYaml(fs.readFileSync(yamlPath, 'utf8'));
        const dockerVal = validateDockerfile(fs.readFileSync(dockerfilePath, 'utf8'));

        assert.ok(buildVal.isCompliant && dockerVal.isCompliant, 'Cloud Build pipeline and Dockerfile must align for production CI/CD');
      });
    });
  });
}

if (require.main === module) {
  const { engine: standaloneEngine } = require('./harness/engine');
  registerTier3(standaloneEngine);
  standaloneEngine.run().then(passed => process.exit(passed ? 0 : 1));
}

module.exports = { registerTier3 };
