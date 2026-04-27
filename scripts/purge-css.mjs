#!/usr/bin/env node
// Conservative PurgeCSS pass with broad safelist for dynamic classes.
// Reads the unminified css/style.css, scans HTML + every JS file for class references,
// strips unused, then re-runs cssnano. Result -> css/style.min.css.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PurgeCSS } from 'purgecss';
import postcss from 'postcss';
import cssnano from 'cssnano';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const fmt = (n) => (n / 1024).toFixed(1) + ' KB';

// HTML: index + landing pages + sub-window pages.
// JS:   every src/* (template strings build dynamic class names like `mob-${k}-active`).
const content = [
  join(ROOT, 'index.html'),
  join(ROOT, '*.html'),
  join(ROOT, 'js/*.js'),
  join(ROOT, '**/index.html'),
  join(ROOT, 'articles/**/*.html'),
];

// Safelist: anything matching these regexes survives even if static scan misses it.
// Generous on purpose — risk of breakage > tiny extra bytes.
const safelist = {
  standard: [
    'is-open', 'is-active', 'is-visible', 'is-hidden', 'is-loading',
    'show', 'hide', 'open', 'closed', 'minimized', 'maximized', 'fullscreen',
    'active', 'disabled', 'selected', 'focused', 'expanded', 'collapsed',
    'sb-active', 'menu-active', 'tab-active', 'has-fshell',
    /-active$/, /-open$/, /-show$/, /-hide$/, /-visible$/, /-hidden$/,
    /^max-/, /^mob-/, /^fc-/, /^li-/, /^wp-/, /^sb-/, /^win-/, /^app-/,
    /^dock-/, /^dropdown/, /^menu-/, /^toolbar/, /^card-/, /^pill-/,
    /^badge-/, /^icon-/, /^tech-/, /^mobile-/, /^pr-/, /^cs$/, /^cs-/,
    /^morph/, /^splash/, /^boot-/, /^fshell/, /^maxchat/, /^max-msg/,
    /^max-form/, /^max-input/, /^max-tab/, /^max-bar/, /^max-cards/,
    /^contact-/, /^accent-/, /^data-accent/,
    /^widget-/, /^music-/, /^weather-/,
    /^fullscreen-/, /^win-/, /^title-/,
    /^snake-/, /^game-/,
    /^article-/, /^articles-/, /^toc-/,
    /^code-/, /^lang-/, /^hljs-/, /^prism-/,
    /^float-/, /^animate-/, /^fade-/, /^slide-/, /^pulse-/, /^twinkle-/,
  ],
  deep: [/.*morph.*/, /.*active.*/, /.*hover.*/, /.*focus.*/],
  greedy: [/data-/, /aria-/, /role-/],
};

const cssPath = join(ROOT, 'css/style.css');
const outPath = join(ROOT, 'css/style.min.css');
const original = readFileSync(cssPath, 'utf8');

console.log('Running PurgeCSS...');
const purged = await new PurgeCSS().purge({
  content,
  css: [{ raw: original, name: 'style.css' }],
  safelist,
  // Match attribute selectors like [data-foo="bar"] and tag/class combos.
  defaultExtractor: (content) =>
    content.match(/[A-Za-z0-9_:/-]+/g) || [],
  variables: true,
  keyframes: true,
  fontFace: false,
});

const purgedCss = purged[0].css;
console.log(`  After purge: ${fmt(Buffer.byteLength(original))} -> ${fmt(Buffer.byteLength(purgedCss))}`);

console.log('Running cssnano...');
const final = await postcss([cssnano({ preset: ['default', { discardComments: { removeAll: true } }] })])
  .process(purgedCss, { from: undefined });
writeFileSync(outPath, final.css);
console.log(`  After cssnano: ${fmt(Buffer.byteLength(purgedCss))} -> ${fmt(Buffer.byteLength(final.css))}`);
console.log(`\nTotal: ${fmt(Buffer.byteLength(original))} -> ${fmt(Buffer.byteLength(final.css))} (${((1 - Buffer.byteLength(final.css) / Buffer.byteLength(original)) * 100).toFixed(1)}% saved)`);
