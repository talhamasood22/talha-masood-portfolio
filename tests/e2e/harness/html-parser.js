/**
 * tests/e2e/harness/html-parser.js
 * Pure Node.js streaming HTML / JSX AST parser and selector engine.
 * Progressive testability: loads pre-rendered Next.js HTML and source components.
 * Zero external npm dependencies.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

// Void / self-closing HTML tags
const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

class ASTNode {
  constructor(tagName = 'root', attributes = {}, parent = null) {
    this.tagName = tagName.toLowerCase();
    this.attributes = attributes;
    this.children = [];
    this.parent = parent;
    this.textContent = '';
    this.rawHtml = '';
  }

  getAttribute(name) {
    return this.attributes[name.toLowerCase()] ?? null;
  }

  hasAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name.toLowerCase());
  }

  getClasses() {
    const cls = this.attributes['class'] || this.attributes['classname'] || '';
    return cls.trim().split(/\s+/).filter(Boolean);
  }

  hasClass(className) {
    return this.getClasses().includes(className);
  }

  getText() {
    if (this.children.length === 0) {
      return this.textContent.trim();
    }
    return this.children.map(c => c.getText()).filter(Boolean).join(' ').trim();
  }
}

/**
 * Parses raw HTML string into lightweight AST
 */
function parseHtml(html) {
  const root = new ASTNode('document');
  let current = root;
  const tagRegex = /<!--[\s\S]*?-->|<!DOCTYPE[^>]*>|<\/?([a-zA-Z0-9:-]+)((?:\s+[^=>\s]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^>\s]+))?)*)\s*(\/?)>/g;

  let lastIndex = 0;
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    const textBefore = html.slice(lastIndex, match.index);
    if (textBefore.trim().length > 0) {
      const textNode = new ASTNode('#text', {}, current);
      textNode.textContent = textBefore;
      current.children.push(textNode);
    }
    lastIndex = tagRegex.lastIndex;

    const fullMatch = match[0];
    if (fullMatch.startsWith('<!--') || fullMatch.toUpperCase().startsWith('<!DOCTYPE')) {
      continue;
    }

    const tagName = match[1];
    const rawAttrs = match[2] || '';
    const isSelfClosing = match[3] === '/' || VOID_TAGS.has(tagName.toLowerCase());
    const isClosing = fullMatch.startsWith('</');

    if (isClosing) {
      if (current.parent && current.tagName === tagName.toLowerCase()) {
        current = current.parent;
      } else {
        let p = current.parent;
        while (p && p.tagName !== tagName.toLowerCase() && p !== root) {
          p = p.parent;
        }
        if (p && p.parent) {
          current = p.parent;
        }
      }
    } else {
      const attributes = {};
      const attrRegex = /([a-zA-Z0-9:_-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+)))?/g;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
        const attrName = attrMatch[1].toLowerCase();
        const attrVal = attrMatch[2] !== undefined ? attrMatch[2] :
                        attrMatch[3] !== undefined ? attrMatch[3] :
                        attrMatch[4] !== undefined ? attrMatch[4] : '';
        attributes[attrName] = attrVal;
      }

      const node = new ASTNode(tagName, attributes, current);
      node.rawHtml = fullMatch;
      current.children.push(node);

      if (!isSelfClosing) {
        current = node;
      }
    }
  }

  const trailingText = html.slice(lastIndex);
  if (trailingText.trim().length > 0) {
    const textNode = new ASTNode('#text', {}, current);
    textNode.textContent = trailingText;
    current.children.push(textNode);
  }

  return root;
}

function matchesSimpleSelector(node, sel) {
  if (!node || node.tagName === 'document' || node.tagName === '#text') return false;

  let remaining = sel.trim();

  // Tag name
  const tagMatch = remaining.match(/^([a-zA-Z0-9:-]+)/);
  if (tagMatch) {
    if (tagMatch[1].toLowerCase() !== node.tagName) return false;
    remaining = remaining.slice(tagMatch[1].length);
  }

  // ID selector #id
  const idMatch = remaining.match(/^#([a-zA-Z0-9:_-]+)/);
  if (idMatch) {
    if (node.getAttribute('id') !== idMatch[1]) return false;
    remaining = remaining.slice(idMatch[0].length);
  }

  // Class selector .class
  while (remaining.startsWith('.')) {
    const classMatch = remaining.match(/^\.([a-zA-Z0-9:_\\/-]+)/);
    if (!classMatch) break;
    const cleanClass = classMatch[1].replace(/\\/g, '');
    if (!node.hasClass(cleanClass)) return false;
    remaining = remaining.slice(classMatch[0].length);
  }

  // Attribute selector [attr=val]
  while (remaining.startsWith('[')) {
    const attrMatch = remaining.match(/^\[([a-zA-Z0-9:_-]+)(?:([*^$!]?=)(?:"([^"]*)"|'([^']*)'|([^\]]+)))?\]/);
    if (!attrMatch) break;
    const attrName = attrMatch[1].toLowerCase();
    const op = attrMatch[2];
    const expectedVal = attrMatch[3] !== undefined ? attrMatch[3] :
                        attrMatch[4] !== undefined ? attrMatch[4] :
                        attrMatch[5] !== undefined ? attrMatch[5] : null;

    if (!node.hasAttribute(attrName)) return false;
    const actualVal = node.getAttribute(attrName);

    if (op && expectedVal !== null) {
      if (op === '=' && actualVal !== expectedVal) return false;
      if (op === '*=' && !actualVal.includes(expectedVal)) return false;
      if (op === '^=' && !actualVal.startsWith(expectedVal)) return false;
      if (op === '$=' && !actualVal.endsWith(expectedVal)) return false;
      if (op === '!=' && actualVal === expectedVal) return false;
    }

    remaining = remaining.slice(attrMatch[0].length);
  }

  return remaining.length === 0;
}

function querySelectorAll(root, selector) {
  if (!root) return [];
  if (selector === '*') {
    const all = [];
    const walk = (node) => {
      if (node.tagName !== 'document' && node.tagName !== '#text') {
        all.push(node);
      }
      for (const child of node.children) {
        walk(child);
      }
    };
    walk(root);
    return all;
  }

  const commaParts = selector.split(',').map(s => s.trim());
  if (commaParts.length > 1) {
    const set = new Set();
    for (const part of commaParts) {
      const matches = querySelectorAll(root, part);
      matches.forEach(m => set.add(m));
    }
    return Array.from(set);
  }

  const tokens = selector.trim().split(/\s+/).filter(Boolean);
  let candidates = [root];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === '>') {
      const nextToken = tokens[++i];
      const nextCandidates = [];
      for (const parent of candidates) {
        for (const child of parent.children) {
          if (matchesSimpleSelector(child, nextToken)) {
            nextCandidates.push(child);
          }
        }
      }
      candidates = nextCandidates;
    } else {
      const nextCandidates = [];
      const searchDescendants = (node) => {
        for (const child of node.children) {
          if (matchesSimpleSelector(child, token)) {
            nextCandidates.push(child);
          }
          searchDescendants(child);
        }
      };
      for (const c of candidates) {
        searchDescendants(c);
      }
      candidates = nextCandidates;
    }
  }

  return candidates;
}

function querySelector(root, selector) {
  const matches = querySelectorAll(root, selector);
  return matches.length > 0 ? matches[0] : null;
}

function getElementById(root, id) {
  return querySelector(root, `#${id}`);
}

function getElementsByTagName(root, tagName) {
  return querySelectorAll(root, tagName);
}

function getElementsByClassName(root, className) {
  return querySelectorAll(root, `.${className}`);
}

function findText(root, pattern) {
  const matches = [];
  const walk = (node) => {
    if (node.tagName === '#text') {
      const matchesPattern = pattern instanceof RegExp
        ? pattern.test(node.textContent)
        : node.textContent.includes(pattern);
      if (matchesPattern) {
        matches.push(node.parent || node);
      }
    }
    for (const child of node.children) {
      walk(child);
    }
  };
  walk(root);
  return matches;
}

/**
 * Progressive Document Loader:
 * Loads pre-rendered Next.js HTML and synthesizes source component data.
 */
function loadDocument(workspaceDir = process.cwd()) {
  const buildPaths = [
    path.join(workspaceDir, '.next/server/app/page.html'),
    path.join(workspaceDir, '.next/server/app/index.html')
  ];

  let buildHtml = '';
  let buildPath = '';
  for (const bp of buildPaths) {
    if (fs.existsSync(bp)) {
      buildHtml = fs.readFileSync(bp, 'utf8');
      buildPath = bp;
      break;
    }
  }

  // Source tree inspection
  const sourceComponents = [
    'src/app/layout.tsx',
    'src/app/page.tsx',
    'src/components/HeroSection.tsx',
    'src/components/AboutSection.tsx',
    'src/components/ExperienceSection.tsx',
    'src/components/ProjectsSection.tsx',
    'src/components/EducationSection.tsx',
    'src/components/SkillsSection.tsx',
    'src/components/ContactSection.tsx',
    'src/components/ContactForm.tsx',
    'src/components/CopyEmailButton.tsx',
    'src/components/SiteHeader.tsx',
    'src/components/ThemeToggle.tsx',
    'src/components/Footer.tsx',
    'src/components/ProfileAvatar.tsx',
    'src/components/Availability.tsx',
    'src/components/DashList.tsx',
    'src/components/icons.tsx',
    'src/data/portfolio.ts'
  ];

  let sourceContents = '';
  for (const rel of sourceComponents) {
    const fullPath = path.join(workspaceDir, rel);
    if (fs.existsSync(fullPath)) {
      sourceContents += `\n<!-- SOURCE: ${rel} -->\n` + fs.readFileSync(fullPath, 'utf8') + '\n';
    }
  }

  const combinedRaw = (buildHtml ? buildHtml + '\n' : '') + sourceContents;
  const ast = parseHtml(buildHtml || combinedRaw);

  return {
    type: buildHtml ? 'build_html' : (sourceContents ? 'source_tsx' : 'none'),
    path: buildPath || workspaceDir,
    raw: combinedRaw,
    buildHtml,
    sourceContents,
    ast
  };
}

module.exports = {
  ASTNode,
  parseHtml,
  querySelectorAll,
  querySelector,
  getElementById,
  getElementsByTagName,
  getElementsByClassName,
  findText,
  loadDocument
};
