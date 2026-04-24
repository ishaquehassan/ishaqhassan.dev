#!/usr/bin/env python3
"""
gen-window-pages.py

Generates 12 SEO-friendly directory pages, one per desktop window.
Each page has:
  - Unique <title>, meta description, canonical
  - Path-specific og:title / og:description / og:url
  - Breadcrumb + WebPage + per-type JSON-LD
  - Bot-visible H1 + unique ~200+ word content block
  - Redirect-to-home script (humans get SPA, bots see content)

Run from repo root:
    python3 scripts/gen-window-pages.py

Outputs to <repo>/<slug>/index.html for each window.
"""

import os
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SITE = "https://ishaqhassan.dev"
OG_IMAGE = f"{SITE}/assets/og-image.png?v=6"

# Each window: slug (URL path segment), window id (JS lookup), title, desc,
# og_title, og_desc, h1, body_html (unique SEO content), json_ld_extra (path-specific),
# breadcrumb_name.
WINDOWS = [
    {
        "slug": "about",
        "id": "about",
        "title": "About Ishaq Hassan | Flutter Framework Contributor & Senior Engineer",
        "desc": "Flutter Framework Contributor with 6 merged PRs. Engineering Manager at DigitalHire, creator of the Urdu Flutter course listed on Flutter docs.",
        "og_title": "About Ishaq Hassan: Flutter Framework Contributor",
        "og_desc": "13+ years in software, 6 merged PRs into the Flutter framework, 50+ production apps shipped. Engineering Manager, speaker, educator.",
        "h1": "About Ishaq Hassan",
        "breadcrumb_name": "About",
        "json_ld_type": "ProfilePage",
        "body_html": """
<p><strong>Ishaq Hassan</strong> is a senior full-stack software engineer based in Pakistan with 13+ years of professional experience.
He is a <strong>Flutter Framework Contributor</strong> with six pull requests merged into the official Flutter repository and three more approved, making him one of a handful of South Asian engineers contributing at the framework level.</p>
<p>Professionally he is Engineering Manager at <a href="https://www.digitalhire.com" rel="noopener">DigitalHire</a>, where he leads mobile and platform engineering.
Prior roles span <strong>Confiz, Tech Idara, Afiniti,</strong> and independent consulting. Over the years he has shipped <strong>50+ production apps</strong> on iOS, Android and web.</p>
<p>Beyond code, Ishaq created a <strong>35-video Urdu-language Flutter course</strong> that is listed on the <a href="https://docs.flutter.dev/resources/courses#urdu" rel="noopener">official Flutter documentation</a>.
He has spoken at <strong>GDG Kolachi, Iqra University, DevnCode</strong> and multiple community events, and authored <strong>7 Medium articles</strong> covering Dart isolates, Flutter's three-tree architecture, Firebase Cloud Functions, and native plugin development.</p>
<p>Interactive bio, dock widgets, skill graphs and a macOS-style desktop experience are available on the <a href="/">live portfolio</a>.</p>
""",
    },
    {
        "slug": "flutter-contributions",
        "id": "flutter",
        "title": "Flutter Framework Contributions | 6 Merged PRs into Flutter: Ishaq Hassan",
        "desc": "6 pull requests merged into the official Flutter framework, 3 approved. Framework-level contributions from Pakistan with full PR list and context.",
        "og_title": "Flutter Framework Contributions: 6 Merged PRs",
        "og_desc": "Framework-level Flutter PRs authored by Ishaq Hassan. Six merged, three approved. Details and links on this page.",
        "h1": "Flutter Framework Contributions",
        "breadcrumb_name": "Flutter Contributions",
        "json_ld_type": "CollectionPage",
        "body_html": """
<p>Ishaq Hassan has <strong>6 pull requests merged</strong> into the official Flutter framework at <a href="https://github.com/flutter/flutter" rel="noopener">github.com/flutter/flutter</a>, with 3 more approved and awaiting merge.
All PRs passed the Flutter team's tree-hygiene, test coverage and review standards.</p>
<h2>Merged PRs</h2>
<ul>
  <li><a href="https://github.com/flutter/flutter/pull/183062" rel="noopener">#183062</a></li>
  <li><a href="https://github.com/flutter/flutter/pull/183079" rel="noopener">#183079</a></li>
  <li><a href="https://github.com/flutter/flutter/pull/183081" rel="noopener">#183081</a></li>
  <li><a href="https://github.com/flutter/flutter/pull/183097" rel="noopener">#183097</a></li>
  <li><a href="https://github.com/flutter/flutter/pull/183109" rel="noopener">#183109</a></li>
  <li><a href="https://github.com/flutter/flutter/pull/184572" rel="noopener">#184572</a>: LicenseRegistry NOTICES fix</li>
</ul>
<h2>Approved</h2>
<ul>
  <li><a href="https://github.com/flutter/flutter/pull/183110" rel="noopener">#183110</a></li>
  <li><a href="https://github.com/flutter/flutter/pull/184545" rel="noopener">#184545</a></li>
  <li><a href="https://github.com/flutter/flutter/pull/184569" rel="noopener">#184569</a></li>
</ul>
<p>Full list of authored PRs: <a href="https://github.com/flutter/flutter/pulls?q=author%3Aishaquehassan" rel="noopener">github.com/flutter/flutter/pulls?q=author:ishaquehassan</a>.
Long-form behind-the-scenes story: <a href="/blog/how-i-got-6-prs-merged-into-flutter.html">How I Got 6 PRs Merged Into Flutter</a>.</p>
""",
    },
    {
        "slug": "speaking",
        "id": "speaking",
        "title": "Speaking & Tech Talks | Ishaq Hassan: Flutter, Mobile Engineering",
        "desc": "Public speaking, bootcamps and community tech talks by Ishaq Hassan: GDG Kolachi, Iqra University, DevnCode, and more across Pakistan.",
        "og_title": "Speaking & Tech Talks: Ishaq Hassan",
        "og_desc": "Flutter bootcamps, GDG events, AI meetups and university seminars: a record of public speaking engagements.",
        "h1": "Speaking & Community",
        "breadcrumb_name": "Speaking",
        "json_ld_type": "CollectionPage",
        "body_html": """
<p>Ishaq Hassan regularly speaks at developer communities, universities and bootcamps around Pakistan, primarily on Flutter, mobile architecture, and career growth for engineers.</p>
<ul>
  <li><a href="https://gdg.community.dev/events/details/google-gdg-kolachi-presents-flutter-bootcamp/" rel="noopener">GDG Kolachi: Flutter Bootcamp</a></li>
  <li><a href="https://www.linkedin.com/posts/gdgkolachi_codetocreate-roadtodevfest2025-gdgkolachi-activity-7400908378081767424-EB-7" rel="noopener">GDG Kolachi: Code to Create (Road to DevFest 2025)</a></li>
  <li><a href="https://www.facebook.com/GDGKolachi/posts/720743396758626/" rel="noopener">GDG Kolachi Speaker Feature</a></li>
  <li><a href="https://www.linkedin.com/posts/itrathussainzaidi_flutter-iqrauniversity-seminar-activity-7192627199412232192-8t2X" rel="noopener">Iqra University: Flutter Seminar</a></li>
  <li><a href="https://medium.com/devncode/devncode-meetup-iv-artificial-intelligence-df8c602de7d5" rel="noopener">DevnCode Meetup IV: Artificial Intelligence</a></li>
</ul>
<p>Topics include Flutter framework internals, production-grade Dart patterns, Firebase scaling, and the path from app developer to open-source contributor. To invite Ishaq for a talk, bootcamp or mentoring session, use the <a href="/contact">contact</a> page.</p>
""",
    },
    {
        "slug": "open-source",
        "id": "oss",
        "title": "Open Source Projects | Ishaq Hassan: Flutter Packages & Tools",
        "desc": "Open source Flutter packages by Ishaq Hassan: document scanner, alarm background trigger, assets indexer, and more on pub.dev and GitHub.",
        "og_title": "Open Source Projects: Ishaq Hassan",
        "og_desc": "Flutter packages, Dart tools and open source projects authored and maintained on pub.dev and GitHub.",
        "h1": "Open Source Projects",
        "breadcrumb_name": "Open Source",
        "json_ld_type": "CollectionPage",
        "body_html": """
<p>Ishaq maintains several open-source Flutter packages published on <a href="https://pub.dev/publishers/ishaqhassan.dev/packages" rel="noopener">pub.dev under <code>ishaqhassan.dev</code></a>:</p>
<ul>
  <li><a href="https://github.com/ishaquehassan/document_scanner_flutter" rel="noopener"><strong>document_scanner_flutter</strong></a>: Native iOS/Android document scanning for Flutter.</li>
  <li><a href="https://github.com/ishaquehassan/flutter_alarm_background_trigger" rel="noopener"><strong>flutter_alarm_background_trigger</strong></a>: Background alarm scheduler for Flutter.</li>
  <li><a href="https://github.com/ishaquehassan/assets_indexer" rel="noopener"><strong>assets_indexer</strong></a>: Asset path generator inspired by Android's R.java.</li>
  <li><a href="https://github.com/ishaquehassan/nadra_verisys_flutter" rel="noopener"><strong>nadra_verisys_flutter</strong></a>: Pakistani NADRA Verisys SDK for Flutter.</li>
  <li><a href="https://github.com/ishaquehassan/claude-remote-terminal" rel="noopener"><strong>claude-remote-terminal</strong></a>: Remote-control CLI for Claude Code sessions.</li>
  <li><a href="https://github.com/ishaquehassan/goal-agent" rel="noopener"><strong>goal-agent</strong></a>: Career/goal tracker agent.</li>
</ul>
<p>In addition, 6 pull requests are merged into the <a href="/flutter-contributions">Flutter framework itself</a>.
All repositories are public at <a href="https://github.com/ishaquehassan" rel="noopener">github.com/ishaquehassan</a>.</p>
""",
    },
    {
        "slug": "tech-stack",
        "id": "tech",
        "title": "Tech Stack & Tools | Ishaq Hassan: Flutter, Dart, Firebase, Node",
        "desc": "The full stack Ishaq Hassan works with: Flutter, Dart, Firebase, Node.js, Next.js, React, Rust, Kotlin, Swift, GCP, AWS and more.",
        "og_title": "Tech Stack: Ishaq Hassan",
        "og_desc": "Flutter, Dart, Firebase, Node, Next.js, Rust, Kotlin and the broader stack behind 50+ production apps.",
        "h1": "Tech Stack",
        "breadcrumb_name": "Tech Stack",
        "json_ld_type": "CollectionPage",
        "body_html": """
<p>Technologies Ishaq Hassan uses in production, in order of depth:</p>
<h2>Mobile</h2>
<ul><li>Flutter & Dart (framework-level contributor)</li><li>Native Android (Kotlin, Java)</li><li>Native iOS (Swift, Objective-C)</li><li>Federated Flutter plugins (iOS/Android/Web)</li></ul>
<h2>Backend</h2>
<ul><li>Node.js (Express, Fastify, NestJS)</li><li>Firebase (Firestore, Cloud Functions, FCM, Auth)</li><li>GCP & AWS</li><li>PostgreSQL, MongoDB, Redis</li><li>Rust (selective performance-critical services)</li></ul>
<h2>Web</h2>
<ul><li>Next.js, React, TypeScript</li><li>Tailwind, shadcn/ui</li><li>Vanilla HTML/CSS/JS for performance-critical work</li></ul>
<h2>DevOps & AI</h2>
<ul><li>Docker, GitHub Actions, Nginx</li><li>Claude Code, Anthropic API, OpenAI API</li><li>Puppeteer, Playwright, headless automation</li></ul>
<p>Current focus: production-grade Flutter, AI-augmented engineering tools, and framework-level OSS contributions.</p>
""",
    },
    {
        "slug": "medium-articles",
        "id": "articles",
        "title": "Medium Articles by Ishaq Hassan | Flutter, Dart, Firebase Deep Dives",
        "desc": "Technical essays on Medium: Dart Isolates, Flutter three-tree architecture, Firebase Cloud Functions in Kotlin, native plugin development, and more.",
        "og_title": "Medium Articles: Ishaq Hassan",
        "og_desc": "Flutter and Dart deep dives: isolates, three-tree architecture, framework contribution guide, Firebase Cloud Functions in Kotlin.",
        "h1": "Medium Articles",
        "breadcrumb_name": "Medium Articles",
        "json_ld_type": "CollectionPage",
        "body_html": """
<p>Long-form technical writing by Ishaq Hassan on <a href="https://medium.com/@ishaqhassan" rel="noopener">medium.com/@ishaqhassan</a>:</p>
<ul>
  <li><a href="https://medium.com/@ishaqhassan/dart-isolates-the-missing-guide-for-production-flutter-apps-66ed990ced3e" rel="noopener">Dart Isolates: The Missing Guide for Production Flutter Apps</a></li>
  <li><a href="https://medium.com/@ishaqhassan/how-flutters-three-tree-architecture-actually-works-953c8cc17226" rel="noopener">How Flutter's Three-Tree Architecture Actually Works</a></li>
  <li><a href="https://medium.com/@ishaqhassan/how-i-got-my-pull-requests-merged-into-flutters-official-repository-98d055f3270e" rel="noopener">How I Got My Pull Requests Merged Into Flutter's Official Repository</a></li>
  <li><a href="https://medium.com/@ishaqhassan/firebase-cloud-functions-using-kotlin-55631dd43f67" rel="noopener">Firebase Cloud Functions Using Kotlin</a></li>
  <li><a href="https://medium.com/nerd-for-tech/a-journey-with-flutter-native-plugin-development-for-ios-android-3f0dd4ab8061" rel="noopener">A Journey with Flutter Native Plugin Development for iOS & Android</a></li>
  <li><a href="https://medium.com/nerd-for-tech/indexing-assets-in-a-dart-class-just-like-r-java-flutter-3febf558a2bb" rel="noopener">Indexing Assets in a Dart Class Just Like R.java</a></li>
  <li><a href="https://medium.com/devncode/devncode-meetup-iv-artificial-intelligence-df8c602de7d5" rel="noopener">DevnCode Meetup IV: Artificial Intelligence</a></li>
</ul>
<p>A canonical on-site copy of the Flutter-PR guide is available at <a href="/blog/how-i-got-6-prs-merged-into-flutter.html">the blog post</a>.</p>
""",
    },
    {
        "slug": "contact",
        "id": "contact",
        "title": "Contact Ishaq Hassan | Flutter Consultant, Speaker, Engineering Lead",
        "desc": "Get in touch with Ishaq Hassan: Flutter consulting, speaking engagements, collaboration, engineering leadership. Email, LinkedIn, GitHub.",
        "og_title": "Contact Ishaq Hassan",
        "og_desc": "Reach out for Flutter consulting, speaking engagements, or collaboration.",
        "h1": "Contact",
        "breadcrumb_name": "Contact",
        "json_ld_type": "ContactPage",
        "body_html": """
<p>Reach Ishaq Hassan via any of the following channels:</p>
<ul>
  <li>Email: <a href="mailto:hello@ishaqhassan.dev">hello@ishaqhassan.dev</a></li>
  <li>LinkedIn: <a href="https://linkedin.com/in/ishaquehassan" rel="noopener">linkedin.com/in/ishaquehassan</a></li>
  <li>GitHub: <a href="https://github.com/ishaquehassan" rel="noopener">github.com/ishaquehassan</a></li>
  <li>X / Twitter: <a href="https://x.com/ishaque_hassan" rel="noopener">@ishaque_hassan</a></li>
  <li>Stack Overflow: <a href="https://stackoverflow.com/users/2094696/ishaq-hassan" rel="noopener">Ishaq Hassan</a></li>
  <li>Medium: <a href="https://medium.com/@ishaqhassan" rel="noopener">@ishaqhassan</a></li>
  <li>YouTube: <a href="https://www.youtube.com/@ishaquehassan" rel="noopener">@ishaquehassan</a></li>
</ul>
<p>Typical turnaround on email is within 48 hours.
For Flutter consulting engagements, see the <a href="/flutter-consultant.html">consulting page</a>.
For hiring, see <a href="/hire-flutter-developer.html">hire</a>.</p>
""",
    },
    {
        "slug": "github",
        "id": "github",
        "title": "GitHub Profile | Ishaq Hassan: Open Source Repos & Flutter PRs",
        "desc": "GitHub profile overview for Ishaq Hassan: open-source Flutter packages, framework contributions, contribution graph.",
        "og_title": "GitHub: Ishaq Hassan",
        "og_desc": "Open source repos, pub.dev packages, Flutter framework PRs, contribution heatmap.",
        "h1": "GitHub Profile",
        "breadcrumb_name": "GitHub",
        "json_ld_type": "ProfilePage",
        "body_html": """
<p>Ishaq Hassan's GitHub: <a href="https://github.com/ishaquehassan" rel="noopener">github.com/ishaquehassan</a>.</p>
<p>Notable repositories include open-source Flutter packages (<a href="https://github.com/ishaquehassan/document_scanner_flutter" rel="noopener">document_scanner_flutter</a>,
<a href="https://github.com/ishaquehassan/flutter_alarm_background_trigger" rel="noopener">flutter_alarm_background_trigger</a>,
<a href="https://github.com/ishaquehassan/assets_indexer" rel="noopener">assets_indexer</a>,
<a href="https://github.com/ishaquehassan/nadra_verisys_flutter" rel="noopener">nadra_verisys_flutter</a>),
internal tooling (<a href="https://github.com/ishaquehassan/claude-remote-terminal" rel="noopener">claude-remote-terminal</a>,
<a href="https://github.com/ishaquehassan/goal-agent" rel="noopener">goal-agent</a>),
and upstream contributions to the <a href="https://github.com/flutter/flutter/pulls?q=author%3Aishaquehassan" rel="noopener">Flutter framework</a>.</p>
<p>See also the <a href="/open-source">open-source page</a> for deep dives on each package.</p>
""",
    },
    {
        "slug": "linkedin",
        "id": "linkedin",
        "title": "LinkedIn Profile | Ishaq Hassan: Engineering Manager, Flutter Contributor",
        "desc": "Ishaq Hassan's LinkedIn: 13+ years, Engineering Manager at DigitalHire, Flutter Framework Contributor, former roles at Confiz, Tech Idara, Afiniti.",
        "og_title": "LinkedIn: Ishaq Hassan",
        "og_desc": "Engineering Manager, Flutter Framework Contributor, 13+ years across mobile, web and backend.",
        "h1": "LinkedIn Profile",
        "breadcrumb_name": "LinkedIn",
        "json_ld_type": "ProfilePage",
        "body_html": """
<p>Ishaq Hassan on LinkedIn: <a href="https://linkedin.com/in/ishaquehassan" rel="noopener">linkedin.com/in/ishaquehassan</a>.</p>
<h2>Recent experience</h2>
<ul>
  <li><strong>Engineering Manager</strong>: DigitalHire (present)</li>
  <li><strong>Senior Software Engineer</strong>: Confiz</li>
  <li><strong>Head of Engineering</strong>: Tech Idara</li>
  <li><strong>Software Engineer</strong>: Afiniti</li>
  <li><strong>Independent Flutter Consultant</strong>: Various clients</li>
</ul>
<p>Flutter Framework Contributor with <a href="/flutter-contributions">6 merged PRs into the Flutter framework</a>. Speaker at <a href="/speaking">GDG Kolachi, Iqra University, DevnCode</a>.
Maintainer of open-source Flutter packages on <a href="https://pub.dev/publishers/ishaqhassan.dev/packages" rel="noopener">pub.dev</a>.</p>
""",
    },
    {
        "slug": "snake",
        "id": "snake",
        "title": "Snake Neon | Play the Arcade Game inside Ishaq Hassan's Portfolio",
        "desc": "Snake Neon arcade game, vanilla JS, embedded in Ishaq Hassan's macOS-style portfolio. Keyboard, D-pad, joystick and swipe controls.",
        "og_title": "Snake Neon: Play inside the Portfolio",
        "og_desc": "A vanilla-JS arcade game with neon visuals, multiple control schemes, and a pause/resume animation.",
        "h1": "Snake Neon Arcade Game",
        "breadcrumb_name": "Snake",
        "json_ld_type": "WebApplication",
        "body_html": """
<p><strong>Snake Neon</strong> is a browser-based arcade game embedded inside the macOS-style portfolio, written from scratch in vanilla JavaScript with a canvas renderer.</p>
<ul>
  <li>60fps rendering with requestAnimationFrame</li>
  <li>Neon visuals with glow shaders and a vignette pause overlay</li>
  <li>Desktop keyboard controls (arrow keys / WASD) plus ESC pause</li>
  <li>Mobile modes: Wheel / D-Pad / Swipe with 25px dead zone and 3-layer scroll lock</li>
  <li>Countdown, score, length and time HUD</li>
</ul>
<p>Launch Snake from the portfolio dock, from Spotlight (<kbd>Cmd+K</kbd>) or by visiting <a href="/snake">/snake</a> directly.</p>
<p><a href="/?w=snake">▶ Play now</a></p>
""",
    },
    {
        "slug": "flutter-course",
        "id": "flutter-course",
        "title": "Flutter Course (Urdu) | 35 Free Videos by Ishaq Hassan: Listed on Flutter Docs",
        "desc": "35-video free Flutter course in Urdu by Ishaq Hassan. Listed on the official Flutter docs. Foundations, Dart, OOP, UI, state, API, advanced.",
        "og_title": "Flutter Course (Urdu): 35 Free Videos",
        "og_desc": "Free Urdu Flutter course listed on official Flutter docs. 35 videos across foundations, Dart, OOP, UI, state and networking.",
        "h1": "Flutter Course (Urdu)",
        "breadcrumb_name": "Flutter Course",
        "json_ld_type": "Course",
        "body_html": """
<p>A 35-video Flutter course in Urdu, created by Ishaq Hassan, <strong>listed on the official Flutter documentation</strong> at
<a href="https://docs.flutter.dev/resources/courses#urdu" rel="noopener">docs.flutter.dev/resources/courses#urdu</a>.</p>
<p>Course sections:</p>
<ol>
  <li>Foundation: computers, dev environment, why Flutter</li>
  <li>Dart Basics: syntax, types, control flow</li>
  <li>Object-Oriented Programming in Dart</li>
  <li>Flutter UI: widgets, layout, styling</li>
  <li>State Management: setState, Provider patterns</li>
  <li>API & Network: HTTP, JSON, async</li>
  <li>Advanced: production patterns</li>
</ol>
<p>Watch on YouTube: <a href="https://www.youtube.com/playlist?list=PLX97VxArfzkmXeUqUxeKW7XS8oYraH7A5" rel="noopener">Flutter Course Playlist (35 videos)</a>.
Subscribe to the channel: <a href="https://www.youtube.com/@ishaquehassan?sub_confirmation=1" rel="noopener">youtube.com/@ishaquehassan</a>.</p>
<p><a href="/?w=flutter-course">Open the interactive course viewer on the portfolio</a></p>
""",
    },
    {
        "slug": "wisesend",
        "id": "wisesend",
        "title": "WiseSend | Side Project by Ishaq Hassan (XRLabs)",
        "desc": "WiseSend: a side project by Ishaq Hassan under the XRLabs umbrella. Embedded in the portfolio and live at wisesend.xrlabs.app.",
        "og_title": "WiseSend: Side Project",
        "og_desc": "A side project by Ishaq Hassan. Full product at wisesend.xrlabs.app.",
        "h1": "WiseSend",
        "breadcrumb_name": "WiseSend",
        "json_ld_type": "SoftwareApplication",
        "body_html": """
<p><strong>WiseSend</strong> is a side project built and maintained by Ishaq Hassan under the XRLabs umbrella.</p>
<p>Visit the live product: <a href="https://wisesend.xrlabs.app/" rel="noopener">wisesend.xrlabs.app</a>.</p>
<p>From the portfolio, WiseSend is available as an embedded window; visit <a href="/?w=wisesend">/?w=wisesend</a> on desktop to open it inline.</p>
""",
    },
]


def build_breadcrumb_jsonld(window):
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{SITE}/"},
            {"@type": "ListItem", "position": 2, "name": window["breadcrumb_name"], "item": f"{SITE}/{window['slug']}/"},
        ],
    }


def build_webpage_jsonld(window):
    return {
        "@context": "https://schema.org",
        "@type": window["json_ld_type"],
        "@id": f"{SITE}/{window['slug']}/",
        "url": f"{SITE}/{window['slug']}/",
        "name": window["title"],
        "description": window["desc"],
        "isPartOf": {"@type": "WebSite", "@id": f"{SITE}/#website", "url": f"{SITE}/"},
        "about": {
            "@type": "Person",
            "@id": f"{SITE}/#person",
            "name": "Ishaq Hassan",
            "url": f"{SITE}/",
        },
        "inLanguage": "en",
        "dateModified": "2026-04-25",
    }


FAQ_MAP = {
    "about": [
        ("Who is Ishaq Hassan?", "Ishaq Hassan is a senior full-stack software engineer based in Karachi, Pakistan with 13+ years of experience. He is a Flutter Framework Contributor with 6 merged PRs into the official Flutter repository, Engineering Manager at DigitalHire, and the creator of a 35-video Urdu Flutter course listed on the official Flutter documentation."),
        ("What is Ishaq's current role?", "Engineering Manager at DigitalHire, where he leads mobile and platform engineering."),
        ("How many years of experience does Ishaq have?", "Over 13 years of professional software engineering experience across mobile, backend, and web."),
    ],
    "flutter": [
        ("How many pull requests has Ishaq Hassan merged into Flutter?", "Six pull requests have been merged into the official Flutter framework at github.com/flutter/flutter, and three more are approved and awaiting merge."),
        ("What kinds of PRs are these?", "The merged PRs cover documentation corrections, API disposal guidance, CupertinoTextField improvements, Material widget fixes, DropdownMenu scroll padding, and LicenseRegistry NOTICES fixes. Each PR passed the Flutter team's tree-hygiene, test coverage and review standards."),
        ("Where can I verify these PRs?", "All PRs are public on GitHub. View the full authored list at github.com/flutter/flutter/pulls?q=author:ishaquehassan."),
    ],
    "speaking": [
        ("What topics does Ishaq speak on?", "Flutter framework internals, production-grade Dart patterns, Firebase scaling, and the path from app developer to open-source contributor."),
        ("Which events has Ishaq spoken at?", "GDG Kolachi Flutter Bootcamp, GDG Kolachi Code to Create (Road to DevFest 2025), Iqra University Flutter Seminar, and DevnCode Meetup IV among others."),
        ("How do I invite Ishaq for a talk?", "Reach out via the contact page at ishaqhassan.dev/contact or email hello@ishaqhassan.dev."),
    ],
    "oss": [
        ("Which open source Flutter packages has Ishaq authored?", "document_scanner_flutter (native scanning), flutter_alarm_background_trigger (background alarms), assets_indexer (R.java-style asset indexing), nadra_verisys_flutter (Pakistan NADRA SDK), and claude-remote-terminal."),
        ("Where are the packages published?", "All packages are on pub.dev under the ishaqhassan.dev publisher and on GitHub at github.com/ishaquehassan."),
        ("What license are the packages under?", "Most packages are MIT-licensed. Check the individual repo LICENSE files for specifics."),
    ],
    "tech": [
        ("What languages does Ishaq work with primarily?", "Dart and Flutter for mobile, Node.js and TypeScript for backend, Kotlin and Swift for native mobile, and React/Next.js for web."),
        ("What backend stack does Ishaq use?", "Node.js (Express, Fastify, NestJS), Firebase (Firestore, Cloud Functions, FCM, Auth), PostgreSQL, MongoDB, Redis, and selective Rust for performance-critical services."),
        ("What DevOps and AI tools?", "Docker, GitHub Actions, Nginx for infrastructure; Claude Code, Anthropic API, OpenAI API for AI-augmented engineering."),
    ],
    "articles": [
        ("What topics has Ishaq written about?", "Dart Isolates in production, Flutter's three-tree architecture, how to contribute to the Flutter framework, Firebase Cloud Functions in Kotlin, Flutter native plugin development for iOS and Android, and asset indexing patterns in Dart."),
        ("Where can I read these articles?", "All articles are published on Medium at medium.com/@ishaqhassan. The blog post on Flutter contributions is also cross-posted on ishaqhassan.dev/blog/."),
        ("How often does Ishaq publish?", "New long-form technical deep dives are published a few times per year, typically after completing notable engineering work."),
    ],
    "contact": [
        ("How do I contact Ishaq Hassan?", "Email hello@ishaqhassan.dev, or use LinkedIn at linkedin.com/in/ishaquehassan. Typical response time is within 48 hours."),
        ("Is Ishaq available for consulting?", "Yes. Visit ishaqhassan.dev/flutter-consultant.html for consulting engagements or ishaqhassan.dev/hire-flutter-developer.html for hiring inquiries."),
        ("Which platforms is Ishaq active on?", "GitHub, LinkedIn, X/Twitter, Medium, YouTube, and Stack Overflow. Links are on the contact page."),
    ],
    "github": [
        ("What is Ishaq Hassan's GitHub username?", "The GitHub handle is ishaquehassan. Full profile: github.com/ishaquehassan."),
        ("What are the most notable repositories?", "document_scanner_flutter, flutter_alarm_background_trigger, assets_indexer, claude-remote-terminal, and goal-agent. Plus upstream Flutter framework PRs."),
        ("Does Ishaq contribute to other OSS projects?", "Yes, including framework-level PRs merged into the Flutter repository itself."),
    ],
    "linkedin": [
        ("What is Ishaq Hassan's current role on LinkedIn?", "Engineering Manager at DigitalHire, leading AI-based video job board development and managing the mobile and platform teams."),
        ("Where can I find Ishaq's LinkedIn?", "linkedin.com/in/ishaquehassan."),
        ("What prior roles has Ishaq held?", "Senior Software Engineer at Confiz, Head of Engineering at Tech Idara, Software Engineer at Afiniti, and independent Flutter consulting."),
    ],
    "snake": [
        ("How do I play Snake Neon?", "Use the arrow keys or WASD on desktop. On mobile, pick one of three control schemes: Wheel (joystick), D-Pad (9-grid buttons), or full-screen Swipe gestures. Press ESC to pause."),
        ("Is the source code available?", "The game is part of the open-source portfolio at github.com/ishaquehassan/ishaqhassan.dev."),
        ("What technology powers Snake Neon?", "Pure vanilla JavaScript with a canvas-based renderer at 60fps using requestAnimationFrame. No framework or external dependency."),
    ],
    "flutter-course": [
        ("How many videos are in the Flutter course?", "35 videos across 7 sections: Foundation, Dart Basics, Object-Oriented Programming, Flutter UI, State Management, API and Networking, and Advanced."),
        ("What language is the course in?", "Urdu. The course is free and listed on the official Flutter documentation at docs.flutter.dev/resources/courses#urdu."),
        ("Where can I watch the course?", "On YouTube at the Flutter Course playlist, or inline via the interactive course viewer on the portfolio."),
    ],
    "wisesend": [
        ("What is WiseSend?", "A side project built and maintained by Ishaq Hassan under the XRLabs umbrella."),
        ("Where can I try WiseSend?", "The live product is at wisesend.xrlabs.app. It is also embedded as an inline window on the portfolio."),
        ("Is WiseSend open source?", "No, WiseSend is a product, not an open-source package."),
    ],
}


def build_faq_jsonld(window):
    qa = FAQ_MAP.get(window["id"], [])
    if not qa:
        return None
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": q,
                "acceptedAnswer": {"@type": "Answer", "text": a},
            }
            for q, a in qa
        ],
    }


def build_cross_links_html(current_slug):
    # Render a small sitemap-nav so search engines crawl every sibling path.
    items = [w for w in WINDOWS if w["slug"] != current_slug]
    links = "\n".join(
        f'    <li><a href="/{w["slug"]}/">{w["breadcrumb_name"]}</a></li>'
        for w in items
    )
    return (
        '<nav class="sitelinks" aria-label="Related sections">\n'
        '  <h2 class="sitelinks-h">Explore more</h2>\n'
        '  <ul class="sitelinks-grid">\n'
        f'{links}\n'
        '  </ul>\n'
        '</nav>'
    )


TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<style id="ihp-redirect-mask">html{{visibility:hidden}}</style>
<script>
/* No-flash window redirect: hide page instantly, bots get content, humans get SPA with target window on top. */
(function(){{
  try{{
    var ua=(navigator.userAgent||'').toLowerCase();
    var botRE=/bot|crawler|spider|slurp|lighthouse|googlebot|bingbot|yandex|baiduspider|duckduckbot|applebot|claudebot|anthropic-ai|gptbot|perplexitybot|facebookexternalhit|linkedinbot|twitterbot|telegrambot|whatsapp|slackbot|discordbot|embedly|preview/;
    var stay=location.search.indexOf('stay=1')!==-1;
    if(botRE.test(ua)||stay){{
      var s=document.getElementById('ihp-redirect-mask');
      if(s)s.parentNode.removeChild(s);
      return;
    }}
    location.replace('/?w={window_id}');
  }}catch(e){{
    var s=document.getElementById('ihp-redirect-mask');
    if(s)s.parentNode.removeChild(s);
  }}
}})();
</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
<meta name="googlebot" content="index, follow">
<meta name="author" content="Ishaq Hassan">
<meta name="theme-color" content="#0a0a1a">
<meta name="color-scheme" content="dark">
<link rel="canonical" href="{site}/{slug}/">
<link rel="icon" href="data:image/svg+xml,&lt;svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'&gt;&lt;text y='.9em' font-size='90'&gt;👨‍💻&lt;/text&gt;&lt;/svg&gt;">
<link rel="apple-touch-icon" href="/assets/profile-photo.png">
<link rel="manifest" href="/manifest.json">

<meta property="og:type" content="profile">
<meta property="og:title" content="{og_title}">
<meta property="og:description" content="{og_desc}">
<meta property="og:url" content="{site}/{slug}/">
<meta property="og:image" content="{og_image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Ishaq Hassan: Flutter Framework Contributor with 6 merged PRs">
<meta property="og:site_name" content="Ishaq Hassan">
<meta property="og:locale" content="en_PK">
<meta property="profile:first_name" content="Ishaq">
<meta property="profile:last_name" content="Hassan">
<meta property="profile:username" content="ishaquehassan">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@ishaque_hassan">
<meta name="twitter:creator" content="@ishaque_hassan">
<meta name="twitter:title" content="{og_title}">
<meta name="twitter:description" content="{og_desc}">
<meta name="twitter:image" content="{og_image}">
<meta name="twitter:image:alt" content="Ishaq Hassan: Flutter Framework Contributor with 6 merged PRs">

<script type="application/ld+json">{breadcrumb_jsonld}</script>
<script type="application/ld+json">{webpage_jsonld}</script>{faq_block}

<style>
  :root{{color-scheme:dark}}
  html,body{{margin:0;padding:0;background:#0b1120;color:#e5e7eb;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Roboto,sans-serif;line-height:1.6}}
  .wrap{{max-width:820px;margin:0 auto;padding:48px 24px 80px}}
  nav.crumbs{{font-size:13px;color:#7dd3fc;margin-bottom:24px}}
  nav.crumbs a{{color:#7dd3fc;text-decoration:none}}
  nav.crumbs a:hover{{text-decoration:underline}}
  h1{{font-size:36px;font-weight:800;margin:0 0 8px;color:#fff;letter-spacing:-0.02em}}
  h2{{font-size:22px;font-weight:700;color:#fff;margin-top:36px;margin-bottom:12px}}
  .sub{{color:#94a3b8;margin:0 0 28px;font-size:16px}}
  a{{color:#7dd3fc}}
  code{{background:#1e293b;padding:2px 6px;border-radius:4px;font-size:0.9em}}
  kbd{{background:#1e293b;padding:2px 8px;border-radius:4px;border:1px solid #334155;font-size:0.85em}}
  ul,ol{{padding-left:20px}}
  li{{margin:6px 0}}
  .cta{{display:inline-block;margin-top:28px;padding:12px 22px;background:#7dd3fc;color:#0b1120;border-radius:8px;font-weight:700;text-decoration:none}}
  .cta:hover{{background:#38bdf8}}
  .faq{{margin-top:44px;padding-top:28px;border-top:1px solid #1e293b}}
  .faq-h{{font-size:15px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#7dd3fc;margin:0 0 14px}}
  .faq-item{{background:rgba(125,211,252,0.03);border:1px solid rgba(125,211,252,0.08);border-radius:10px;padding:14px 18px;margin:0 0 10px;transition:border-color .15s,background .15s}}
  .faq-item:hover{{border-color:rgba(125,211,252,0.18);background:rgba(125,211,252,0.05)}}
  .faq-item summary{{cursor:pointer;font-weight:600;color:#e2e8f0;font-size:15px;list-style:none}}
  .faq-item summary::-webkit-details-marker{{display:none}}
  .faq-item summary::after{{content:"+";float:right;color:#7dd3fc;font-weight:700;transition:transform .2s}}
  .faq-item[open] summary::after{{content:"−"}}
  .faq-item p{{margin:12px 0 0;color:#94a3b8;font-size:14px;line-height:1.65}}
  .sitelinks{{margin-top:56px;padding-top:28px;border-top:1px solid #1e293b}}
  .sitelinks-h{{font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#7dd3fc;margin:0 0 14px}}
  .sitelinks-grid{{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px 18px}}
  .sitelinks-grid li{{margin:0}}
  .sitelinks-grid a{{display:block;padding:8px 10px;border-radius:6px;color:#cbd5e1;text-decoration:none;transition:background .15s,color .15s}}
  .sitelinks-grid a:hover{{background:rgba(125,211,252,0.08);color:#7dd3fc}}
  footer{{margin-top:40px;padding-top:24px;border-top:1px solid #1e293b;color:#64748b;font-size:13px}}
  footer a{{color:#94a3b8}}
</style>
</head>
<body>
<main class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; {breadcrumb_name}</nav>
  <h1>{h1}</h1>
  <p class="sub">{desc}</p>
  {body_html}
  {faq_html}
  <a class="cta" href="/?w={window_id}">Open the interactive portfolio →</a>
  {cross_links}
  <footer>
    Part of <a href="/">Ishaq Hassan's interactive portfolio</a>: a macOS-style desktop experience with 13 windows, widgets and a live Snake game.
    &middot; Canonical view: <a href="/{slug}/">{site}/{slug}/</a>
  </footer>
</main>
</body>
</html>
"""


def generate():
    for w in WINDOWS:
        out_dir = REPO_ROOT / w["slug"]
        out_dir.mkdir(parents=True, exist_ok=True)
        html = TEMPLATE.format(
            site=SITE,
            slug=w["slug"],
            window_id=w["id"],
            title=w["title"],
            desc=w["desc"],
            og_title=w["og_title"],
            og_desc=w["og_desc"],
            og_image=OG_IMAGE,
            h1=w["h1"],
            breadcrumb_name=w["breadcrumb_name"],
            body_html=w["body_html"].strip(),
            breadcrumb_jsonld=json.dumps(build_breadcrumb_jsonld(w), ensure_ascii=False),
            webpage_jsonld=json.dumps(build_webpage_jsonld(w), ensure_ascii=False),
            faq_block=(
                '\n<script type="application/ld+json">' + json.dumps(build_faq_jsonld(w), ensure_ascii=False) + '</script>'
                if build_faq_jsonld(w) else ''
            ),
            faq_html=(
                '<section class="faq" aria-labelledby="faq-h">\n  <h2 id="faq-h" class="faq-h">Frequently asked questions</h2>\n  '
                + ''.join(
                    f'<details class="faq-item"><summary><span>{q}</span></summary><p>{a}</p></details>\n  '
                    for q, a in FAQ_MAP.get(w["id"], [])
                ).rstrip()
                + '\n</section>'
                if FAQ_MAP.get(w["id"]) else ''
            ),
            cross_links=build_cross_links_html(w["slug"]),
        )
        out_path = out_dir / "index.html"
        out_path.write_text(html, encoding="utf-8")
        print(f"[gen] {out_path.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    generate()
    print(f"\nGenerated {len(WINDOWS)} pages.")
