/**
 * tests/e2e/harness/content-verifier.js
 * Pure Node.js section text extraction, anti-duplication, metric attribution, and tone analysis.
 * Zero external npm dependencies.
 */

'use strict';

const BANNED_BUZZWORDS = [
  'rockstar', 'ninja', 'guru', 'passionate coder', 'hard worker',
  'synergy', 'go-getter', 'thought leader', 'wizard'
];

const TECHNICAL_ACTION_VERBS = [
  'architected', 'engineered', 'optimized', 'decoupled', 'paginated',
  'developed', 'implemented', 'automated', 'standardized', 'built',
  'scaled', 'designed', 'deployed', 'containerized', 'spearheaded'
];

/**
 * Extracts normalized text for each section from AST or synthesized raw HTML
 */
function extractSections(documentNode) {
  const sections = {
    hero: '',
    about: '',
    experience: '',
    projects: '',
    education: '',
    skills: '',
    contact: ''
  };

  if (!documentNode) return sections;

  const raw = documentNode.raw || '';

  // 1. Try extracting by section tag with ID from raw or AST
  for (const key of Object.keys(sections)) {
    // Look for <section id="key"> or id="key" in AST or raw text
    const idRegex = new RegExp(`(?:<section[^>]*id=["']${key}["'][^>]*>|<div[^>]*id=["']${key}["'][^>]*>)([\\s\\S]*?)(?:<\\/section>|<\\/div>\\s*<div id=|<\\/div>\\s*<section id=|<footer)`, 'i');
    const match = raw.match(idRegex);
    if (match) {
      sections[key] = match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    } else {
      // Check for component source marker <!-- SOURCE: src/components/KeySection.tsx -->
      const capKey = key.charAt(0).toUpperCase() + key.slice(1);
      const compRegex = new RegExp(`<!-- SOURCE: src\\/components\\/${capKey}(?:Section)?\\.tsx -->([\\s\\S]*?)(?:<!-- SOURCE:|$)`, 'i');
      const compMatch = raw.match(compRegex);
      if (compMatch) {
        sections[key] = compMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }
  }

  return sections;
}

/**
 * Normalizes and extracts sentences with minimum word count
 */
function extractSentences(text, minWords = 5) {
  if (!text) return [];
  const rawSentences = text
    .replace(/([.?!])\s+/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(Boolean);

  const normalized = [];
  for (const s of rawSentences) {
    const words = s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(Boolean);

    if (words.length >= minWords) {
      normalized.push(words.join(' '));
    }
  }

  return normalized;
}

/**
 * Finds sentences duplicated across more than one section
 */
function findDuplicateSentences(sectionMap) {
  const sentenceToSections = new Map();

  for (const [sectionName, text] of Object.entries(sectionMap)) {
    const sentences = extractSentences(text, 6);
    const seenInThisSection = new Set();

    for (const sent of sentences) {
      if (seenInThisSection.has(sent)) continue;
      seenInThisSection.add(sent);

      if (!sentenceToSections.has(sent)) {
        sentenceToSections.set(sent, []);
      }
      sentenceToSections.get(sent).push(sectionName);
    }
  }

  const duplicates = [];
  for (const [sentence, sections] of sentenceToSections.entries()) {
    if (sections.length > 1) {
      duplicates.push({ sentence, sections });
    }
  }

  return duplicates;
}

/**
 * Computes Jaccard similarity based on word shingles
 */
function calculateJaccardSimilarity(textA, textB, shingleSize = 5) {
  const getShingles = (text) => {
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
    const shingles = new Set();
    for (let i = 0; i <= words.length - shingleSize; i++) {
      shingles.add(words.slice(i, i + shingleSize).join(' '));
    }
    return shingles;
  };

  const shinglesA = getShingles(textA);
  const shinglesB = getShingles(textB);

  if (shinglesA.size === 0 || shinglesB.size === 0) return 0;

  let intersection = 0;
  for (const s of shinglesA) {
    if (shinglesB.has(s)) intersection++;
  }

  const union = shinglesA.size + shinglesB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Extracts quantitative metric claims (e.g. 96%, 70%, 80%, 100K+)
 */
function extractMetricClaims(text) {
  const regex = /\b(?:\d+%(?:\s+reduction|\s+increase|\s+boost)?|\d+,\d+\s*(?:→|->|to)\s*\d+|\d+K\+|\d+x)\b/gi;
  return text.match(regex) || [];
}

/**
 * Verifies professional tone without banned buzzwords
 */
function verifyProfessionalTone(text) {
  const lower = String(text).toLowerCase();
  const foundBuzzwords = [];
  for (const word of BANNED_BUZZWORDS) {
    if (lower.includes(word)) {
      foundBuzzwords.push(word);
    }
  }

  let actionVerbCount = 0;
  for (const verb of TECHNICAL_ACTION_VERBS) {
    if (lower.includes(verb)) {
      actionVerbCount++;
    }
  }

  return {
    isProfessional: foundBuzzwords.length === 0,
    foundBuzzwords,
    actionVerbCount
  };
}

module.exports = {
  BANNED_BUZZWORDS,
  TECHNICAL_ACTION_VERBS,
  extractSections,
  extractSentences,
  findDuplicateSentences,
  calculateJaccardSimilarity,
  extractMetricClaims,
  verifyProfessionalTone
};
