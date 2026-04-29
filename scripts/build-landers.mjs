#!/usr/bin/env node
/**
 * Builds each SEO lander HTML as a clone of index.html with:
 *   - lander-specific title/description/canonical/og/twitter/JSON-LD overrides
 *   - data-auto-window="<id>" on <body>
 *   - <section id="x-lander-seo" data-window="<id>">...original lander body...</section>
 *     injected before </body> so bots see SEO content + portfolio shell in one DOM.
 *
 * App.js (lander-mode init) then opens the matching window and prepends the
 * SEO section into that window's body. Same DOM for bot + human → no cloak.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const INDEX_HTML = path.join(ROOT, 'index.html');
// Originals (simple lander HTML with overrides + SEO body) are kept in _lander-sources/
// so each build pass parses them fresh. The script outputs full portfolio-shell variants
// to /<slug>.html in repo root.
const LANDER_SOURCE_DIR = path.join(ROOT, '_lander-sources');

// slug → window id (mirrors REF_TO_WINDOW in js/app.js).
const SLUG_TO_WINDOW = {
  'flutter-course-urdu': 'flutter-course',
  'hire-flutter-developer': 'contact',
  'flutter-consultant': 'contact',
  'flutter-framework-contributor': 'flutter',
  'flutter-framework-contributor-pakistan': 'flutter',
  'flutter-core-contributor-pakistan': 'flutter',
  'flutter-core-contributor-asia': 'flutter',
  'flutter-expert': 'flutter',
  'flutter-expert-pakistan': 'flutter',
  'flutter-community-leader': 'speaking',
  'flutter-community-leader-pakistan': 'speaking',
  'top-flutter-developers': 'about',
  'top-flutter-developers-in-pakistan': 'about',
  'top-flutter-developers-in-karachi': 'about',
  'top-flutter-developers-in-industry': 'about',
  'best-flutter-developer': 'about',
  'best-flutter-developer-pakistan': 'about',
  'senior-flutter-engineer-pakistan': 'about',
  'flutter-developer-pakistan': 'about'
};

// Pull a single tag's content out of source HTML (first match).
function pickAttr(src, tagRegex, attr) {
  const m = src.match(tagRegex);
  if (!m) return null;
  const re = new RegExp(`${attr}\\s*=\\s*"([^"]*)"`, 'i');
  const am = m[0].match(re);
  return am ? am[1] : null;
}

function pickInnerText(src, openTag, closeTag) {
  const i = src.indexOf(openTag);
  if (i < 0) return null;
  const start = src.indexOf('>', i) + 1;
  const j = src.indexOf(closeTag, start);
  return j < 0 ? null : src.slice(start, j).trim();
}

// Pick all <script type="application/ld+json">...</script> blocks.
function pickJsonLdBlocks(src) {
  const blocks = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(src)) !== null) {
    blocks.push(m[0]);
  }
  return blocks;
}

// Strip the lander's <head>...</head> + collect overrides + body content.
function parseLander(src) {
  const headStart = src.indexOf('<head');
  const headEnd = src.indexOf('</head>');
  const head = src.slice(headStart, headEnd);

  const bodyStart = src.indexOf('<body');
  const bodyOpenEnd = src.indexOf('>', bodyStart) + 1;
  const bodyEnd = src.indexOf('</body>');
  const body = src.slice(bodyOpenEnd, bodyEnd).trim();

  return {
    title: pickInnerText(head, '<title', '</title>'),
    description: pickAttr(head, /<meta\s+name=["']description["'][^>]*>/i, 'content'),
    keywords: pickAttr(head, /<meta\s+name=["']keywords["'][^>]*>/i, 'content'),
    canonical: pickAttr(head, /<link\s+rel=["']canonical["'][^>]*>/i, 'href'),
    ogTitle: pickAttr(head, /<meta\s+property=["']og:title["'][^>]*>/i, 'content'),
    ogDescription: pickAttr(head, /<meta\s+property=["']og:description["'][^>]*>/i, 'content'),
    ogUrl: pickAttr(head, /<meta\s+property=["']og:url["'][^>]*>/i, 'content'),
    ogImage: pickAttr(head, /<meta\s+property=["']og:image["'][^>]*>/i, 'content'),
    ogImageAlt: pickAttr(head, /<meta\s+property=["']og:image:alt["'][^>]*>/i, 'content'),
    twitterTitle: pickAttr(head, /<meta\s+name=["']twitter:title["'][^>]*>/i, 'content'),
    twitterDescription: pickAttr(head, /<meta\s+name=["']twitter:description["'][^>]*>/i, 'content'),
    twitterImage: pickAttr(head, /<meta\s+name=["']twitter:image["'][^>]*>/i, 'content'),
    hreflangs: [...head.matchAll(/<link\s+rel=["']alternate["'][^>]*hreflang=[^>]*>/gi)].map(m => m[0]),
    jsonLdBlocks: pickJsonLdBlocks(head),
    body: body
  };
}

// In the index.html template, replace a meta tag's content (first match by attribute selector).
function setMetaContent(html, selectorRegex, newContent) {
  return html.replace(selectorRegex, (full) => {
    return full.replace(/content\s*=\s*"[^"]*"/i, `content="${escapeAttr(newContent)}"`);
  });
}
function setLinkAttr(html, selectorRegex, attrName, newVal) {
  return html.replace(selectorRegex, (full) => {
    return full.replace(new RegExp(`${attrName}\\s*=\\s*"[^"]*"`, 'i'), `${attrName}="${escapeAttr(newVal)}"`);
  });
}
function setTitle(html, newTitle) {
  return html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeText(newTitle)}</title>`);
}
function escapeAttr(s) { return String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
function escapeText(s) { return String(s).replace(/</g, '&lt;'); }

function buildLander(slug, indexTemplate, lander) {
  const windowId = SLUG_TO_WINDOW[slug];
  if (!windowId) {
    throw new Error(`No window mapping for slug: ${slug}`);
  }
  const canonical = `https://ishaqhassan.dev/${slug}.html`;
  let html = indexTemplate;

  if (lander.title) html = setTitle(html, lander.title);
  if (lander.description) html = setMetaContent(html, /<meta\s+name=["']description["'][^>]*>/i, lander.description);
  if (lander.keywords) html = setMetaContent(html, /<meta\s+name=["']keywords["'][^>]*>/i, lander.keywords);
  html = setLinkAttr(html, /<link\s+rel=["']canonical["'][^>]*>/i, 'href', canonical);
  if (lander.ogTitle) html = setMetaContent(html, /<meta\s+property=["']og:title["'][^>]*>/i, lander.ogTitle);
  if (lander.ogDescription) html = setMetaContent(html, /<meta\s+property=["']og:description["'][^>]*>/i, lander.ogDescription);
  html = setMetaContent(html, /<meta\s+property=["']og:url["'][^>]*>/i, canonical);
  if (lander.ogImage) html = setMetaContent(html, /<meta\s+property=["']og:image["'][^>]*>/i, lander.ogImage);
  if (lander.ogImageAlt) html = setMetaContent(html, /<meta\s+property=["']og:image:alt["'][^>]*>/i, lander.ogImageAlt);
  if (lander.twitterTitle) html = setMetaContent(html, /<meta\s+name=["']twitter:title["'][^>]*>/i, lander.twitterTitle);
  if (lander.twitterDescription) html = setMetaContent(html, /<meta\s+name=["']twitter:description["'][^>]*>/i, lander.twitterDescription);
  if (lander.twitterImage) html = setMetaContent(html, /<meta\s+name=["']twitter:image["'][^>]*>/i, lander.twitterImage);

  // Inject lander-specific overrides in head: hreflangs, additional JSON-LD blocks, x-ihp-ref meta.
  const headInsertion = [
    `<meta name="x-ihp-ref" content="${escapeAttr(slug)}">`,
    ...lander.hreflangs,
    ...lander.jsonLdBlocks
  ].join('\n');
  html = html.replace('</head>', `${headInsertion}\n</head>`);

  // Mark <body> with data-auto-window attribute so app.js opens that window on init.
  html = html.replace(/<body([^>]*)>/i, (full, attrs) => {
    if (/data-auto-window=/i.test(attrs)) return full;
    return `<body${attrs} data-auto-window="${escapeAttr(windowId)}" data-lander-slug="${escapeAttr(slug)}">`;
  });

  // Inject lander SEO body content as <section id="x-lander-seo"> just before </body>.
  // This keeps content in DOM (bot indexes it) and app.js will move it into the matching
  // window's body so humans see it inside the auto-opened window.
  const seoSection = `<section id="x-lander-seo" data-target-window="${escapeAttr(windowId)}" data-slug="${escapeAttr(slug)}">${lander.body}</section>`;
  html = html.replace('</body>', `${seoSection}\n</body>`);

  return html;
}

// --- Main ---
const indexTemplate = fs.readFileSync(INDEX_HTML, 'utf8');
let built = 0;
let failed = [];

for (const slug of Object.keys(SLUG_TO_WINDOW)) {
  const sourcePath = path.join(LANDER_SOURCE_DIR, `${slug}.html`);
  const outPath = path.join(ROOT, `${slug}.html`);
  if (!fs.existsSync(sourcePath)) {
    console.warn(`[skip] _lander-sources/${slug}.html not found`);
    continue;
  }
  try {
    const src = fs.readFileSync(sourcePath, 'utf8');
    const lander = parseLander(src);
    const out = buildLander(slug, indexTemplate, lander);
    fs.writeFileSync(outPath, out, 'utf8');
    built++;
    console.log(`[ok]  ${slug}.html  → window:${SLUG_TO_WINDOW[slug]}  size:${(out.length/1024).toFixed(0)}KB`);
  } catch (e) {
    failed.push({ slug, err: e.message });
    console.error(`[err] ${slug}: ${e.message}`);
  }
}

console.log(`\nBuilt ${built}/${Object.keys(SLUG_TO_WINDOW).length} landers.`);
if (failed.length) {
  console.error('Failures:', failed);
  process.exit(1);
}
