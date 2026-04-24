#!/usr/bin/env node
// Renders a single v2 variant to PNG for preview.
// Usage: node scripts/og-v2/render-preview.mjs flutter-contributions

import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import puppeteer from 'puppeteer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const slug = process.argv[2];
if (!slug) { console.error('Usage: node render-preview.mjs <slug>'); process.exit(1); }

const htmlPath = join(__dirname, `${slug}.html`);
const outPath = join(__dirname, `${slug}.png`);

const browser = await puppeteer.launch({
  headless: 'new',
  defaultViewport: { width: 1200, height: 630, deviceScaleFactor: 2 },
});
try {
  const page = await browser.newPage();
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: 1200, height: 630 }, type: 'png' });
  console.log(`Rendered: ${outPath}`);
} finally {
  await browser.close();
}
