#!/usr/bin/env node
// Add loading="lazy" decoding="async" to <img> tags that lack them.
// Skip above-the-fold imgs (boot-splash profile photo + header logo).

import { readFileSync, writeFileSync } from 'node:fs';

const SKIP_SRCS = [
  'assets/profile-photo.webp', // dock avatar / boot screen — eager
  'assets/ishaq-logo.svg',     // header logo — eager
];

const path = 'index.html';
const src = readFileSync(path, 'utf8');

let count = 0;
const out = src.replace(/<img\b([^>]*?)\/?>/g, (full, attrs) => {
  if (/\bloading=/.test(attrs)) return full;
  const isSkip = SKIP_SRCS.some(s => attrs.includes(s));
  if (isSkip) {
    // Promote to fetchpriority=high on these critical fold images.
    if (!/\bfetchpriority=/.test(attrs)) {
      count++;
      return `<img${attrs} fetchpriority="high" decoding="async">`;
    }
    return full;
  }
  count++;
  return `<img${attrs} loading="lazy" decoding="async">`;
});

writeFileSync(path, out);
console.log(`Patched ${count} <img> tags`);
