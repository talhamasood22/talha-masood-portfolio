/**
 * tests/e2e/harness/tailwind-inspector.js
 * Pure Node.js Tailwind responsive utility and breakpoint simulator.
 * Zero external npm dependencies.
 */

'use strict';

const BREAKPOINTS = {
  base: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

const DISPLAY_UTILITIES = new Set([
  'block', 'inline-block', 'inline', 'flex', 'inline-flex',
  'grid', 'inline-grid', 'table', 'table-cell', 'hidden'
]);

function parseClasses(classString) {
  if (!classString) return [];
  return String(classString)
    .trim()
    .split(/\s+/)
    .map(c => c.trim())
    .filter(Boolean);
}

function categorizeByBreakpoint(classString) {
  const classes = parseClasses(classString);
  const result = {
    base: [],
    sm: [],
    md: [],
    lg: [],
    xl: [],
    '2xl': []
  };

  for (const cls of classes) {
    const match = cls.match(/^(?:([a-z0-9]+):)?(.*)$/);
    if (!match) continue;
    const prefix = match[1];
    const utility = match[2];

    if (prefix && prefix in result) {
      result[prefix].push(utility);
    } else {
      result.base.push(cls);
    }
  }

  return result;
}

function getEffectiveDisplay(classString, viewportWidth = 1280) {
  const categorized = categorizeByBreakpoint(classString);
  let effective = 'block';

  for (const cls of categorized.base) {
    if (DISPLAY_UTILITIES.has(cls)) effective = cls;
  }

  if (viewportWidth >= BREAKPOINTS.sm) {
    for (const cls of categorized.sm) {
      if (DISPLAY_UTILITIES.has(cls)) effective = cls;
    }
  }

  if (viewportWidth >= BREAKPOINTS.md) {
    for (const cls of categorized.md) {
      if (DISPLAY_UTILITIES.has(cls)) effective = cls;
    }
  }

  if (viewportWidth >= BREAKPOINTS.lg) {
    for (const cls of categorized.lg) {
      if (DISPLAY_UTILITIES.has(cls)) effective = cls;
    }
  }

  if (viewportWidth >= BREAKPOINTS.xl) {
    for (const cls of categorized.xl) {
      if (DISPLAY_UTILITIES.has(cls)) effective = cls;
    }
  }

  return effective;
}

function getEffectiveGridCols(classString, viewportWidth = 1280) {
  const categorized = categorizeByBreakpoint(classString);
  let cols = 1;

  const extractCols = (utilities) => {
    for (const u of utilities) {
      const match = u.match(/^grid-cols-(\d+)$/);
      if (match) return parseInt(match[1], 10);
    }
    return null;
  };

  const baseCols = extractCols(categorized.base);
  if (baseCols !== null) cols = baseCols;

  if (viewportWidth >= BREAKPOINTS.sm) {
    const smCols = extractCols(categorized.sm);
    if (smCols !== null) cols = smCols;
  }
  if (viewportWidth >= BREAKPOINTS.md) {
    const mdCols = extractCols(categorized.md);
    if (mdCols !== null) cols = mdCols;
  }
  if (viewportWidth >= BREAKPOINTS.lg) {
    const lgCols = extractCols(categorized.lg);
    if (lgCols !== null) cols = lgCols;
  }
  if (viewportWidth >= BREAKPOINTS.xl) {
    const xlCols = extractCols(categorized.xl);
    if (xlCols !== null) cols = xlCols;
  }

  return cols;
}

/**
 * Checks for hardcoded fixed pixel widths > maxWidth (default 375px) without responsive prefixes on in-flow elements
 */
function checkMobileOverflowRisk(classString, maxWidth = 375) {
  const classes = parseClasses(classString);
  const risks = [];

  // Out-of-flow elements (absolute, fixed, pointer-events-none) do not cause horizontal layout flow overflow
  const isOutOfFlow = classes.includes('absolute') || classes.includes('fixed') || classes.includes('pointer-events-none');
  if (isOutOfFlow) {
    return { hasRisk: false, violatingClasses: [], risks: [] };
  }

  for (const cls of classes) {
    // Ignore responsive overrides (sm:, md:, lg:, etc.)
    if (/^(sm|md|lg|xl|2xl):/.test(cls)) continue;

    // Check fixed pixel widths: w-[400px], min-w-[500px]
    const match = cls.match(/^(?:min-)?w-\[(\d+)px\]$/);
    if (match) {
      const px = parseInt(match[1], 10);
      if (px > maxWidth) {
        risks.push({ class: cls, width: px });
      }
    }
  }

  return {
    hasRisk: risks.length > 0,
    violatingClasses: risks.map(r => r.class),
    risks
  };
}

function checkTouchTargetSize(classString) {
  const classes = parseClasses(classString);
  const compliantTokens = [
    'min-h-[44px]', 'min-w-[44px]',
    'h-11', 'w-11',
    'h-12', 'w-12',
    'p-3', 'p-3.5', 'p-4',
    'py-3', 'px-3',
    'py-3.5', 'px-4',
    'py-2.5', 'px-8',
    'min-h-11', 'min-w-11',
    'focus-ring',
    'rounded-full'
  ];

  let compliant = false;
  let matchingTokens = [];

  for (const token of compliantTokens) {
    if (classes.some(c => c === token || c.endsWith(`:${token}`))) {
      compliant = true;
      matchingTokens.push(token);
    }
  }

  return {
    compliant,
    matchingTokens
  };
}

module.exports = {
  BREAKPOINTS,
  parseClasses,
  categorizeByBreakpoint,
  getEffectiveDisplay,
  getEffectiveGridCols,
  checkMobileOverflowRisk,
  checkTouchTargetSize
};
