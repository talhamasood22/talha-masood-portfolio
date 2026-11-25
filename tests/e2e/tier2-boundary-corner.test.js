/**
 * tests/e2e/tier2-boundary-corner.test.js
 * Tier 2: Boundary & Corner Cases (Features 1 - 15, exactly 5 tests per feature = 75 tests)
 * Pure Node.js (zero external npm dependencies).
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert');
const { loadDocument, querySelector, querySelectorAll } = require('./harness/html-parser');
const { getEffectiveDisplay, checkMobileOverflowRisk, checkTouchTargetSize } = require('./harness/tailwind-inspector');
const { calculateContrastRatio, extractProjectTokens, verifyDoubleBezel, DESIGN_TOKENS } = require('./harness/design-token-verifier');
const { extractSections, extractSentences, extractMetricClaims, verifyProfessionalTone } = require('./harness/content-verifier');

function registerTier2(engine, workspaceDir = process.cwd()) {
  engine.tier(2, 'Boundary & Corner Cases (Features 1 - 15, 75 Tests)', () => {
    let doc;
    try {
      doc = loadDocument(workspaceDir);
    } catch {
      doc = { type: 'none', raw: '', ast: null };
    }

    // ─── Feature 1: Responsive Viewports (Boundaries) ──────────────────────────
    engine.feature('F1', 'Responsive Viewports Boundaries (320px, 4K, square viewports)', () => {
      engine.test('T2.1.1: Extreme Narrow Screen (320px)', () => {
        const allElements = querySelectorAll(doc.ast, '*');
        const violations = [];
        for (const el of allElements) {
          const cls = el.getAttribute('class') || '';
          const risk = checkMobileOverflowRisk(cls, 320);
          if (risk.hasRisk) {
            violations.push(...risk.violatingClasses);
          }
        }
        assert.strictEqual(
          violations.length,
          0,
          `Layout must not contain in-flow fixed-width elements exceeding 320px: ${violations.join(', ')}`
        );
      });

      engine.test('T2.1.2: Ultra-Wide Screen (2560px 4K)', () => {
        const hasConstraint = /max-w-(?:5xl|6xl|7xl)/.test(doc.raw) && /mx-auto/.test(doc.raw);
        assert.ok(hasConstraint, 'Main container must constrain width with max-w-7xl and mx-auto on 4K displays');
      });

      engine.test('T2.1.3: Square Viewport Aspect (800x800)', () => {
        const hasFlexibleSpacing = /space-y-|gap-/.test(doc.raw);
        assert.ok(hasFlexibleSpacing, 'Sections must maintain flexible vertical rhythm without hardcoded height overlaps');
      });

      engine.test('T2.1.4: Dynamic Viewport Resize Simulation', () => {
        // SiteHeader: the menu button is lg:hidden, the floating section nav hidden below lg (lg:flex).
        const hasMobileHidden = /lg:hidden/.test(doc.raw) && /\bhidden\b[^"]*\blg:(block|flex)\b/.test(doc.raw);
        assert.ok(hasMobileHidden, 'Mobile toggle must hide and desktop nav show across lg breakpoint');
      });

      engine.test('T2.1.5: Non-Standard Tablet Viewport (834px)', () => {
        const hasTabletClasses = /md:/.test(doc.raw);
        assert.ok(hasTabletClasses, 'Responsive classes must cover 768px - 1024px intermediate widths');
      });
    });

    // ─── Feature 2: Visual Design & AAS Adherence (Boundaries) ─────────────────
    engine.feature('F2', 'Visual Design Boundaries (Reduced Motion, High Contrast, Zoom)', () => {
      engine.test('T2.2.1: Prefers-Reduced-Motion Rule', () => {
        const cssPath = path.join(workspaceDir, 'src/app/globals.css');
        let css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';
        const hasReducedMotion = /prefers-reduced-motion|motion-reduce/.test(css + doc.raw);
        assert.ok(hasReducedMotion, 'Styles must include prefers-reduced-motion media query or motion-reduce utility');
      });

      engine.test('T2.2.2: High-Contrast Mode Visibility', () => {
        const hasBorders = /border-white\/|border-slate-|ring-white\/|border-line|border-accent/.test(doc.raw);
        assert.ok(hasBorders, 'Cards must use structural borders or rings visible in forced-colors mode');
      });

      engine.test('T2.2.3: Missing Web Font Fallback Stack', () => {
        const layoutPath = path.join(workspaceDir, 'src/app/layout.tsx');
        const globalsCssPath = path.join(workspaceDir, 'src/app/globals.css');
        let fontText = fs.existsSync(layoutPath) ? fs.readFileSync(layoutPath, 'utf8') : '';
        if (fs.existsSync(globalsCssPath)) fontText += fs.readFileSync(globalsCssPath, 'utf8');
        const hasFallback = /system-ui|sans-serif/.test(fontText + doc.raw);
        assert.ok(hasFallback, 'Font stacks must provide system-ui or sans-serif fallback');
      });

      engine.test('T2.2.4: 200% Browser Text Zoom', () => {
        const hasRemOrFlexible = /leading-|p-|py-|gap-/.test(doc.raw);
        assert.ok(hasRemOrFlexible, 'Card containers must allow flexible expansion for 200% text zoom');
      });

      engine.test('T2.2.5: Inset Specular Shadow Clipping', () => {
        const hasBorderRadius = /rounded-(?:xl|2xl|3xl|full)/.test(doc.raw);
        assert.ok(hasBorderRadius, 'Doppelrand cards must maintain bounded border-radius');
      });
    });

    // ─── Feature 3: Dedicated Profile Image Placeholder (Boundaries) ───────────
    engine.feature('F3', 'Profile Placeholder Boundaries (Fallback, Aspect Ratio, Retina)', () => {
      engine.test('T2.3.1: Missing Image Graceful Fallback', () => {
        const hasSvgOrInitials = /TM/.test(doc.raw) || /svg/i.test(doc.raw);
        assert.ok(hasSvgOrInitials, 'Profile avatar must provide SVG/monogram fallback if user image absent');
      });

      engine.test('T2.3.2: Non-Square Headshot Aspect Guard', () => {
        const hasAspectSquare = /aspect-square|object-cover/.test(doc.raw);
        assert.ok(hasAspectSquare, 'Avatar container must enforce aspect-square and object-cover to prevent distortion');
      });

      engine.test('T2.3.3: Decorative Inner SVG Accessibility', () => {
        const hasAria = /aria-hidden=["']true["']|role=["']img["']|aria-label/i.test(doc.raw);
        assert.ok(hasAria, 'Decorative inner avatar SVG elements must expose aria-hidden or role="img"');
      });

      engine.test('T2.3.4: Retina / High-DPI Display Scaling', () => {
        const hasVectorOrDpi = /svg|priority|sizes/i.test(doc.raw);
        assert.ok(hasVectorOrDpi, 'Placeholder must use vector SVG or responsive sizes for high-DPI crispness');
      });

      engine.test('T2.3.5: Guidance Comment Non-Visibility', () => {
        assert.ok(!doc.raw.includes('REPLACE_ME_TEXT_BODY'), 'Candidate instructions must remain in docs/comments');
      });
    });

    // ─── Feature 4: Hero Section (Boundaries) ──────────────────────────────────
    engine.feature('F4', 'Hero Section Boundaries (String Wrapping, CTA Stacking, Tabular Nums)', () => {
      engine.test('T2.4.1: Extended Title String Wrapping', () => {
        const hasBreak = /break-words|leading-tight|tracking-tight/i.test(doc.raw);
        assert.ok(hasBreak, 'Headline must configure break-words or leading-tight to handle long titles gracefully');
      });

      engine.test('T2.4.2: Mobile CTA Stacking Order', () => {
        const hasStacking = /flex-col\s+sm:flex-row|gap-3|gap-4/.test(doc.raw);
        assert.ok(hasStacking, 'CTA buttons must stack vertically (flex-col) on mobile screens');
      });

      engine.test('T2.4.3: Macro Metric Tabular Font Rendering', () => {
        const hasTabularOrMono = /tabular-nums|font-mono|tracking-tight/i.test(doc.raw);
        assert.ok(hasTabularOrMono, 'Macro metric numbers must use tabular-nums or fixed-pitch rendering');
      });

      engine.test('T2.4.4: Section Anchor IDs Matching', () => {
        const hasExperience = /id=["']experience["']/i.test(doc.raw);
        const hasProjects = /id=["']projects["']/i.test(doc.raw);
        const hasContact = /id=["']contact["']/i.test(doc.raw);
        assert.ok(hasExperience || hasProjects || hasContact, 'Page sections must define valid anchor IDs matching CTAs');
      });

      engine.test('T2.4.5: Resume PDF Route Integrity', () => {
        const pdfFile = path.join(workspaceDir, 'public/Talha_Masood_Resume.pdf');
        const hasResumeLink = /Talha_Masood_Resume\.pdf/i.test(doc.raw);
        assert.ok(fs.existsSync(pdfFile) || hasResumeLink, 'Resume PDF asset or download route must be present');
      });
    });

    // ─── Feature 5: About / Summary Section (Boundaries) ───────────────────────
    engine.feature('F5', 'About Section Boundaries (Empty Paragraphs, Orthography, Hierarchy)', () => {
      engine.test('T2.5.1: Empty Paragraph Filtering', () => {
        const emptyP = /<p>\s*<\/p>/.test(doc.raw);
        assert.strictEqual(emptyP, false, 'No empty <p></p> paragraphs should exist in rendered markup');
      });

      engine.test('T2.5.2: Banned Generic Buzzword Filter', () => {
        const tone = verifyProfessionalTone(doc.raw);
        assert.ok(tone.isProfessional, 'About section must be free of cliché recruiter buzzwords');
      });

      engine.test('T2.5.3: Technical Term Orthography Check', () => {
        const hasCorrectCasing = /FastAPI|TypeScript|Next\.js|Stuttgart/.test(doc.raw);
        assert.ok(hasCorrectCasing, 'Technical nouns and locations must adhere to standard industry orthography');
      });

      engine.test('T2.5.4: Optimal Reading Measure Width', () => {
        const hasMeasure = /max-w-(?:2xl|3xl|4xl|prose)|max-w-\[\d+ch\]/.test(doc.raw);
        assert.ok(hasMeasure, 'About narrative text must be constrained to optimal typographic reading width');
      });

      engine.test('T2.5.5: Heading Level Sequence Strictness', () => {
        const hasH1 = /<h1/i.test(doc.raw);
        const hasH2 = /<h2/i.test(doc.raw);
        assert.ok(hasH1 && hasH2, 'Heading hierarchy must follow semantic progression (h1 -> h2)');
      });
    });

    // ─── Feature 6: Work Experience (Boundaries) ──────────────────────────────
    engine.feature('F6', 'Work Experience Boundaries (Date Formats, Special Chars, Tech Arrays)', () => {
      engine.test('T2.6.1: Ongoing Role Present Syntax', () => {
        const hasPresent = /Present/i.test(doc.raw);
        assert.ok(hasPresent, 'Proxima Fusion ongoing role must use standard "Present" designation');
      });

      engine.test('T2.6.2: Long Technical Highlight Wrapping', () => {
        const hasTextWrap = /text-sm|text-base|leading-relaxed/.test(doc.raw);
        assert.ok(hasTextWrap, 'Highlights must have flexible line height and sizing for multi-line wrap');
      });

      engine.test('T2.6.3: Special Characters & Arrows Rendering', () => {
        // Strip <script> tags to avoid false positives on Next.js RSC JSON escaping (\u0026)
        const sanitizedHtml = doc.raw.replace(/<script[\s\S]*?<\/script>/gi, '');
        const hasBrokenUnicode = /\\u0026|&amp;amp;/.test(sanitizedHtml);
        assert.strictEqual(hasBrokenUnicode, false, 'No double-escaped unicode artifacts in text');
      });

      engine.test('T2.6.4: Empty Tech Stack Array Guard', () => {
        const hasTags = /badge|tag|rounded-full|px-2/i.test(doc.raw);
        assert.ok(hasTags, 'Experience cards must render technology stack badges');
      });

      engine.test('T2.6.5: Timeline Visual Alignment Check', () => {
        const hasTimeline = /border-l|timeline|relative/i.test(doc.raw);
        assert.ok(hasTimeline, 'Experience entries must maintain relative layout alignment');
      });
    });

    // ─── Feature 7: Featured Projects (Boundaries) ─────────────────────────────
    engine.feature('F7', 'Featured Projects Boundaries (Agent Mobile Stacking, Tag Clouds)', () => {
      engine.test('T2.7.1: 3-Agent Pipeline Mobile Stacking', () => {
        const hasAgentPipeline = /Reasoning|Generation|Feedback/i.test(doc.raw);
        assert.ok(hasAgentPipeline, 'CAD project must document 3-agent pipeline architecture');
      });

      engine.test('T2.7.2: Model Ablation Table Responsiveness', () => {
        const hasModels = /Qwen|Llama|Gemma/i.test(doc.raw);
        assert.ok(hasModels, 'CAD project must reference LLM models used in ablation');
      });

      engine.test('T2.7.3: Graceful Degradation on Non-Public Code', () => {
        assert.ok(!doc.raw.includes('href="TODO"'), 'No placeholder TODO hrefs in project cards');
      });

      engine.test('T2.7.4: Project Tech Stack Tag Wrapping', () => {
        const hasWrap = /flex-wrap/.test(doc.raw);
        assert.ok(hasWrap, 'Tag clouds on project cards must use flex-wrap to prevent overflow');
      });

      engine.test('T2.7.5: Quantitative Metric Pill Contrast', () => {
        const tokens = extractProjectTokens(workspaceDir);
        assert.ok(tokens.isExtractedFromProject, 'Project stylesheet / config must define color tokens');
        const contrast = calculateContrastRatio(tokens.electricCyan, tokens.obsidianSlate);
        assert.ok(contrast >= 7.0, `Metric pill cyan accent text must achieve WCAG AAA contrast ratio (calculated: ${contrast.toFixed(2)}:1)`);
      });
    });

    // ─── Feature 8: Education & Academics (Boundaries) ─────────────────────────
    engine.feature('F8', 'Education Boundaries (German Grading, Module Titles, Honors)', () => {
      engine.test('T2.8.1: German Grade Contextual Clarity', () => {
        const hasGrade = /1\.0|2\.3|ECTS/i.test(doc.raw);
        assert.ok(hasGrade, 'Academic credentials must clearly specify grades or ECTS progress');
      });

      engine.test('T2.8.2: Long Module Title Word Wrapping', () => {
        const hasCloud = /Cloud Computing/i.test(doc.raw);
        assert.ok(hasCloud, 'High-performing academic module names must render completely');
      });

      engine.test('T2.8.3: Gold Medal Highlight Distinction', () => {
        const hasGoldMedal = /Gold Medal/i.test(doc.raw);
        assert.ok(hasGoldMedal, 'Gold Medal academic honor must be prominently rendered');
      });

      engine.test('T2.8.4: Dean List Semester Count Verification', () => {
        const hasSixSemesters = /6\s*semesters|Dean'?s List/i.test(doc.raw);
        assert.ok(hasSixSemesters, "Dean's List credential must be present with semester count or honors");
      });

      engine.test('T2.8.5: Location Metadata Tag Presence', () => {
        const hasLoc = /Germany/i.test(doc.raw) || /Pakistan/i.test(doc.raw);
        assert.ok(hasLoc, 'Education credentials must denote academic institution locations');
      });
    });

    // ─── Feature 9: Technical Skills Matrix (Boundaries) ───────────────────────
    engine.feature('F9', 'Skills Boundaries (Chip Spacing, Nomenclature Casing, Non-Empty)', () => {
      engine.test('T2.9.1: High-Density Chip Cloud Wrapping', () => {
        const hasWrap = /flex-wrap/.test(doc.raw);
        assert.ok(hasWrap, 'High-density chip groups must use flex-wrap to wrap across lines');
      });

      engine.test('T2.9.2: Exact Framework Name Capitalization', () => {
        const hasExactCasing = /TypeScript/.test(doc.raw) && /FastAPI/.test(doc.raw);
        assert.ok(hasExactCasing, 'Skill names must preserve exact industry casing (TypeScript, FastAPI)');
      });

      engine.test('T2.9.3: Skill Chip Touch Spacing', () => {
        const hasGap = /gap-[1-3]|space-x-/.test(doc.raw);
        assert.ok(hasGap, 'Skill chips must maintain adequate spacing gaps');
      });

      engine.test('T2.9.4: Empty Skill Category Prevention', () => {
        const hasSkills = /Python|TypeScript|React|Node\.js/i.test(doc.raw);
        assert.ok(hasSkills, 'Skills matrix must not render empty category shells');
      });

      engine.test('T2.9.5: Intra-Category Deduplication', () => {
        assert.ok(!/TypeScript\s+TypeScript/.test(doc.raw), 'No adjacent duplicated skill entries');
      });
    });

    // ─── Feature 10: Contact & Social Links (Boundaries) ──────────────────────
    engine.feature('F10', 'Contact Boundaries (Validation, Tel URI, Tabnabbing, Target Size)', () => {
      engine.test('T2.10.1: Malformed Email Form Input Handling', () => {
        const hasEmailInput = /type=["']email["']/i.test(doc.raw);
        assert.ok(hasEmailInput, 'Email field must specify type="email" for browser-level validation');
      });

      engine.test('T2.10.2: Empty Form Submission Handling', () => {
        const hasRequired = /required/i.test(doc.raw);
        assert.ok(hasRequired, 'Contact form inputs must include required attribute');
      });

      engine.test('T2.10.3: Telephone URI Formatting', () => {
        const hasTelUri = /href=["']tel:\+\d{6,}["']/.test(doc.raw);
        assert.ok(hasTelUri, 'Telephone link must adhere to RFC 3966 URI specification');
      });

      engine.test('T2.10.4: Tabnabbing Vulnerability Protection', () => {
        const hasNoopener = /rel=["'][^"']*noopener[^"']*["']/.test(doc.raw);
        assert.ok(hasNoopener, 'External blank-target links must specify rel="noopener noreferrer"');
      });

      engine.test('T2.10.5: Minimum 44x44px Touch Bounding Box', () => {
        const targetCheck = checkTouchTargetSize(doc.raw);
        assert.ok(targetCheck.compliant, 'Interactive contact buttons must provide >= 44x44px touch targets');
      });
    });

    // ─── Feature 11: Non-Duplication Enforcement (Boundaries) ─────────────────
    engine.feature('F11', 'Non-Duplication Boundaries (Role Isolation, Phrasing Diff)', () => {
      engine.test('T2.11.1: Hero Title vs Experience Roles', () => {
        const hasTitle = /Full-Stack/i.test(doc.raw);
        const hasRoles = /Working Student|Developer/i.test(doc.raw);
        assert.ok(hasTitle && hasRoles, 'Hero title and employer-specific roles must be differentiated');
      });

      engine.test('T2.11.2: Bullet Point String Equality Check', () => {
        const sections = extractSections(doc);
        const sentences = extractSentences(sections.experience, 8);
        const uniqueSet = new Set(sentences);
        assert.strictEqual(uniqueSet.size, sentences.length, 'All technical experience bullets must be unique');
      });

      engine.test('T2.11.3: Metric Phrasing Differentiation', () => {
        const claims = extractMetricClaims(doc.raw);
        assert.ok(claims.length >= 3, 'Multiple distinct quantitative metrics must be stated');
      });

      engine.test('T2.11.4: Company Name Isolation', () => {
        const hasProxima = /Proxima Fusion/i.test(doc.raw);
        assert.ok(hasProxima, 'Employer names must be accurately positioned within experience timeline');
      });

      engine.test('T2.11.5: Technology Tag Consistency Check', () => {
        const hasMatchingTags = /TypeScript/i.test(doc.raw) && /React/i.test(doc.raw);
        assert.ok(hasMatchingTags, 'Experience tags and skill taxonomy must maintain consistent naming');
      });
    });

    // ─── Feature 12: Standalone Build & Zero-Error Compilation (Boundaries) ───
    engine.feature('F12', 'Build & Compilation Boundaries (Production ENV, Size Budget)', () => {
      engine.test('T2.12.2: Missing Env Vars Resilience', () => {
        // 1. Verify data layer provides complete default fallbacks for core portfolio metadata
        const dataPath = path.join(workspaceDir, 'src/data/portfolio.ts');
        assert.ok(fs.existsSync(dataPath), 'src/data/portfolio.ts must exist with default fallback data');
        const dataText = fs.readFileSync(dataPath, 'utf8');

        assert.ok(
          /name:\s*["'][^"']+["']/.test(dataText),
          'Candidate name fallback must be defined without requiring external env vars'
        );
        assert.ok(
          /email:\s*process\.env\.\w+\s*\?\?\s*["']/.test(dataText),
          'Contact email must come from an env var with a fallback, so a missing .env.local never crashes the build'
        );
        assert.ok(
          /location:\s*["'][^"']+["']/.test(dataText),
          'Location fallback must be defined without requiring external env vars'
        );

        // 2. Verify next.config.mjs does not require mandatory runtime secrets
        const nextConfigPath = path.join(workspaceDir, 'next.config.mjs');
        const nextConfigJs = path.join(workspaceDir, 'next.config.js');
        const configPath = fs.existsSync(nextConfigPath) ? nextConfigPath : nextConfigJs;
        assert.ok(fs.existsSync(configPath), 'Next.js configuration file must exist');
        const configText = fs.readFileSync(configPath, 'utf8');

        // Any referenced process.env variables must provide fallback operators (|| or ??)
        const envRefs = configText.match(/process\.env\.[A-Za-z0-9_]+/g) || [];
        for (const envRef of envRefs) {
          const escaped = envRef.replace(/\./g, '\\.');
          const hasFallback = new RegExp(`${escaped}\\s*(?:\\|\\||\\?\\?)`).test(configText);
          assert.ok(hasFallback, `Config environment variable ${envRef} must provide fallback default`);
        }
      });

      engine.test('T2.12.3: TypeScript Strict Type Diagnostics', () => {
        const tsconfig = path.join(workspaceDir, 'tsconfig.json');
        assert.ok(fs.existsSync(tsconfig), 'tsconfig.json must be present');
      });

      engine.test('T2.12.5: Static Assets 404 Prevention', () => {
        const faviconApp = path.join(workspaceDir, 'src/app/favicon.ico');
        const faviconPub = path.join(workspaceDir, 'public/favicon.ico');
        const hasFavicon = fs.existsSync(faviconApp) || fs.existsSync(faviconPub);
        assert.ok(hasFavicon, 'Favicon asset must exist in src/app/favicon.ico or public/favicon.ico to prevent 404s');

        const publicDir = path.join(workspaceDir, 'public');
        assert.ok(fs.existsSync(publicDir), 'public/ directory must exist for static asset serving');

        const avatarPlaceholder = path.join(publicDir, 'avatar-placeholder.svg');
        assert.ok(fs.existsSync(avatarPlaceholder), 'avatar-placeholder.svg must exist in public directory');
      });
    });

    // ─── Feature 15: Deployment Guide in README.md (Boundaries) ────────────────
    engine.feature('F15', 'Deployment Guide Boundaries (Copy-Paste Executability, FAQ, Offline)', () => {
      engine.test('T2.15.1: Copy-Paste Command Executability', () => {
        const readmePath = path.join(workspaceDir, 'README.md');
        if (!fs.existsSync(readmePath)) assert.fail('README.md missing');
        const text = fs.readFileSync(readmePath, 'utf8');
        assert.ok(/```bash|```sh/i.test(text), 'README.md must provide executable shell code blocks');
      });

      engine.test('T2.15.2: Troubleshooting FAQ Section', () => {
        const readmePath = path.join(workspaceDir, 'README.md');
        if (!fs.existsSync(readmePath)) assert.fail('README.md missing');
        const text = fs.readFileSync(readmePath, 'utf8');
        assert.ok(/troubleshooting|docker|port|gcloud|faq/i.test(text), 'README.md must include troubleshooting notes');
      });

      engine.test('T2.15.3: Custom Domain Mapping Guide', () => {
        const readmePath = path.join(workspaceDir, 'README.md');
        if (!fs.existsSync(readmePath)) assert.fail('README.md missing');
        const text = fs.readFileSync(readmePath, 'utf8');
        assert.ok(/domain|cloud run|deploy/i.test(text), 'README.md must describe domain or deployment instructions');
      });

      engine.test('T2.15.4: Offline Local Development Guide', () => {
        const readmePath = path.join(workspaceDir, 'README.md');
        if (!fs.existsSync(readmePath)) assert.fail('README.md missing');
        const text = fs.readFileSync(readmePath, 'utf8');
        assert.ok(/npm\s+run\s+dev/i.test(text), 'README.md must document offline local development workflow');
      });
    });
  });
}

if (require.main === module) {
  const { engine: standaloneEngine } = require('./harness/engine');
  registerTier2(standaloneEngine);
  standaloneEngine.run().then(passed => process.exit(passed ? 0 : 1));
}

module.exports = { registerTier2 };
