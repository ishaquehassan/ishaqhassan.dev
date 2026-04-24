#!/usr/bin/env node
/**
 * Render per-page OG images (1200x630) for each deeplink window.
 *
 * Usage:
 *   npx puppeteer@latest  (auto-installed by npx on first run)
 *   node scripts/gen-og-images.mjs
 *
 * Output:
 *   assets/og/<slug>.png  (12 files)
 */

import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import puppeteer from 'puppeteer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const assetsDir = join(repoRoot, 'assets');
const outDir = join(assetsDir, 'og');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const variants = JSON.parse(readFileSync(join(__dirname, 'og-variants.json'), 'utf8'));
const templatePath = join(__dirname, 'og-template.html');
const templateUrl = 'file://' + templatePath;

const browser = await puppeteer.launch({
  headless: 'new',
  defaultViewport: { width: 1200, height: 630, deviceScaleFactor: 2 },
});

try {
  const page = await browser.newPage();

  const assetsBase = 'file://' + assetsDir + '/';

  for (const [slug, variant] of Object.entries(variants)) {
    console.log(`[og] rendering ${slug}...`);
    await page.goto(templateUrl, { waitUntil: 'networkidle0' });
    await page.evaluate(
      (v, ab) => window.__applyVariant(v, ab),
      variant,
      assetsBase,
    );
    // wait for fonts + images to settle
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await new Promise((r) => setTimeout(r, 400));

    const outPath = join(outDir, `${slug}.png`);
    await page.screenshot({
      path: outPath,
      clip: { x: 0, y: 0, width: 1200, height: 630 },
      type: 'png',
    });
    console.log(`    -> ${outPath}`);
  }
} finally {
  await browser.close();
}

console.log('\nDone. 12 OG images written to assets/og/');
