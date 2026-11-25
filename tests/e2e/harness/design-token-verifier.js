/**
 * tests/e2e/harness/design-token-verifier.js
 * Pure Node.js WCAG 2.2 contrast calculator, palette validator, and Doppelrand inspector.
 * Zero external npm dependencies.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

function parseHexToRgb(hex) {
  let clean = String(hex).replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  const num = parseInt(clean, 16);
  return [
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255
  ];
}

function getRelativeLuminance(hex) {
  const rgb = parseHexToRgb(hex).map(c => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function calculateContrastRatio(hexA, hexB) {
  const lumA = getRelativeLuminance(hexA);
  const lumB = getRelativeLuminance(hexB);
  const l1 = Math.max(lumA, lumB);
  const l2 = Math.min(lumA, lumB);
  return (l1 + 0.05) / (l2 + 0.05);
}

const DESIGN_TOKENS = {
  obsidianSlate: '#090D16',
  surfaceSlate: '#0F172A',
  electricCyan: '#38BDF8',
  bodyText: '#F8FAFC',
  mutedText: '#94A3B8'
};

/**
 * Extracts colour tokens from the dark palette in src/app/globals.css
 * (the `:root, [data-theme="dark"]` block): --page, --ink, --accent, --panel,
 * --muted. Falls back to DESIGN_TOKENS only when the stylesheet or a token is
 * absent, and reports whether anything came from the project.
 */
function extractProjectTokens(workspaceDir = process.cwd()) {
  const cssPath = path.join(workspaceDir, 'src/app/globals.css');
  const cssContent = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';

  const darkBlock = (cssContent.match(/:root,\s*\[data-theme="dark"\]\s*\{([\s\S]*?)\}/) || [])[1] || '';
  const token = (name) => {
    const m = darkBlock.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})\\b`));
    return m ? m[1] : null;
  };

  const bg = token('page');
  const fg = token('ink');
  const accent = token('accent');
  const surface = token('panel');
  const muted = token('muted');

  return {
    obsidianSlate: bg || DESIGN_TOKENS.obsidianSlate,
    bodyText: fg || DESIGN_TOKENS.bodyText,
    electricCyan: accent || DESIGN_TOKENS.electricCyan,
    surfaceSlate: surface || DESIGN_TOKENS.surfaceSlate,
    mutedText: muted || DESIGN_TOKENS.mutedText,
    isExtractedFromProject: Boolean(bg && fg)
  };
}

const BANNED_FONTS = ['Inter', 'Roboto', 'Arial', 'Helvetica'];

/**
 * Verifies font configurations against banned generic fonts
 */
function verifyFonts(fontConfigString) {
  const violations = [];
  for (const banned of BANNED_FONTS) {
    // Flag if banned font appears in import syntax or font configuration context:
    // e.g. import { Inter } from 'next/font/google', const { Inter } = require('next/font'),
    // fontFamily: ['Inter'], font-family: Arial, or font-sans: Helvetica
    const fontDeclRegex = new RegExp(
      `(?:import\\s+(?:{[^}]*\\b${banned}\\b[^}]*}|\\b${banned}\\b)\\s+from\\s+['"\`]next\\/font|(?:const|let|var)\\s+{[^}]*\\b${banned}\\b[^}]*}\\s*=\\s*require\\(['"\`]next\\/font|(?:fontFamily|next\\/font|font-family|font-sans)[^;}]*\\b${banned}\\b)`,
      'i'
    );
    if (fontDeclRegex.test(fontConfigString)) {
      violations.push(banned);
    }
  }
  return {
    isCompliant: violations.length === 0,
    bannedFontsFound: violations
  };
}

function verifyDoubleBezel(classesOrRawHtml) {
  const text = String(classesOrRawHtml);

  const hasOuterBezel = /\b(?:ring-1|ring-2|border|p-\[1px\]|border-white\/10|ring-white\/10|border-slate-800)\b/.test(text);
  const hasInnerCore = /\b(?:bg-\[#0F172A\]|bg-\[#090D16\]|bg-slate-900|bg-slate-950|bg-slate-900\/\d+)\b/.test(text);
  const hasSpecularHighlight = /\b(?:shadow-\[inset|from-white\/|via-white\/|inset-0|specular|bg-gradient)\b/.test(text);

  return {
    isDoppelrand: hasOuterBezel && (hasInnerCore || hasSpecularHighlight),
    hasOuterBezel,
    hasInnerCore,
    hasSpecularHighlight
  };
}

function verifyFocusVisibleRing(classString) {
  const text = String(classString);
  const hasFocusRing = /focus-visible:ring(?:-[12])?/.test(text) || /focus:ring(?:-[12])?/.test(text) || /focus-ring/.test(text);
  const hasRingColor = /ring-(?:sky|cyan|white)/.test(text) || /focus-ring/.test(text);
  const hasOffset = /ring-offset/.test(text) || /focus-ring/.test(text);

  return {
    isCompliant: hasFocusRing && hasRingColor,
    hasFocusRing,
    hasRingColor,
    hasOffset
  };
}

module.exports = {
  DESIGN_TOKENS,
  BANNED_FONTS,
  parseHexToRgb,
  getRelativeLuminance,
  calculateContrastRatio,
  extractProjectTokens,
  verifyFonts,
  verifyDoubleBezel,
  verifyFocusVisibleRing
};
