#!/usr/bin/env node
// Ultra-lightweight build: minify CSS/JS/HTML with no UI/feature changes.
// Safe to run repeatedly. Sources stay; only .min.* outputs change.

import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { minify as terserMinify } from 'terser';
import { minify as htmlMinify } from 'html-minifier-terser';
import postcss from 'postcss';
import cssnano from 'cssnano';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const fmt = (n) => (n / 1024).toFixed(1) + ' KB';
const log = (label, before, after) => {
  const pct = ((1 - after / before) * 100).toFixed(1);
  console.log(`  ${label.padEnd(40)} ${fmt(before).padStart(10)} -> ${fmt(after).padStart(10)}  (-${pct}%)`);
};

async function minifyCss(srcPath, outPath) {
  const src = readFileSync(srcPath, 'utf8');
  const result = await postcss([cssnano({ preset: ['default', { discardComments: { removeAll: true } }] })])
    .process(src, { from: srcPath, to: outPath });
  writeFileSync(outPath, result.css);
  log(`${srcPath.replace(ROOT + '/', '')}`, Buffer.byteLength(src), Buffer.byteLength(result.css));
}

async function minifyJs(srcPath, outPath) {
  const src = readFileSync(srcPath, 'utf8');
  const result = await terserMinify(src, {
    compress: { passes: 2, drop_console: false },
    mangle: true,
    format: { comments: false },
  });
  if (result.error) throw result.error;
  writeFileSync(outPath, result.code);
  log(`${srcPath.replace(ROOT + '/', '')}`, Buffer.byteLength(src), Buffer.byteLength(result.code));
}

async function minifyHtml(srcPath, outPath) {
  const src = readFileSync(srcPath, 'utf8');
  const out = await htmlMinify(src, {
    collapseWhitespace: true,
    conservativeCollapse: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: false,
    removeScriptTypeAttributes: false,
    removeStyleLinkTypeAttributes: true,
    keepClosingSlash: false,
    decodeEntities: false,
    sortAttributes: false,
    sortClassName: false,
    ignoreCustomFragments: [
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
    ],
  });
  writeFileSync(outPath, out);
  log(`${srcPath.replace(ROOT + '/', '')}`, Buffer.byteLength(src), Buffer.byteLength(out));
}

console.log('\n[ CSS ]');
await minifyCss(join(ROOT, 'css/style.css'), join(ROOT, 'css/style.min.css'));

console.log('\n[ JS ]');
const jsTargets = [
  ['js/app.js',              'js/app.min.js'],
  ['js/widgets.js',          'js/widgets.min.js'],
  ['js/desktop.js',          'js/desktop.min.js'],
  ['js/snake.js',            'js/snake.min.js'],
  ['js/max.js',              'js/max.min.js'],
  ['js/articles-data.js',    'js/articles-data.min.js'],
  ['js/articles-render.js',  'js/articles-render.min.js'],
  ['js/contact-morph.js',    'js/contact-morph.min.js'],
  ['js/max-morph.js',        'js/max-morph.min.js'],
  ['js/mobile-max-morph.js', 'js/mobile-max-morph.min.js'],
];
for (const [src, out] of jsTargets) {
  if (existsSync(join(ROOT, src))) await minifyJs(join(ROOT, src), join(ROOT, out));
}

console.log('\n[ HTML ]');
await minifyHtml(join(ROOT, 'index.html'), join(ROOT, 'index.html'));

console.log('\nDone.\n');
