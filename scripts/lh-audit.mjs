#!/usr/bin/env node
// Run Lighthouse mobile + desktop on a URL and print the key scores.
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const url = process.argv[2] || 'https://ishaqhassan.dev/';
const formFactor = process.argv[3] || 'mobile';

const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-sandbox'] });
try {
  const opts = {
    logLevel: 'error',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
    formFactor,
    screenEmulation: formFactor === 'mobile'
      ? { mobile: true, width: 360, height: 640, deviceScaleFactor: 2.625, disabled: false }
      : { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
    throttling: formFactor === 'mobile'
      ? { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4 }
      : { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 },
    emulatedUserAgent: formFactor === 'mobile'
      ? 'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36'
      : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  };
  const r = await lighthouse(url, opts);
  const lhr = r.lhr;
  console.log(`\n=== ${formFactor.toUpperCase()} · ${url} ===`);
  console.log('\nCATEGORIES:');
  for (const [k, v] of Object.entries(lhr.categories)) {
    const sc = v.score === null ? 'n/a' : Math.round(v.score * 100);
    console.log(`  ${v.title.padEnd(20)} ${sc}/100`);
  }
  console.log('\nLAB METRICS:');
  const ms = ['first-contentful-paint','largest-contentful-paint','total-blocking-time','cumulative-layout-shift','speed-index','interactive'];
  for (const k of ms) {
    const a = lhr.audits[k];
    if (a) console.log(`  ${a.title.padEnd(35)} ${a.displayValue || '-'}  (score: ${a.score?.toFixed(2) ?? 'n/a'})`);
  }
  console.log('\nTOP OPPORTUNITIES (score < 0.9):');
  const fails = Object.entries(lhr.audits)
    .filter(([k, a]) => a.score !== null && a.score !== undefined && a.score < 0.9)
    .sort((a, b) => (a[1].score || 0) - (b[1].score || 0));
  for (const [k, a] of fails.slice(0, 15)) {
    const savings = a.details?.overallSavingsMs ? ` save ${Math.round(a.details.overallSavingsMs)}ms` : '';
    console.log(`  [${a.score?.toFixed(2)}] ${a.title}${savings}`);
  }
} finally {
  chrome.kill();
}
