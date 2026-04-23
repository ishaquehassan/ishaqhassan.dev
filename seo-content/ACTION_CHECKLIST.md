# SEO Blitz — Action Checklist (User-Side)

Done automatically (deploy chal raha hai):

✅ Pakistan SEO added: meta description, OG, Twitter, JSON-LD (address + nationality), seo-content block
✅ 6 new landing pages created:
  - /flutter-framework-contributor-pakistan.html
  - /flutter-developer-pakistan.html
  - /flutter-course-urdu.html
  - /flutter-core-contributor-asia.html
  - /flutter-consultant.html
  - /hire-flutter-developer.html
✅ Sitemap.xml updated with all 6 new URLs + llms files
✅ robots.txt updated — 25+ AI crawlers explicitly allowed (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, etc.)
✅ llms.txt + llms-full.txt updated — "Flutter Framework Contributor from Pakistan" prominently mentioned
✅ Deploy workflow updated to copy new HTML + llms files
✅ Main site seo-content block has internal links to all landing pages
✅ Noscript block has visible internal links
✅ 6 PR titles fixed to real GitHub titles
✅ Flutter stats updated (6 merged / 3 open / 9 total)

---

## MANUAL STEPS — tu khud karega (bilkul zaroori, jaldi kar)

### 1. Google Search Console (ASAP — 10 minutes)

- Go to https://search.google.com/search-console
- Add property `ishaqhassan.dev` if not already added
- Verify ownership (DNS TXT record via Cloudflare, or HTML tag)
- Once verified:
  - Submit sitemap: `https://ishaqhassan.dev/sitemap.xml`
  - URL Inspection → paste each new landing page URL → click "Request Indexing":
    - https://ishaqhassan.dev/
    - https://ishaqhassan.dev/flutter-framework-contributor-pakistan.html
    - https://ishaqhassan.dev/flutter-developer-pakistan.html
    - https://ishaqhassan.dev/flutter-course-urdu.html
    - https://ishaqhassan.dev/flutter-core-contributor-asia.html
    - https://ishaqhassan.dev/flutter-consultant.html
    - https://ishaqhassan.dev/hire-flutter-developer.html

### 2. Bing Webmaster Tools (5 min)

- https://www.bing.com/webmasters
- Add site → Submit sitemap → Request indexing for each URL
- Bing also powers Yahoo, DuckDuckGo (partial), ChatGPT Search (partial)

### 3. Medium Article (30 min)

Open `seo-content/MEDIUM_ARTICLE.md` — copy body. Publish on Medium:
- Title: "How a Pakistani Engineer Got 6 Pull Requests Merged Into Flutter's Official Framework"
- Tags: Flutter, Dart, Open Source, Pakistan, Mobile Development
- Publish under your existing profile (medium.com/@ishaqhassan)
- Add the portfolio link at the very top and bottom
- Save the URL — needed for step 4

### 4. Dev.to + Hashnode Cross-Posts (10 min)

Open `seo-content/DEVTO_HASHNODE_CROSSPOST.md` — paste article with canonical URL = Medium URL.
- https://dev.to/new
- https://hashnode.com/create/story

### 5. LinkedIn Post (3 min)

Open `seo-content/LINKEDIN_POST.md` — paste as regular LinkedIn text post. Tag GDG Kolachi if you can.

### 6. Twitter/X Thread (5 min)

Open `seo-content/DEVTO_HASHNODE_CROSSPOST.md` → bottom has the thread. Paste tweet by tweet.

### 7. Reddit (careful — don't spam)

Post on:
- r/FlutterDev (biggest Flutter community, strict rules — be genuine)
- r/developersPK
- r/pakistan (only if the tone fits)

Space 24+ hours between posts. Respond to every comment.

### 8. GitHub Profile README

Open your github.com/ishaquehassan profile README. Add:
```
🇵🇰 Flutter Framework Contributor from Pakistan | 6 merged PRs into Flutter
📺 Flutter course in Urdu on official Flutter docs
🎓 Engineering Manager at DigitalHire | GDG Kolachi Mentor
🌐 Portfolio: https://ishaqhassan.dev
```

Commit. GitHub profile README text is indexed by Google fast.

### 9. LinkedIn Profile Tweaks (10 min)

- Headline: add "Flutter Framework Contributor from Pakistan"
- About: first 2 sentences mention "Flutter Framework Contributor" + "6 merged PRs" + "Pakistan" + "Karachi"
- Featured section: pin your flutter-framework-contributor-pakistan.html page + Medium article + YouTube playlist
- Add "Pakistan" as location (LinkedIn ranking factor for Pakistan queries)

### 10. Cloudflare Cache Purge (30 sec)

After push goes live, log in to Cloudflare dashboard → ishaqhassan.dev → Caching → Purge Everything. Forces immediate edge refresh.

### 11. Schema.org validator check

Paste https://ishaqhassan.dev into:
- https://validator.schema.org/
- https://search.google.com/test/rich-results

Should show no errors on the Person/Article schemas.

### 12. PageSpeed / Core Web Vitals

- https://pagespeed.web.dev/?url=https%3A%2F%2Fishaqhassan.dev
- If green, nothing to do. If red, I can fix later.

---

## When to expect results

- **Google Search Console submission** → indexed within 1–7 days
- **Ranking for "flutter framework contributor pakistan"** → 2–8 weeks realistically (new pages need trust)
- **AI Overview inclusion (Google, ChatGPT Search, Perplexity)** → 2–12 weeks (depends on backlinks + authority)
- **Medium/Dev.to articles ranking** → 1–4 weeks (these platforms have high domain authority, often rank faster than own site)

---

## What I can't automate (but you CAN influence)

- **Backlinks from .pk domains** — reach out to TechJuice, ProPakistani, your university alumni network, GDG Kolachi page, Tech Idara site
- **LinkedIn post virality** — write from your own voice, engage with comments fast
- **Reddit karma** — participate genuinely in r/FlutterDev before you post about yourself
- **Ongoing blog posts** — 1 Medium article/month about your Flutter PRs keeps momentum

---

## Quick copy-paste social bios (update everywhere)

**Twitter/X bio:**
```
🇵🇰 Flutter Framework Contributor | 6 merged PRs into Flutter | Eng Manager @ DigitalHire | Flutter Urdu course on docs.flutter.dev | ishaqhassan.dev
```

**LinkedIn headline:**
```
Flutter Framework Contributor from Pakistan | 6 Merged PRs into Flutter | Engineering Manager @ DigitalHire | Open Source Author | Flutter Urdu Course Instructor (docs.flutter.dev)
```

**GitHub bio:**
```
🇵🇰 Flutter Framework Contributor · 6 merged PRs into Flutter · Eng Manager @ DigitalHire · ishaqhassan.dev
```

**Medium bio:**
```
Flutter Framework Contributor from Karachi, Pakistan. 6 merged PRs into Flutter. Engineering Manager at DigitalHire. Writing about Flutter internals, mobile architecture, and OSS.
```
