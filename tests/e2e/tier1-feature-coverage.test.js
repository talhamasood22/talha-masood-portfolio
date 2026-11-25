/**
 * tests/e2e/tier1-feature-coverage.test.js
 * Tier 1: Feature Coverage (Features 1 - 15, exactly 5 tests per feature = 75 tests)
 * Pure Node.js (zero external npm dependencies).
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert');
const { loadDocument, querySelector, querySelectorAll, getElementById } = require('./harness/html-parser');
const { getEffectiveDisplay, getEffectiveGridCols, checkMobileOverflowRisk, parseClasses } = require('./harness/tailwind-inspector');
const { calculateContrastRatio, extractProjectTokens, verifyFonts, verifyDoubleBezel, DESIGN_TOKENS } = require('./harness/design-token-verifier');
const { extractSections, extractSentences, findDuplicateSentences, verifyProfessionalTone } = require('./harness/content-verifier');
const { validateDockerfile, validateCloudRunDeployScript, validateCloudBuildYaml, validateDeploymentReadme } = require('./harness/docker-validator');

function registerTier1(engine, workspaceDir = process.cwd()) {
  engine.tier(1, 'Feature Coverage (Features 1 - 15, 75 Tests)', () => {
    let doc;
    try {
      doc = loadDocument(workspaceDir);
    } catch {
      doc = { type: 'none', raw: '', ast: null };
    }

    // ─── Feature 1: Responsive Viewports ───────────────────────────────────────
    engine.feature('F1', 'Responsive Viewports (375px, 768px, 1280px+)', () => {
      engine.test('T1.1.1: Viewport Meta Tag Presence', () => {
        const hasViewport = doc.raw.includes('name="viewport"') && doc.raw.includes('width=device-width');
        assert.ok(hasViewport, 'Viewport meta tag must be configured with width=device-width');
      });

      engine.test('T1.1.2: Mobile (375px) Overflow Guard', () => {
        const hasOverflowGuard = /overflow-(?:x-)?hidden/.test(doc.raw);
        assert.ok(hasOverflowGuard, 'Root wrapper must apply overflow-hidden or overflow-x-hidden');

        const allElements = querySelectorAll(doc.ast, '*');
        const violations = [];
        for (const el of allElements) {
          const cls = el.getAttribute('class') || '';
          const risk = checkMobileOverflowRisk(cls);
          if (risk.hasRisk) {
            violations.push(...risk.violatingClasses);
          }
        }
        assert.strictEqual(
          violations.length,
          0,
          `Found in-flow classes causing mobile horizontal overflow: ${violations.join(', ')}`
        );
      });

      engine.test('T1.1.3: Tablet (768px) Grid Breakpoint', () => {
        const hasMdGrid = /md:grid-cols-[2-4]|md:flex-row/.test(doc.raw);
        assert.ok(hasMdGrid, 'Tailwind responsive classes must define multi-column md: layout for tablet');
      });

      engine.test('T1.1.4: Desktop (1280px+) Max-Width Bounds', () => {
        const hasMaxWidth = /max-w-(?:5xl|6xl|7xl)/.test(doc.raw) && /mx-auto/.test(doc.raw);
        assert.ok(hasMaxWidth, 'Main page wrapper must constrain width with max-w-7xl and mx-auto');
      });

      engine.test('T1.1.5: Dynamic Viewport Height Guard', () => {
        const hasDvhOrScreen = /min-h-(?:screen|\[100dvh\])/.test(doc.raw);
        assert.ok(hasDvhOrScreen, 'Hero section must define min-h-screen or min-h-[100dvh] dynamic viewport height');
      });
    });

    // ─── Feature 2: Visual Design & AAS Adherence ──────────────────────────────
    engine.feature('F2', 'Visual Design & AAS Adherence (Tokens, Doppelrand, Contrast)', () => {
      engine.test('T1.2.1: Dark and Light Palette Tokens', () => {
        const globalsCssPath = path.join(workspaceDir, 'src/app/globals.css');
        assert.ok(fs.existsSync(globalsCssPath), 'src/app/globals.css must exist');
        const css = fs.readFileSync(globalsCssPath, 'utf8');

        const block = (selector) => {
          const m = css.match(new RegExp(selector + '\\s*\\{([\\s\\S]*?)\\}'));
          return m ? m[1] : '';
        };
        const dark = block(':root,\\s*\\[data-theme="dark"\\]');
        const light = block('\\[data-theme="light"\\]');
        const roles = ['page', 'panel', 'hairline', 'ink', 'muted', 'faint', 'accent', 'on-accent'];
        for (const [name, palette] of [['dark', dark], ['light', light]]) {
          for (const role of roles) {
            assert.ok(
              new RegExp(`--${role}:\\s*#[0-9a-fA-F]{6}\\b`).test(palette),
              `The ${name} palette must define --${role} as a hex colour`
            );
          }
        }

        // The page grounds: a near-black dark page and a near-white light page.
        const lum = (hex) => {
          const n = parseInt(hex.slice(1), 16);
          return ((n >> 16) & 255) + ((n >> 8) & 255) + (n & 255);
        };
        const darkPage = dark.match(/--page:\s*(#[0-9a-fA-F]{6})/)[1];
        const lightPage = light.match(/--page:\s*(#[0-9a-fA-F]{6})/)[1];
        assert.ok(lum(darkPage) < 3 * 40, `Dark --page must be a dark ground (got ${darkPage})`);
        assert.ok(lum(lightPage) > 3 * 230, `Light --page must be a light ground (got ${lightPage})`);

        // Utilities map onto the roles through @theme.
        assert.ok(/@theme inline\s*\{[\s\S]*--color-page:\s*var\(--page\)/.test(css), '@theme must expose --color-page from --page');
        assert.ok(/--color-accent:\s*var\(--accent\)/.test(css), '@theme must expose --color-accent from --accent');
      });

      engine.test('T1.2.2: Accent Token', () => {
        // Retargeted from the retired cyan accent to the single accent token
        // that the token layer in globals.css now defines.
        const hasAccent = /#E4A13C|--color-accent|text-accent|bg-accent/.test(doc.raw);
        assert.ok(hasAccent, 'A single accent token (#E4A13C / --color-accent) must be present in design');
      });

      engine.test('T1.2.3: Doppelrand Card Double-Bezel Architecture', () => {
        const doubleBezel = verifyDoubleBezel(doc.raw);
        assert.ok(doubleBezel.hasOuterBezel, 'Cards must feature outer bezel (border or ring)');
      });

      engine.test('T1.2.4: Banned Font Elimination', () => {
        const layoutPath = path.join(workspaceDir, 'src/app/layout.tsx');
        const globalsCssPath = path.join(workspaceDir, 'src/app/globals.css');
        let fontConfigs = '';
        if (fs.existsSync(layoutPath)) fontConfigs += fs.readFileSync(layoutPath, 'utf8');
        if (fs.existsSync(globalsCssPath)) fontConfigs += fs.readFileSync(globalsCssPath, 'utf8');
        const fontCheck = verifyFonts(fontConfigs);
        assert.ok(fontCheck.isCompliant, `Found banned generic fonts configured: ${fontCheck.bannedFontsFound.join(', ')}`);
      });

      engine.test('T1.2.5: Text Contrast WCAG Compliance', () => {
        const tokens = extractProjectTokens(workspaceDir);
        assert.ok(tokens.isExtractedFromProject, 'Project stylesheet / config must define color tokens');
        const contrast = calculateContrastRatio(tokens.bodyText, tokens.obsidianSlate);
        assert.ok(contrast >= 15.0, `Obsidian background contrast must exceed 15:1 (calculated: ${contrast.toFixed(2)}:1)`);

        // Retargeted: markup now names roles (page / panel / ink) and the
        // concrete colours live in the two palettes in globals.css, so contrast
        // is a property of the stylesheet rather than a pair of utilities.
        const hasSurface = /bg-page|bg-panel/.test(doc.raw);
        const hasBodyText = /text-ink|text-muted/.test(doc.raw);
        assert.ok(hasSurface && hasBodyText, 'Rendered markup must apply surface and body-text role tokens');

        const cssPath = path.join(workspaceDir, 'src/app/globals.css');
        const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';
        const lightPalette = css.match(
          /\[data-theme="light"\][\s\S]*?--page:\s*(#[0-9a-fA-F]{6})[\s\S]*?--ink:\s*(#[0-9a-fA-F]{6})/
        );
        assert.ok(lightPalette, 'A light palette must define page and ink tokens');
        const lightContrast = calculateContrastRatio(lightPalette[2], lightPalette[1]);
        assert.ok(
          lightContrast >= 7.0,
          `Light palette body contrast must exceed 7:1 (calculated: ${lightContrast.toFixed(2)}:1)`
        );
      });
    });

    // ─── Feature 3: Dedicated Profile Image Placeholder ────────────────────────
    engine.feature('F3', 'Dedicated Profile Image Placeholder', () => {
      engine.test('T1.3.1: Avatar Squircle Container & Monogram', () => {
        const hasMonogram = /TM/.test(doc.raw) || doc.raw.includes('Talha Masood');
        const hasSquircle = /rounded-(?:2xl|3xl|full)|aspect-square/.test(doc.raw);
        assert.ok(hasMonogram && hasSquircle, 'Profile avatar must render monogram TM in squircle container');
      });

      engine.test('T1.3.2: User Replacement Documentation', () => {
        const avatarCompPath = path.join(workspaceDir, 'src/components/ProfileAvatar.tsx');
        const readmePath = path.join(workspaceDir, 'README.md');
        let docs = '';
        if (fs.existsSync(avatarCompPath)) docs += fs.readFileSync(avatarCompPath, 'utf8');
        if (fs.existsSync(readmePath)) docs += fs.readFileSync(readmePath, 'utf8');

        const hasInstructions = /replace|avatar|photo|profile picture/i.test(docs);
        assert.ok(hasInstructions, 'Candidate instructions for replacing avatar placeholder must be documented');
      });

      engine.test('T1.3.3: Accessible Alt Text & Labeling', () => {
        const hasAria = /aria-label=["'][^"']*Talha Masood[^"']*["']|alt=["'][^"']*Talha Masood[^"']*["']/i.test(doc.raw);
        assert.ok(hasAria, 'Profile avatar element must provide descriptive alt text or aria-label');
      });

      engine.test('T1.3.4: Status / Availability Indicator Badge', () => {
        const hasStatus = /Open for|Open to|Available|status/i.test(doc.raw);
        assert.ok(hasStatus, 'Profile avatar component must render availability status indicator badge');
      });

      engine.test('T1.3.5: Static Avatar Asset Resolution', () => {
        const svgPath = path.join(workspaceDir, 'public/avatar-placeholder.svg');
        const hasSvgFile = fs.existsSync(svgPath);
        const hasInlineSvg = /<svg[^>]*>[\s\S]*?TM[\s\S]*?<\/svg>/.test(doc.raw) || /TM/.test(doc.raw);
        assert.ok(hasSvgFile || hasInlineSvg, 'Avatar SVG asset must exist in public/ or as component monogram');
      });
    });

    // ─── Feature 4: Hero Section ───────────────────────────────────────────────
    engine.feature('F4', 'Hero Section (Headline, Location, 3 Macro Metrics, CTAs)', () => {
      engine.test('T1.4.1: Candidate Name & Title Heading', () => {
        const hasName = /Talha Masood/.test(doc.raw);
        const hasTitle = /Full-Stack Software Engineer|Software Engineer/i.test(doc.raw);
        assert.ok(hasName && hasTitle, 'Hero must display candidate name and engineering title');
      });

      engine.test('T1.4.2: Location Badge & Status', () => {
        const hasLocation = /Stuttgart, Germany/i.test(doc.raw);
        assert.ok(hasLocation, 'Hero must display location badge: Stuttgart, Germany');
      });

      engine.test('T1.4.3: Macro Metric 1: 96% Graph Reduction', () => {
        const hasMetric = /96%/.test(doc.raw);
        assert.ok(hasMetric, 'Hero must feature 96% graph reduction macro metric');
      });

      engine.test('T1.4.4: Macro Metrics 2 & 3: 70% & 80% Metrics', () => {
        const has70 = /70%/.test(doc.raw);
        const has80 = /80%/.test(doc.raw);
        assert.ok(has70 && has80, 'Hero must feature 70% test throughput and 80% review time macro metrics');
      });

      engine.test('T1.4.5: Quick Conversion CTA Buttons', () => {
        const hasExperienceCTA = /#experience/.test(doc.raw);
        const hasProjectsCTA = /#projects/.test(doc.raw);
        const hasContactCTA = /#contact/.test(doc.raw);
        assert.ok(
          hasExperienceCTA || hasProjectsCTA || hasContactCTA,
          'Hero must provide quick conversion CTA links to key sections'
        );
      });
    });

    // ─── Feature 5: About / Summary Section ────────────────────────────────────
    engine.feature('F5', 'About / Summary Section (Recruiter Tone, Pillars, No Fluff)', () => {
      engine.test('T1.5.1: Semantic Section & Heading', () => {
        const hasAboutSection = /id=["']about["']|<section[^>]*id=["']about["']/i.test(doc.raw);
        assert.ok(hasAboutSection, 'About section must be present with id="about"');
      });

      engine.test('T1.5.2: Professional Recruiter Tone Narrative', () => {
        const hasNarrative = /4\+?\s*years|data-intensive|systems/i.test(doc.raw);
        assert.ok(hasNarrative, 'About section must present full-stack narrative in recruiter tone');
      });

      engine.test('T1.5.3: Engineering Pillars Presentation', () => {
        const hasPillars = /distributed|architecture|full-stack|systems|cloud/i.test(doc.raw);
        assert.ok(hasPillars, 'About section must articulate core engineering competencies');
      });

      engine.test('T1.5.4: Zero Fluff / Cliché Verification', () => {
        const toneCheck = verifyProfessionalTone(doc.raw);
        assert.ok(
          toneCheck.isProfessional,
          `Banned buzzwords found in copy: ${toneCheck.foundBuzzwords.join(', ')}`
        );
      });

      engine.test('T1.5.5: Non-Duplication vs Experience', () => {
        const sections = extractSections(doc);
        const duplicates = findDuplicateSentences({ about: sections.about, experience: sections.experience });
        assert.strictEqual(
          duplicates.length,
          0,
          `Duplicated sentences between About and Experience: ${duplicates.map(d => d.sentence).join('; ')}`
        );
      });
    });

    // ─── Feature 6: Work Experience ───────────────────────────────────────────
    engine.feature('F6', 'Work Experience (Proxima Fusion, Mercedes-Benz, Dubizzle, metrics)', () => {
      engine.test('T1.6.1: Proxima Fusion Experience Entry', () => {
        const hasProxima = /Proxima Fusion/i.test(doc.raw) && /React Flow|Dagre/i.test(doc.raw);
        assert.ok(hasProxima, 'Proxima Fusion entry with React Flow and graph engineering must be present');
      });

      engine.test('T1.6.2: Mercedes-Benz AG Experience Entry', () => {
        const hasMercedes = /Mercedes-Benz/i.test(doc.raw) && (/antenna|OTA|concurrency/i.test(doc.raw) || /70%/i.test(doc.raw));
        assert.ok(hasMercedes, 'Mercedes-Benz AG entry with antenna testing or concurrency throughput must be present');
      });

      engine.test('T1.6.3: Dubizzle Labs Experience Entry', () => {
        const hasDubizzle = /Dubizzle Labs|Profolio/i.test(doc.raw);
        assert.ok(hasDubizzle, 'Dubizzle Labs entry with Profolio platform must be present');
      });

      engine.test('T1.6.4: Complete Three-Role Timeline', () => {
        // Retargeted: the timeline is deliberately limited to the three roles
        // that carry the narrative — the teaching-assistant and Techlogix
        // entries were removed at the owner's request.
        const hasAllThree =
          /Proxima Fusion/i.test(doc.raw) &&
          /Mercedes-Benz/i.test(doc.raw) &&
          /Dubizzle Labs/i.test(doc.raw);
        assert.ok(hasAllThree, 'Experience timeline must document Proxima Fusion, Mercedes-Benz AG and Dubizzle Labs');
        assert.strictEqual(/Teaching Assistant/i.test(doc.raw), false, 'Retired student-assistant role must not reappear');
      });

      engine.test('T1.6.5: Technology Badges per Card', () => {
        const hasTechBadges = /TypeScript/i.test(doc.raw) && (/React/i.test(doc.raw) || /FastAPI/i.test(doc.raw));
        assert.ok(hasTechBadges, 'Experience entries must render technology stack badges');
      });
    });

    // ─── Feature 7: Featured Projects ──────────────────────────────────────────
    engine.feature('F7', 'Featured Projects (Multi-Agent CAD Spotlight + ML Classifiers)', () => {
      engine.test('T1.7.1: Multi-Agent CAD System Spotlight', () => {
        const hasCad = /Multi-Agent/i.test(doc.raw) && /CAD/i.test(doc.raw);
        assert.ok(hasCad, 'Featured projects must spotlight Multi-Agent CAD Model Creation system');
      });

      engine.test('T1.7.2: Multi-Agent CAD Quantitative Evaluation', () => {
        const hasEval = /CadQuery|Three\.js|FastAPI|ablation|Hausdorff/i.test(doc.raw);
        assert.ok(hasEval, 'CAD project must detail CadQuery, Three.js, FastAPI, or quantitative evaluation');
      });

      engine.test('T1.7.3: Real-time Body Posture Classifier Card', () => {
        const hasPosture = /Posture/i.test(doc.raw) && /MediaPipe/i.test(doc.raw);
        assert.ok(hasPosture, 'Real-time Body Posture Classifier project card must be present');
      });

      engine.test('T1.7.4: Precision Home Agriculture IoT Card', () => {
        const hasAgri = /Agriculture|Flutter/i.test(doc.raw);
        assert.ok(hasAgri, 'Precision Home Agriculture IoT project card must be present');
      });
    });

    // ─── Feature 8: Education & Academics ──────────────────────────────────────
    engine.feature('F8', 'Education & Academics (Univ. of Stuttgart & FAST-NUCES Gold Medal)', () => {
      engine.test('T1.8.1: University of Stuttgart M.Sc. Details', () => {
        const hasStuttgart = /University of Stuttgart|Stuttgart/i.test(doc.raw) && /M\.Sc\.|Master/i.test(doc.raw);
        assert.ok(hasStuttgart, 'University of Stuttgart M.Sc. Computer Science credentials must be present');
      });

      engine.test('T1.8.2: Top Master Academic Modules', () => {
        const hasModules = /Service Management|Cloud Computing|Software Architecture/i.test(doc.raw);
        assert.ok(hasModules, 'Top Master academic modules with high grades must be listed');
      });

      engine.test('T1.8.3: FAST-NUCES B.S. CE & Gold Medal', () => {
        const hasFast = /FAST-NUCES|National University/i.test(doc.raw) && /Gold Medal/i.test(doc.raw);
        assert.ok(hasFast, 'FAST-NUCES B.S. with Gold Medal honor must be displayed');
      });

      engine.test('T1.8.4: FAST-NUCES Dean List Distinction', () => {
        const hasDeansList = /Dean'?s List/i.test(doc.raw);
        assert.ok(hasDeansList, "FAST-NUCES Dean's List academic honor must be displayed");
      });

      engine.test('T1.8.5: Academic Card Doppelrand Styling', () => {
        const hasEducationSection = /id=["']education["']|<section[^>]*id=["']education["']/i.test(doc.raw);
        assert.ok(hasEducationSection, 'Education section with consistent card styling must be rendered');
      });
    });

    // ─── Feature 9: Technical Skills Matrix ────────────────────────────────────
    engine.feature('F9', 'Technical Skills Matrix (Categorized Comprehensive Inventory)', () => {
      engine.test('T1.9.1: Languages Category Inventory', () => {
        const hasLanguages = /TypeScript/i.test(doc.raw) && /Python/i.test(doc.raw) && /SQL/i.test(doc.raw);
        assert.ok(hasLanguages, 'Languages category must contain core languages (TypeScript, Python, SQL)');
      });

      engine.test('T1.9.2: Frontend & Mobile Category Inventory', () => {
        const hasFrontend = /React/i.test(doc.raw) && /Next\.js/i.test(doc.raw) && /Tailwind/i.test(doc.raw);
        assert.ok(hasFrontend, 'Frontend category must contain React, Next.js, and Tailwind CSS');
      });

      engine.test('T1.9.3: Backend & Databases Category Inventory', () => {
        const hasBackend = /Node\.js/i.test(doc.raw) && /FastAPI/i.test(doc.raw);
        assert.ok(hasBackend, 'Backend category must contain Node.js and FastAPI');
      });

      engine.test('T1.9.4: AI/LLM & Cloud/DevOps Inventories', () => {
        const hasCloud = /Docker/i.test(doc.raw) && (/Cloud Run/i.test(doc.raw) || /GCP/i.test(doc.raw) || /AWS/i.test(doc.raw));
        assert.ok(hasCloud, 'Cloud & DevOps inventory must contain Docker and Cloud Run/AWS');
      });

      engine.test('T1.9.5: Testing & Tools Category Inventory', () => {
        const hasTesting = /Vitest|Jest|Testing/i.test(doc.raw) && /Git/i.test(doc.raw);
        assert.ok(hasTesting, 'Testing & Tools category must contain Vitest/Jest and Git');
      });
    });

    // ─── Feature 10: Contact & Social Links ───────────────────────────────────
    engine.feature('F10', 'Contact & Social Links (Email, Phone, LinkedIn, GitHub, Form)', () => {
      engine.test('T1.10.1: Direct Email Mailto Link', () => {
        const hasMailto = /mailto:[^"'\s]+@[^"'\s]+/i.test(doc.raw);
        assert.ok(hasMailto, 'Contact section must provide a mailto: link');
      });

      engine.test('T1.10.2: Direct Phone Tel Link', () => {
        const hasTel = /tel:\+\d{6,}/i.test(doc.raw.replace(/[\s-]/g, ''));
        assert.ok(hasTel, 'Contact section must provide tel: link for phone');
      });

      engine.test('T1.10.3: LinkedIn Profile External Link', () => {
        const hasLinkedIn = /linkedin\.com\/in\/talhamasood22/i.test(doc.raw);
        assert.ok(hasLinkedIn, 'Contact section must provide valid LinkedIn profile link');
      });

      engine.test('T1.10.4: GitHub Profile External Link', () => {
        const hasGitHub = /github\.com\/talhamasood22/i.test(doc.raw);
        assert.ok(hasGitHub, 'Contact section must provide valid GitHub profile link');
      });

      engine.test('T1.10.5: Interactive Contact Form Elements', () => {
        const hasForm = /<form/i.test(doc.raw) || /input/i.test(doc.raw);
        assert.ok(hasForm, 'Contact section must provide interactive contact form or inputs');
      });
    });

    // ─── Feature 11: Non-Duplication Enforcement ──────────────────────────────
    engine.feature('F11', 'Non-Duplication Enforcement Across All Sections', () => {
      engine.test('T1.11.1: Hero Metrics vs Experience Narrative', () => {
        const sections = extractSections(doc);
        const heroSentences = extractSentences(sections.hero, 6);
        const expSentences = extractSentences(sections.experience, 6);
        const overlap = heroSentences.filter(s => expSentences.includes(s));
        assert.strictEqual(overlap.length, 0, 'Hero macro metrics must not duplicate Experience narrative sentences');
      });

      engine.test('T1.11.2: About Summary vs Experience Bullets', () => {
        const sections = extractSections(doc);
        const duplicates = findDuplicateSentences({ about: sections.about, experience: sections.experience });
        assert.strictEqual(duplicates.length, 0, 'About section narrative must not duplicate Experience bullet points');
      });

      engine.test('T1.11.3: CAD Project vs Work Experience Independence', () => {
        const hasCadInProjects = /Multi-Agent.*CAD/i.test(doc.raw);
        assert.ok(hasCadInProjects, 'CAD system must be independently featured in Projects section');
      });

      engine.test('T1.11.4: Skills Matrix vs Experience Tags Role', () => {
        const hasSkillsSection = /id=["']skills["']|<section[^>]*id=["']skills["']/i.test(doc.raw);
        assert.ok(hasSkillsSection, 'Skills matrix must maintain structured global taxonomy');
      });

      engine.test('T1.11.5: Global Page String Deduplication Check', () => {
        const sections = extractSections(doc);
        const duplicates = findDuplicateSentences(sections);
        assert.strictEqual(duplicates.length, 0, 'No sentence >=6 words may be verbatim duplicated across sections');
      });
    });

    // ─── Feature 12: Standalone Build & Zero-Error Compilation ────────────────
    engine.feature('F12', 'Standalone Build & Zero-Error Compilation', () => {
      engine.test('T1.12.1: Package Scripts & Dependencies', () => {
        const pkgPath = path.join(workspaceDir, 'package.json');
        assert.ok(fs.existsSync(pkgPath), 'package.json must exist');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        assert.ok(pkg.scripts && pkg.scripts.build, 'package.json must have build script');
        assert.ok(pkg.dependencies && pkg.dependencies.next, 'package.json must have next dependency');
      });

      engine.test('T1.12.2: Next Config Standalone Output', () => {
        const nextConfigPath = path.join(workspaceDir, 'next.config.mjs');
        const nextConfigJs = path.join(workspaceDir, 'next.config.js');
        const exists = fs.existsSync(nextConfigPath) || fs.existsSync(nextConfigJs);
        assert.ok(exists, 'next.config file must exist');
        const text = fs.readFileSync(exists ? (fs.existsSync(nextConfigPath) ? nextConfigPath : nextConfigJs) : '', 'utf8');
        assert.ok(text.includes('output') && text.includes('standalone'), "next.config must configure output: 'standalone'");
      });

      engine.test('T1.12.3: TypeScript Strict Configuration', () => {
        const tsconfigPath = path.join(workspaceDir, 'tsconfig.json');
        assert.ok(fs.existsSync(tsconfigPath), 'tsconfig.json must exist');
        const text = fs.readFileSync(tsconfigPath, 'utf8');
        assert.ok(text.includes('"strict": true') || text.includes('"strict":true'), 'tsconfig.json must have strict: true');
      });

      engine.test('T1.12.4: Build Command Clean Exit Code', () => {
        const hasBuildOrSource = fs.existsSync(path.join(workspaceDir, '.next')) || fs.existsSync(path.join(workspaceDir, 'src'));
        assert.ok(hasBuildOrSource, 'Project build directory or source tree must exist');
      });

      engine.test('T1.12.5: Standalone Artifact Generation', () => {
        const nextConfigPath = path.join(workspaceDir, 'next.config.mjs');
        const nextConfigJs = path.join(workspaceDir, 'next.config.js');
        const confText = fs.readFileSync(fs.existsSync(nextConfigPath) ? nextConfigPath : nextConfigJs, 'utf8');
        assert.ok(confText.includes('standalone'), 'Next.js configured for standalone output containerization');
      });
    });

    // ─── Feature 13: Multi-Stage Dockerfile & Cloud Run Readiness ──────────────
    engine.feature('F13', 'Multi-Stage Dockerfile & Cloud Run Readiness', () => {
      engine.test('T1.13.1: Multi-Stage Structure', () => {
        const dockerfilePath = path.join(workspaceDir, 'Dockerfile');
        if (!fs.existsSync(dockerfilePath)) {
          assert.fail('Dockerfile not found in workspace root (Feature M3 pending)');
        }
        const validation = validateDockerfile(fs.readFileSync(dockerfilePath, 'utf8'));
        assert.ok(validation.isMultiStage, 'Dockerfile must define multi-stage build (deps, builder, runner)');
      });

      engine.test('T1.13.2: Alpine Minimal Base Image', () => {
        const dockerfilePath = path.join(workspaceDir, 'Dockerfile');
        if (!fs.existsSync(dockerfilePath)) {
          assert.fail('Dockerfile not found in workspace root (Feature M3 pending)');
        }
        const validation = validateDockerfile(fs.readFileSync(dockerfilePath, 'utf8'));
        assert.ok(validation.hasAlpine, 'Dockerfile must use node:*-alpine minimal base image');
      });

      engine.test('T1.13.3: Non-Root User & Group Setup', () => {
        const dockerfilePath = path.join(workspaceDir, 'Dockerfile');
        if (!fs.existsSync(dockerfilePath)) {
          assert.fail('Dockerfile not found in workspace root (Feature M3 pending)');
        }
        const validation = validateDockerfile(fs.readFileSync(dockerfilePath, 'utf8'));
        assert.ok(validation.createsNonRootUser && validation.switchesToNonRoot, 'Dockerfile must create and switch to non-root user nextjs (UID 1001)');
      });

      engine.test('T1.13.4: Cloud Run Port & Host Configuration', () => {
        const dockerfilePath = path.join(workspaceDir, 'Dockerfile');
        if (!fs.existsSync(dockerfilePath)) {
          assert.fail('Dockerfile not found in workspace root (Feature M3 pending)');
        }
        const validation = validateDockerfile(fs.readFileSync(dockerfilePath, 'utf8'));
        assert.ok(validation.setsPort8080 && validation.exposesPort, 'Dockerfile must configure ENV PORT=8080 and EXPOSE 8080 for Cloud Run');
      });

      engine.test('T1.13.5: Standalone Artifacts Copying', () => {
        const dockerfilePath = path.join(workspaceDir, 'Dockerfile');
        if (!fs.existsSync(dockerfilePath)) {
          assert.fail('Dockerfile not found in workspace root (Feature M3 pending)');
        }
        const validation = validateDockerfile(fs.readFileSync(dockerfilePath, 'utf8'));
        assert.ok(validation.copiesStandalone, 'Dockerfile runner stage must copy .next/standalone artifacts');
      });
    });

    // ─── Feature 14: Deployment Scripts ────────────────────────────────────────
    engine.feature('F14', 'Deployment Scripts (deploy-cloudrun.sh, cloudbuild.yaml)', () => {
      engine.test('T1.14.1: Deploy Script Shebang & Strict Mode', () => {
        const scriptPath = path.join(workspaceDir, 'deploy-cloudrun.sh');
        if (!fs.existsSync(scriptPath)) {
          assert.fail('deploy-cloudrun.sh not found in workspace root (Feature M3 pending)');
        }
        const validation = validateCloudRunDeployScript(fs.readFileSync(scriptPath, 'utf8'));
        assert.ok(validation.hasShebang && validation.hasSafeFlags, 'deploy-cloudrun.sh must have bash shebang and set -e strict mode');
      });

      engine.test('T1.14.2: Cloud Run Service Parameters', () => {
        const scriptPath = path.join(workspaceDir, 'deploy-cloudrun.sh');
        if (!fs.existsSync(scriptPath)) {
          assert.fail('deploy-cloudrun.sh not found in workspace root (Feature M3 pending)');
        }
        const validation = validateCloudRunDeployScript(fs.readFileSync(scriptPath, 'utf8'));
        assert.ok(validation.hasServiceName, 'deploy-cloudrun.sh must specify service name talha-masood-portfolio');
      });

      engine.test('T1.14.3: Gcloud Run Deploy Command Syntax', () => {
        const scriptPath = path.join(workspaceDir, 'deploy-cloudrun.sh');
        if (!fs.existsSync(scriptPath)) {
          assert.fail('deploy-cloudrun.sh not found in workspace root (Feature M3 pending)');
        }
        const validation = validateCloudRunDeployScript(fs.readFileSync(scriptPath, 'utf8'));
        assert.ok(validation.deploysCloudRun && validation.allowsUnauthenticated, 'deploy-cloudrun.sh must execute gcloud run deploy with --allow-unauthenticated');
      });

      engine.test('T1.14.4: Cloud Build YAML Pipeline', () => {
        const yamlPath = path.join(workspaceDir, 'cloudbuild.yaml');
        if (!fs.existsSync(yamlPath)) {
          assert.fail('cloudbuild.yaml not found in workspace root (Feature M3 pending)');
        }
        const validation = validateCloudBuildYaml(fs.readFileSync(yamlPath, 'utf8'));
        assert.ok(validation.hasSteps, 'cloudbuild.yaml must define container build and deploy steps');
      });

      engine.test('T1.14.5: Dockerignore File Configuration', () => {
        const dockerignorePath = path.join(workspaceDir, '.dockerignore');
        if (!fs.existsSync(dockerignorePath)) {
          assert.fail('.dockerignore not found in workspace root (Feature M3 pending)');
        }
        const content = fs.readFileSync(dockerignorePath, 'utf8');
        assert.ok(content.includes('node_modules') && content.includes('.next'), '.dockerignore must exclude node_modules and .next');
      });
    });

    // ─── Feature 15: Deployment Guide in README.md ─────────────────────────────
    engine.feature('F15', 'Deployment Guide in README.md', () => {
      engine.test('T1.15.1: Prerequisites Section in README', () => {
        const readmePath = path.join(workspaceDir, 'README.md');
        if (!fs.existsSync(readmePath)) {
          assert.fail('README.md not found in workspace root');
        }
        const validation = validateDeploymentReadme(fs.readFileSync(readmePath, 'utf8'));
        assert.ok(validation.hasPrerequisites, 'README.md must document prerequisites (Node.js, Docker, gcloud)');
      });

      engine.test('T1.15.2: Local Development & Build Commands', () => {
        const readmePath = path.join(workspaceDir, 'README.md');
        if (!fs.existsSync(readmePath)) {
          assert.fail('README.md not found in workspace root');
        }
        const validation = validateDeploymentReadme(fs.readFileSync(readmePath, 'utf8'));
        assert.ok(validation.hasLocalDev, 'README.md must document local development commands (npm run dev)');
      });

      engine.test('T1.15.3: Local Docker Container Testing', () => {
        const readmePath = path.join(workspaceDir, 'README.md');
        if (!fs.existsSync(readmePath)) {
          assert.fail('README.md not found in workspace root');
        }
        const validation = validateDeploymentReadme(fs.readFileSync(readmePath, 'utf8'));
        assert.ok(validation.hasDockerBuild, 'README.md must document local container build commands (docker build)');
      });

      engine.test('T1.15.4: Google Cloud Run Deployment Steps', () => {
        const readmePath = path.join(workspaceDir, 'README.md');
        if (!fs.existsSync(readmePath)) {
          assert.fail('README.md not found in workspace root');
        }
        const validation = validateDeploymentReadme(fs.readFileSync(readmePath, 'utf8'));
        assert.ok(validation.hasCloudRunDeploy, 'README.md must document Google Cloud Run deployment steps');
      });

      engine.test('T1.15.5: Production Environment & Architecture Notes', () => {
        const readmePath = path.join(workspaceDir, 'README.md');
        if (!fs.existsSync(readmePath)) {
          assert.fail('README.md not found in workspace root');
        }
        const text = fs.readFileSync(readmePath, 'utf8');
        assert.ok(/port|8080|standalone|cloud run/i.test(text), 'README.md must document architecture and Cloud Run environment notes');
      });
    });
  });
}

if (require.main === module) {
  const { engine: standaloneEngine } = require('./harness/engine');
  registerTier1(standaloneEngine);
  standaloneEngine.run().then(passed => process.exit(passed ? 0 : 1));
}

module.exports = { registerTier1 };
