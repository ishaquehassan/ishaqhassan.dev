#!/usr/bin/env node
// Builds + renders v2 OG variants.
// Each variant HTML file contains a {{DOCK}} placeholder that gets replaced
// with the shared _dock.html fragment. Output HTML is rendered via puppeteer
// to a 1200x630 PNG.
//
// Usage:
//   node scripts/og-v2/build-og.mjs           # build all variants found
//   node scripts/og-v2/build-og.mjs flutter-contributions speaking   # specific

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import puppeteer from 'puppeteer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dockFragment = readFileSync(join(__dirname, '_dock.html'), 'utf8');

const allVariants = readdirSync(__dirname)
  .filter(f => f.endsWith('.html') && !f.startsWith('_'))
  .map(f => f.replace('.html', ''));

const requested = process.argv.slice(2);
const variants = requested.length ? requested : allVariants;

const browser = await puppeteer.launch({
  headless: 'new',
  defaultViewport: { width: 1200, height: 630, deviceScaleFactor: 2 },
  args: ['--allow-file-access-from-files'],
});

try {
  const page = await browser.newPage();
  for (const slug of variants) {
    const src = join(__dirname, `${slug}.html`);
    if (!existsSync(src)) { console.warn(`skip (not found): ${slug}`); continue; }
    const raw = readFileSync(src, 'utf8');
    const built = raw.replace('{{DOCK}}', dockFragment);
    // Render via a temp file alongside the source so relative paths still work
    const tmpPath = join(__dirname, `.__build_${slug}.html`);
    writeFileSync(tmpPath, built);
    await page.goto('file://' + tmpPath, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await new Promise(r => setTimeout(r, 500));
    const outPng = join(__dirname, `${slug}.png`);
    await page.screenshot({ path: outPng, clip: { x: 0, y: 0, width: 1200, height: 630 }, type: 'png' });
    console.log(`[og-v2] ${slug} -> ${outPng}`);
  }
} finally {
  await browser.close();
}
