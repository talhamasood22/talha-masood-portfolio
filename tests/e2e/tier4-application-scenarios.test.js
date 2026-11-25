/**
 * tests/e2e/tier4-application-scenarios.test.js
 * Tier 4: Real-World Application Scenarios (5 Comprehensive Scenarios)
 * Pure Node.js (zero external npm dependencies).
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert');
const { loadDocument } = require('./harness/html-parser');
const { checkMobileOverflowRisk, checkTouchTargetSize } = require('./harness/tailwind-inspector');
const { calculateContrastRatio, extractProjectTokens, verifyFonts, DESIGN_TOKENS } = require('./harness/design-token-verifier');
const { extractSections, extractSentences, findDuplicateSentences, extractMetricClaims, verifyProfessionalTone } = require('./harness/content-verifier');

function registerTier4(engine, workspaceDir = process.cwd()) {
  engine.tier(4, 'Real-World Application Scenarios (5 Comprehensive Scenarios)', () => {
    let doc;
    try {
      doc = loadDocument(workspaceDir);
    } catch {
      doc = { type: 'none', raw: '', ast: null };
    }

    engine.feature('F_SCENARIOS', 'End-to-End User & Operational Journeys', () => {
      // ─── Scenario 1: Recruiter Mobile Triage (375px) ────────────────────────
      engine.test('T4.1: Scenario 1: Recruiter Mobile Triage (375px Viewport)', () => {
        // 1. Candidate identity visible above the fold
        const hasCandidate = /Talha Masood/.test(doc.raw) && /Stuttgart,\s*Germany/i.test(doc.raw);
        assert.ok(hasCandidate, 'Candidate name and location must be prominently visible on mobile');

        // 2. Avatar monogram placeholder rendered
        const hasAvatar = /TM/.test(doc.raw) || /avatar/i.test(doc.raw);
        assert.ok(hasAvatar, 'Profile avatar monogram must be rendered for recruiter identification');

        // 3. Macro metrics stack cleanly
        const hasMetrics = /96%/.test(doc.raw) && (/70%/.test(doc.raw) || /80%/.test(doc.raw));
        assert.ok(hasMetrics, 'Key macro metrics must be immediately accessible to mobile recruiter');

        // 4. Quick contact action buttons with >= 44x44px touch targets
        const targetCheck = checkTouchTargetSize(doc.raw);
        assert.ok(targetCheck.compliant, 'Contact action touch targets must satisfy mobile accessibility standards');

        // 5. Zero horizontal overflow risk
        const hasOverflowGuard = /overflow-(?:x-)?hidden/.test(doc.raw);
        assert.ok(hasOverflowGuard, 'Mobile viewport must configure overflow-hidden guard against horizontal clipping');
      });

      // ─── Scenario 2: Hiring Manager Deep-Dive (Desktop 1280px+) ─────────────
      engine.test('T4.2: Scenario 2: Hiring Manager Deep-Dive (Desktop 1280px+ Viewport)', () => {
        // 1. Floating Nav with all section links
        const hasNav = /#experience/.test(doc.raw) && /#projects/.test(doc.raw);
        assert.ok(hasNav, 'Floating navigation must expose links to all portfolio sections');

        // 2. Multi-Agent CAD Project Deep-Dive
        const hasCadDepth = /Multi-Agent/i.test(doc.raw) && /CAD/i.test(doc.raw);
        assert.ok(hasCadDepth, 'CAD project must feature technical depth');

        // 3. Detailed Work Experience Timeline
        const hasProxima = /Proxima Fusion/i.test(doc.raw) && /React Flow|Dagre/i.test(doc.raw);
        const hasMercedes = /Mercedes-Benz/i.test(doc.raw);
        const hasDubizzle = /Dubizzle Labs|Profolio/i.test(doc.raw);
        assert.ok(hasProxima && hasMercedes && hasDubizzle, 'All 3 primary work experience cards must be documented');

        // 4. Education Credentials
        const hasStuttgart = /Stuttgart/i.test(doc.raw) && /84\s*ECTS/i.test(doc.raw);
        const hasFast = /FAST-NUCES|National University/i.test(doc.raw) && /Gold Medal/i.test(doc.raw);
        assert.ok(hasStuttgart && hasFast, 'Academic credentials must detail Master course grades and Gold Medal');

        // 5. Technical Skills Matrix
        const hasSkills = /TypeScript/i.test(doc.raw) && /Python/i.test(doc.raw) && /FastAPI/i.test(doc.raw);
        assert.ok(hasSkills, 'Skills matrix must provide structured engineering taxonomy');
      });

      // ─── Scenario 3: Accessibility & Screen Reader Audit (WCAG 2.2 AA / AAA) ─
      engine.test('T4.3: Scenario 3: Accessibility & Screen Reader Audit (WCAG 2.2 AA / AAA)', () => {
        // 1. Skip-to-content bypass
        const hasSkip = /Skip to content|#main-content/i.test(doc.raw);
        assert.ok(hasSkip, 'Document must provide accessible skip link');

        // 2. Semantic landmarks
        const hasMain = /<main/i.test(doc.raw);
        const hasNavOrHeader = /<header|<nav/i.test(doc.raw);
        assert.ok(hasMain && hasNavOrHeader, 'Document must define semantic landmarks (header, nav, main)');

        // 3. Heading hierarchy
        const hasH1 = /<h1/i.test(doc.raw);
        const hasH2 = /<h2/i.test(doc.raw);
        assert.ok(hasH1 && hasH2, 'Heading hierarchy must feature semantic h1 and h2 tags');

        // 4. High-contrast ratio (> 15:1)
        const tokens = extractProjectTokens(workspaceDir);
        assert.ok(tokens.isExtractedFromProject, 'Project stylesheet / config must define high-contrast color tokens');
        const contrast = calculateContrastRatio(tokens.bodyText, tokens.obsidianSlate);
        assert.ok(contrast >= 15.0, `Obsidian background text contrast must exceed 15:1 (calculated: ${contrast.toFixed(2)}:1)`);

        // 5. Permitted fonts (no generic Arial/Inter/Roboto)
        const layoutPath = path.join(workspaceDir, 'src/app/layout.tsx');
        const globalsCssPath = path.join(workspaceDir, 'src/app/globals.css');
        let fontConfigs = '';
        if (fs.existsSync(layoutPath)) fontConfigs += fs.readFileSync(layoutPath, 'utf8');
        if (fs.existsSync(globalsCssPath)) fontConfigs += fs.readFileSync(globalsCssPath, 'utf8');
        const fontCheck = verifyFonts(fontConfigs);
        assert.ok(fontCheck.isCompliant, `Found banned fonts: ${fontCheck.bannedFontsFound.join(', ')}`);
      });

      // ─── Scenario 5: Anti-Duplication & Content Verification Across All Sections
      engine.test('T4.5: Scenario 5: Anti-Duplication & Content Verification Across All Sections', () => {
        // 1. Candidate profile facts
        assert.ok(doc.raw.includes('Talha Masood'), 'Candidate name must be present');
        assert.ok(/mailto:[^"'\s]+@/i.test(doc.raw), 'Candidate email must be present');
        assert.ok(/linkedin\.com\/in\/talhamasood22/i.test(doc.raw), 'Candidate LinkedIn must be present');
        assert.ok(/github\.com\/talhamasood22/i.test(doc.raw), 'Candidate GitHub must be present');

        // 2. Anti-duplication check across all extracted sections
        const sections = extractSections(doc);
        const duplicates = findDuplicateSentences(sections);
        assert.strictEqual(
          duplicates.length,
          0,
          `Found duplicate sentences across sections: ${duplicates.map(d => `${d.sentence} in [${d.sections.join(', ')}]`).join('; ')}`
        );

        // 3. Factual metric claims
        const claims = extractMetricClaims(doc.raw);
        assert.ok(claims.length >= 2, 'Candidate career metrics must be explicitly stated');

        // 4. Professional tone check
        const tone = verifyProfessionalTone(doc.raw);
        assert.ok(tone.isProfessional, 'Entire website copy must be professional without banned clichés');
      });
    });
  });
}

if (require.main === module) {
  const { engine: standaloneEngine } = require('./harness/engine');
  registerTier4(standaloneEngine);
  standaloneEngine.run().then(passed => process.exit(passed ? 0 : 1));
}

module.exports = { registerTier4 };
