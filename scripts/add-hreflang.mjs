#!/usr/bin/env node
// Inject hreflang link tags for PK <-> global landing-page pairs.
// Inserts after the existing <link rel="canonical"> on each page.

import { readFileSync, writeFileSync } from 'node:fs';

const PAIRS = [
  ['flutter-community-leader.html',          'flutter-community-leader-pakistan.html'],
  ['flutter-expert.html',                    'flutter-expert-pakistan.html'],
  ['flutter-framework-contributor.html',     'flutter-framework-contributor-pakistan.html'],
  ['best-flutter-developer.html',            'best-flutter-developer-pakistan.html'],
  ['top-flutter-developers.html',            'top-flutter-developers-in-pakistan.html'],
];

const BASE = 'https://ishaqhassan.dev/';

function buildHreflang(globalPath, pkPath) {
  return [
    `<link rel="alternate" hreflang="en" href="${BASE}${globalPath}">`,
    `<link rel="alternate" hreflang="en-US" href="${BASE}${globalPath}">`,
    `<link rel="alternate" hreflang="en-PK" href="${BASE}${pkPath}">`,
    `<link rel="alternate" hreflang="x-default" href="${BASE}${globalPath}">`,
  ].join('\n');
}

let patched = 0;
let skipped = 0;
for (const [globalPath, pkPath] of PAIRS) {
  for (const path of [globalPath, pkPath]) {
    const src = readFileSync(path, 'utf8');
    if (src.includes('hreflang="en-PK"')) {
      console.log(`  skip (already has hreflang): ${path}`);
      skipped++;
      continue;
    }
    const block = buildHreflang(globalPath, pkPath);
    const canonRe = /(<link rel="canonical"[^>]*>)/;
    if (!canonRe.test(src)) {
      console.log(`  WARN no canonical found in: ${path}`);
      continue;
    }
    const out = src.replace(canonRe, `$1\n${block}`);
    writeFileSync(path, out);
    console.log(`  patched: ${path}`);
    patched++;
  }
}
console.log(`\nPatched: ${patched}  Skipped: ${skipped}`);
