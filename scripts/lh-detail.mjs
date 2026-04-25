#!/usr/bin/env node
// Drill into specific failing audits + show details.
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const url = process.argv[2] || 'https://ishaqhassan.dev/';

const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-sandbox'] });
try {
  const r = await lighthouse(url, {
    logLevel: 'error',
    output: 'json',
    onlyCategories: ['performance', 'seo', 'accessibility'],
    port: chrome.port,
    formFactor: 'mobile',
    screenEmulation: { mobile: true, width: 360, height: 640, deviceScaleFactor: 2.625, disabled: false },
    throttling: { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4 },
  });
  const lhr = r.lhr;

  const interesting = [
    'link-name','link-text','meta-description','meta-viewport','document-title',
    'render-blocking-resources','unused-javascript','unminified-javascript',
    'unminified-css','unused-css-rules','uses-long-cache-ttl','total-byte-weight',
    'largest-contentful-paint-element','main-thread-tasks','third-party-summary',
    'resource-summary','image-size-responsive','offscreen-images','image-alt',
    'tap-targets','color-contrast','crawlable-anchors','hreflang','canonical',
    'is-crawlable','robots-txt','structured-data','aria-allowed-attr','heading-order'
  ];

  console.log('\n=== DETAILED AUDIT FINDINGS ===\n');
  for (const k of interesting) {
    const a = lhr.audits[k];
    if (!a) continue;
    const score = a.score === null ? 'n/a' : a.score;
    if (score === 1 || score === 'n/a') continue;
    console.log(`[${score.toFixed?.(2) ?? score}] ${a.title}`);
    if (a.description) console.log(`        ${a.description.replace(/\[.*?\]\(.*?\)/g, '').replace(/\n/g, ' ').slice(0, 200)}`);
    if (a.details?.items?.length) {
      const items = a.details.items.slice(0, 5);
      for (const it of items) {
        const summary = JSON.stringify(it).slice(0, 200);
        console.log(`        - ${summary}`);
      }
      if (a.details.items.length > 5) console.log(`        ... +${a.details.items.length - 5} more`);
    }
    if (a.displayValue) console.log(`        Value: ${a.displayValue}`);
    console.log();
  }

  // LCP element
  const lcpAudit = lhr.audits['largest-contentful-paint-element'];
  if (lcpAudit?.details?.items?.[0]?.items?.[0]) {
    console.log('=== LCP ELEMENT ===');
    console.log(JSON.stringify(lcpAudit.details.items[0].items[0], null, 2).slice(0, 500));
  }

  // Resource summary
  const rs = lhr.audits['resource-summary'];
  if (rs?.details?.items) {
    console.log('\n=== RESOURCE SUMMARY ===');
    for (const r of rs.details.items) {
      console.log(`  ${(r.label||'?').padEnd(20)} count=${r.requestCount} size=${(r.transferSize/1024).toFixed(1)}KB`);
    }
  }
} finally {
  chrome.kill();
}
