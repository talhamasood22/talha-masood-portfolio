/**
 * tests/e2e/harness/colors.js
 * Pure Node.js ANSI color and terminal styling utilities.
 * Zero external npm dependencies.
 */

'use strict';

const isColorSupported = !process.env.NO_COLOR && (process.env.FORCE_COLOR || process.stdout.isTTY || true);

function style(code, close = 39) {
  return function (text) {
    if (!isColorSupported || text === undefined || text === null) return String(text ?? '');
    return `\x1b[${code}m${text}\x1b[${close}m`;
  };
}

const colors = {
  reset: style(0, 0),
  bold: style(1, 22),
  dim: style(2, 22),
  italic: style(3, 23),
  underline: style(4, 24),
  inverse: style(7, 27),

  // Foreground colors
  black: style(30),
  red: style(31),
  green: style(32),
  yellow: style(33),
  blue: style(34),
  magenta: style(35),
  cyan: style(36),
  white: style(37),
  gray: style(90),

  // Bright colors
  brightRed: style(91),
  brightGreen: style(92),
  brightYellow: style(93),
  brightBlue: style(94),
  brightMagenta: style(95),
  brightCyan: style(96),
  brightWhite: style(97),

  // Background colors
  bgBlack: style(40, 49),
  bgRed: style(41, 49),
  bgGreen: style(42, 49),
  bgYellow: style(43, 49),
  bgBlue: style(44, 49),
  bgMagenta: style(45, 49),
  bgCyan: style(46, 49),
  bgWhite: style(47, 49),

  strip(str) {
    return String(str).replace(/\x1b\[\d+m/g, '');
  },

  box(title, contentLines, width = 74) {
    const horizontal = '─'.repeat(width - 2);
    const top = `┌${horizontal}┐`;
    const bottom = `└${horizontal}┘`;
    const formattedTitle = title ? ` ${title} ` : '';
    const titlePadding = Math.max(0, width - 4 - colors.strip(formattedTitle).length);
    const header = `┌─${formattedTitle}${'─'.repeat(titlePadding)}┐`;

    const body = contentLines.map(line => {
      const stripped = colors.strip(line);
      const pad = Math.max(0, width - 4 - stripped.length);
      return `│ ${line}${' '.repeat(pad)} │`;
    }).join('\n');

    return `${header}\n${body}\n${bottom}`;
  }
};

module.exports = { colors };
