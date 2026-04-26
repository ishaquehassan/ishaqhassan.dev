/* =====================================================================
   MAX — AI Contact Bot (v8)
   - Wired to Cloudflare Worker proxy with Workers AI (Llama 3.3 70b).
   - Lead capture flow: bot asks "inform Ishaq now?" → user confirms →
     LLM emits JSON → frontend POSTs /notify → renders success + contact cards.
   ===================================================================== */
(function () {
  'use strict';

  const MAX_API = (window.MAX_API_URL || '').replace(/\/$/, '');
  const SS_KEY = 'max_session_v1';
  const MAX_HISTORY = 16;
  const MAX_CHARS = 800;

  const QUICK_REPLIES_INITIAL = [
    'I want to hire Ishaq',
    'Speaking inquiry',
    'Flutter help',
    'About Ishaq',
  ];

  /* ------------------- Card Data ------------------- */
  const PR_CARDS_MERGED = [
    { num: 184572, title: 'Fix LicenseRegistry docs to reference NOTICES' },
    { num: 184569, title: 'Add disposal guidance to CurvedAnimation and CurveTween docs' },
    { num: 184545, title: 'Add clipBehavior parameter to AnimatedCrossFade' },
    { num: 183109, title: 'Add scrollPadding property to DropdownMenu' },
    { num: 183097, title: 'Fix RouteAware.didPushNext documentation inaccuracy' },
    { num: 183081, title: 'Use double quotes in settings.gradle.kts template' },
  ];
  const PR_CARDS_OPEN = [
    { num: 183110, title: 'Suppress browser word-selection in SelectableText (web right-click)' },
    { num: 183079, title: 'Guard auto-scroll against Offset.infinite in ScrollableSelectionContainerDelegate' },
    { num: 183062, title: 'Reset AppBar _scrolledUnder flag when scroll context changes' },
  ];

  // Articles catalog (slug → metadata)
  const ARTICLE_CATALOG = {
    'flutter-prs': { tag: 'Flutter', title: 'How I Got 6 PRs Merged Into Flutter Framework', excerpt: '90-day path from triage to merge. Test-first bar, review etiquette.', mins: 10, href: '/blog/how-i-got-6-prs-merged-into-flutter.html' },
    'three-tree': { tag: 'Architecture', title: "Flutter's Three-Tree Architecture Explained", excerpt: 'Widget configures, Element mounts, RenderObject paints. Where bugs hide.', mins: 12, href: '/blog/flutter-three-tree-architecture-explained.html' },
    'state-mgmt': { tag: 'State', title: 'Flutter State Management 2026: A Decision Guide', excerpt: 'setState, Provider, Riverpod, Bloc, signals. When to use which.', mins: 14, href: '/blog/flutter-state-management-2026-guide.html' },
    'plugins-case': { tag: 'Plugins', title: 'Building Production Flutter Plugins (156 likes case study)', excerpt: 'Build, publish, maintain a plugin with 156 pub.dev likes.', mins: 11, href: '/blog/building-production-flutter-plugins-case-study.html' },
    'isolates': { tag: 'Dart', title: 'Dart Isolates: The Missing Guide', excerpt: 'Concurrency, ports, real-world patterns for production Flutter.', mins: 8, href: 'https://medium.com/@ishaqhassan/dart-isolates-the-missing-guide-for-production-flutter-apps-66ed990ced3e' },
    'native-plugins': { tag: 'Native', title: 'A Journey with Flutter Native Plugin Development', excerpt: 'MethodChannel, EventChannel, PlatformView. Cross-platform plugin dev.', mins: 7, href: 'https://medium.com/nerd-for-tech/a-journey-with-flutter-native-plugin-development-for-ios-android-3f0dd4ab8061' },
    'asset-indexer': { tag: 'Codegen', title: 'Indexing Assets in a Dart Class (R.java pattern)', excerpt: 'Auto-generate typed asset references with codegen.', mins: 6, href: 'https://medium.com/nerd-for-tech/indexing-assets-in-a-dart-class-just-like-r-java-flutter-3febf558a2bb' },
    'kotlin-functions': { tag: 'Firebase', title: 'Firebase Cloud Functions Using Kotlin', excerpt: 'Cloud Functions in Kotlin via GraalVM. Setup, performance, caveats.', mins: 5, href: 'https://medium.com/@ishaqhassan/firebase-cloud-functions-using-kotlin-55631dd43f67' },
    'devncode-ai': { tag: 'AI', title: 'DevnCode Meetup IV: Artificial Intelligence', excerpt: 'Recap of DevnCode AI meetup, talks, takeaways.', mins: 4, href: 'https://medium.com/devncode/devncode-meetup-iv-artificial-intelligence-df8c602de7d5' },
  };
  // Default top-4 ordering when [[CARDS:articles]] (no slugs given)
  const ARTICLE_CARDS = [
    ARTICLE_CATALOG['flutter-prs'],
    ARTICLE_CATALOG['three-tree'],
    ARTICLE_CATALOG['state-mgmt'],
    ARTICLE_CATALOG['plugins-case'],
  ];

  const SPEAKING_CARDS = [
    { date: 'Aug 2021', title: 'Flutter Bootcamp', org: 'GDG Kolachi', role: 'Lead Instructor', href: 'https://gdg.community.dev/events/details/google-gdg-kolachi-presents-flutter-bootcamp/' },
    { date: '2025', title: 'Code to Create / Road to DevFest', org: 'NIC Karachi', role: 'Speaker', href: 'https://www.linkedin.com/posts/gdgkolachi_codetocreate-roadtodevfest2025-gdgkolachi-activity-7400908378081767424-EB-7' },
    { date: 'May 2024', title: 'DevNCode Meetup IV: AI', org: 'The Nest I/O', role: 'Speaker', href: 'https://medium.com/devncode/devncode-meetup-iv-artificial-intelligence-df8c602de7d5' },
    { date: '2024', title: 'Flutter Seminar', org: 'Iqra University', role: 'Keynote', href: 'https://www.linkedin.com/posts/itrathussainzaidi_flutter-iqrauniversity-seminar-activity-7192627199412232192-8t2X' },
  ];

  const OSS_CATALOG = {
    'document_scanner_flutter': {
      name: 'document_scanner_flutter',
      desc: 'Flutter plugin: document scanning with edge detection, perspective correction, OCR-ready output',
      stars: '63★ · 135 forks', lang: 'Dart',
      href: 'https://github.com/ishaquehassan/document_scanner_flutter',
      topics: ['scan', 'document', 'ocr', 'camera', 'flutter plugin', 'pdf', 'paper scan', 'edge detection'],
    },
    'flutter_alarm_background_trigger': {
      name: 'flutter_alarm_background_trigger',
      desc: 'Native Kotlin alarm plugin for Flutter - background tasks, scheduled alarms, wake-up triggers on Android',
      stars: '13★', lang: 'Kotlin',
      href: 'https://github.com/ishaquehassan/flutter_alarm_background_trigger',
      topics: ['alarm', 'background', 'cron', 'scheduled task', 'wake up', 'android background', 'flutter background'],
    },
    'assets_indexer': {
      name: 'assets_indexer',
      desc: 'Auto-generate typed asset references for Flutter (R.java pattern). Codegen for compile-time safety',
      stars: '9★', lang: 'Dart',
      href: 'https://github.com/ishaquehassan/assets_indexer',
      topics: ['assets', 'codegen', 'typed', 'r.java', 'images', 'auto generate', 'asset class', 'safe assets'],
    },
    'nadra_verisys_flutter': {
      name: 'nadra_verisys_flutter',
      desc: 'NADRA CNIC KYC verification plugin for Flutter - Pakistan ID verification flow',
      stars: '3★', lang: 'Dart',
      href: 'https://github.com/ishaquehassan/nadra_verisys_flutter',
      topics: ['kyc', 'cnic', 'nadra', 'pakistan id', 'verification', 'identity', 'kyb'],
    },
    'goal-agent': {
      name: 'goal-agent',
      desc: 'AI-powered career goal tracking agent. Daily roadmap, content calendar, dashboard, contact mgmt - turns ambitious goals into daily actions',
      stars: 'OSS', lang: 'TypeScript',
      href: 'https://github.com/ishaquehassan/goal-agent',
      topics: ['goal', 'career', 'ai agent', 'roadmap', 'productivity', 'tracker', 'career planning', 'achievement', 'milestones', 'agent', 'tracking', 'progress', 'discipline', 'self improvement'],
    },
  };
  const OSS_CARDS = [
    OSS_CATALOG['document_scanner_flutter'],
    OSS_CATALOG['flutter_alarm_background_trigger'],
    OSS_CATALOG['assets_indexer'],
    OSS_CATALOG['goal-agent'],
  ];

  const TECH_GROUPS = [
    { label: 'Mobile', items: ['Flutter', 'Dart', 'Kotlin', 'Swift', 'React Native'] },
    { label: 'Backend', items: ['Node.js', 'NestJS', 'Next.js', 'Python', 'Spring Boot', 'Go'] },
    { label: 'Cloud / DevOps', items: ['Firebase', 'Cloudflare Workers', 'Docker', 'GitHub Actions', 'Linux'] },
    { label: 'Data', items: ['PostgreSQL', 'MySQL', 'SQLite'] },
  ];

  const COURSE_CARD = {
    title: 'Flutter — Basic to Advanced',
    sub: '35 free videos · Urdu · listed on docs.flutter.dev',
    href: 'https://www.youtube.com/playlist?list=PLX97VxArfzkmXeUqUxeKW7XS8oYraH7A5',
    bullets: ['Dart fundamentals', 'OOP', 'Flutter UI + Layout', 'State management', 'API & Networking', 'CI/CD + Deployment'],
  };

  // Course video catalog (mirrors fcVideos in js/app.js)
  const FC_VIDEOS = [
    {id:'DB51xmXlaX4',t:'Basics Of Computers & Why Flutter',s:'Foundation'},
    {id:'i6NyxOIDPAg',t:'Variables & Types',s:'Dart Basics'},
    {id:'EwfsrybbU20',t:'Lists / Maps / Control Flow',s:'Dart Basics'},
    {id:'GJpmATFL3JQ',t:'Loops / Scope / break',s:'Dart Basics'},
    {id:'PMZIF36_LOk',t:'Loops / continue / labels / Functions',s:'Dart Basics'},
    {id:'xKtramkjQJE',t:'Functions / Arguments / By Ref / By Value',s:'Dart Basics'},
    {id:'LLes21jFpIY',t:'Higher Order Functions / const & final / typedef',s:'Dart Basics'},
    {id:'wgHSJtaxdmE',t:'Arrow Functions / Class / Constructors',s:'OOP'},
    {id:'MEKPMFf14kw',t:'Factory Constructor / Static / Get / Set',s:'OOP'},
    {id:'-IKODeF5zgE',t:'Inheritance / super / overriding / Polymorphism',s:'OOP'},
    {id:'cX8v6jX66ZA',t:'Encapsulation / Abstraction',s:'OOP'},
    {id:'mIfYL2uQo64',t:'Mixins / Enums / Exception Handling',s:'OOP'},
    {id:'sO9Kj2u_3A8',t:'Git Basics',s:'Foundation'},
    {id:'zh4ilo3x2lo',t:'Flutter Intro',s:'Flutter UI'},
    {id:'y86zTGZzg4E',t:'Widgets & How to Compose Them',s:'Flutter UI'},
    {id:'e1jlRM5eALc',t:'Flex Layout Composition',s:'Flutter UI'},
    {id:'Kd6xEbzB9Ls',t:'Stateful Widgets in Depth',s:'Flutter UI'},
    {id:'LUb32ZGcDC0',t:'Assignment for Stateful Widget',s:'Flutter UI'},
    {id:'t6Oar6baJ84',t:'Complex Data / Null Safety / Child Contexts',s:'Flutter UI'},
    {id:'zOO5aiO0MVc',t:'Navigator & Future',s:'State Management'},
    {id:'NzOleMz_39c',t:'HTTP / DNS / Server & Client / API / JSON',s:'API & Network'},
    {id:'_8Sp-b3jC3k',t:'REST API / HTTP Methods / JSON Parsing',s:'API & Network'},
    {id:'OpDiadtIWGY',t:'Assets / Theme / Dialog & Modal Sheet',s:'Flutter UI'},
    {id:'8DceQCquWC0',t:'Complex JSON / Parsing to Models',s:'API & Network'},
    {id:'zURZS5-sL90',t:'Deep JSON Parsing / Debugging',s:'API & Network'},
    {id:'nQLiQ3AvoT8',t:'Future Builder / Form / Context Flow',s:'State Management'},
    {id:'WtSBV06lWj4',t:'State Management / Inherited Widget',s:'State Management'},
    {id:'YPTU4ebYkLw',t:'Authenticated API / Postman / Dart Server',s:'API & Network'},
    {id:'KwOhPYsSS-o',t:'Access Token / Shared Preferences',s:'Advanced'},
    {id:'-Bikp0jtas4',t:'Generics / Generic Model / Provider',s:'State Management'},
    {id:'YBp7i8VGiaQ',t:'Stacked / Stacked Services / Generator',s:'Advanced'},
    {id:'8FwRyiARuhI',t:'Unit Test / CI-CD / Github Actions',s:'Advanced'},
    {id:'vJnH0HE-YZw',t:'UX UI / Figma / Product Lifecycle',s:'Advanced'},
    {id:'414Ulz9HjMs',t:'Local Database / SQLite / ORM / Floor',s:'Advanced'},
    {id:'b_MPN5n8g6o',t:'Deploying Flutter Web / Github Actions',s:'Advanced'},
  ];
  const FC_VIDEO_INDEX = (() => {
    const m = {};
    FC_VIDEOS.forEach((v, i) => { m[v.id] = i; });
    return m;
  })();

  const CONTACT_CARDS = [
    { label: 'Email', value: 'hello@ishaqhassan.dev', href: 'mailto:hello@ishaqhassan.dev', grad: 'linear-gradient(135deg,#22c55e,#16a34a)', svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="#fff" stroke-width="1.5"/><path d="M22 6l-10 7L2 6" stroke="#fff" stroke-width="1.5"/></svg>' },
    { label: 'GitHub', value: '@ishaquehassan', href: 'https://github.com/ishaquehassan', grad: 'linear-gradient(135deg,#24292e,#40464d)', svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>' },
    { label: 'LinkedIn', value: '@ishaquehassan', href: 'https://linkedin.com/in/ishaquehassan', grad: 'linear-gradient(135deg,#0077B5,#00a0dc)', svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>' },
    { label: 'Medium', value: '@ishaqhassan', href: 'https://medium.com/@ishaqhassan', grad: 'linear-gradient(135deg,#1a8917,#0d7a0d)', svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/></svg>' },
    { label: 'YouTube', value: '@ishaquehassan', href: 'https://www.youtube.com/@ishaquehassan', grad: 'linear-gradient(135deg,#ff0033,#cc0000)', svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 00.5 6.2C0 8 0 12 0 12s0 4 .5 5.8a3 3 0 002.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 002.1-2.1C24 16 24 12 24 12s0-4-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg>' },
    { label: 'X (Twitter)', value: '@ishaque_hassan', href: 'https://x.com/ishaque_hassan', grad: 'linear-gradient(135deg,#000,#1a1a1a)', svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>' },
    { label: 'TikTok', value: '@ishaqhassan.dev', href: 'https://www.tiktok.com/@ishaqhassan.dev', grad: 'linear-gradient(135deg,#010101,#1a1a1a)', svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005.17 20.1a6.34 6.34 0 0010.86-4.43V8.66a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.21-.09z" fill="#25F4EE"/><path d="M20.8 6.78a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 006.38 20.1a6.34 6.34 0 0010.86-4.43V8.66a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.21-.09z" fill="#fff" fill-opacity=".85"/><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25h-1.04v13.23a2.89 2.89 0 01-2.89 2.89 2.84 2.84 0 01-1.34-.34 2.89 2.89 0 002.45 1.34 2.89 2.89 0 002.89-2.89V7.4a8.16 8.16 0 004.77 1.52V5.52a4.83 4.83 0 01-1.07-.16zM9.21 12.74a2.89 2.89 0 00-1.83 5.16 2.84 2.84 0 011.83-3.86z" fill="#FE2C55"/></svg>' },
  ];

  /* ------------------- Persistence ------------------- */
  function loadSession() {
    try { const raw = sessionStorage.getItem(SS_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function saveSession(s) { try { sessionStorage.setItem(SS_KEY, JSON.stringify(s)); } catch (e) {} }

  const state = loadSession() || { messages: [], lead: null, leadSent: false };
  if (typeof state.leadSent !== 'boolean') state.leadSent = false;

  /* ------------------- Helpers ------------------- */
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // Highlight common code tokens (Dart/JS/Python/Go/Rust flavored)
  function highlightCode(escaped) {
    let out = escaped;
    const KW = /\b(abstract|as|assert|async|await|break|case|catch|class|const|continue|default|deferred|do|dynamic|else|enum|export|extends|extension|external|factory|false|final|finally|for|function|get|hide|if|implements|import|in|interface|is|late|let|library|mixin|new|null|of|on|operator|part|rethrow|return|set|show|static|super|switch|sync|this|throw|true|try|typedef|var|void|while|with|yield|def|elif|None|True|False|and|or|not|pass|lambda|self|print|fn|use|pub|impl|trait|struct|mut|ref|package|func|chan|select|interface|type)\b/g;
    out = out.replace(/(\/\/[^\n]*|#[^\n]*)/g, '<span class="cc">$1</span>');
    out = out.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="cc">$1</span>');
    out = out.replace(/(&quot;[^&\n]*?&quot;|&#39;[^&\n]*?&#39;|`[^`\n]*?`)/g, '<span class="cs">$1</span>');
    out = out.replace(KW, '<span class="ck">$1</span>');
    out = out.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="cn">$1</span>');
    return out;
  }

  function buildCodeCard(lang, code) {
    const langLabel = String(lang || 'code').toLowerCase();
    const escaped = escapeHtml(String(code).replace(/\n+$/, ''));
    const highlighted = highlightCode(escaped);
    return (
      '<div class="max-code" data-lang="' + escapeHtml(langLabel) + '">' +
        '<div class="max-code-head">' +
          '<span class="max-code-lang">' + escapeHtml(langLabel) + '</span>' +
          '<button class="max-code-copy" type="button" onclick="window.maxCopyCode(this,event)">Copy</button>' +
        '</div>' +
        '<pre class="max-code-body"><code>' + highlighted + '</code></pre>' +
      '</div>'
    );
  }

  function renderText(s) {
    let raw = String(s);
    const blocks = [];
    raw = raw.replace(/```([a-zA-Z0-9_+-]*)[ \t]*\r?\n?([\s\S]*?)```/g, (_m, lang, code) => {
      const i = blocks.length;
      blocks.push(buildCodeCard(lang, code));
      return 'CB' + i + '';
    });
    let out = escapeHtml(raw);
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    out = out.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    out = out.replace(/\n/g, '<br>');
    out = out.replace(/CB(\d+)/g, (_m, i) => blocks[Number(i)] || '');
    return out;
  }

  window.maxCopyCode = function (btn, ev) {
    if (ev) { ev.preventDefault(); ev.stopPropagation(); }
    try {
      const code = btn.parentNode.parentNode.querySelector('code');
      const text = code ? code.innerText : '';
      const done = () => {
        const orig = btn.textContent;
        btn.textContent = '✓ Copied';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => done());
      } else {
        const ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
        done();
      }
    } catch (e) {}
  };

  /* ------------------- View bindings ------------------- */
  function bindInstance(suffix) {
    const id = (s) => 'max-' + s + (suffix ? '-' + suffix : '');
    const tabsEl = document.getElementById(suffix ? 'max-tabs-mob' : 'max-tabs');
    const messagesEl = document.getElementById(id('messages'));
    const chipsEl = document.getElementById(id('chips'));
    const inputEl = document.getElementById(id('input'));
    const formEl = document.getElementById(id('inputbar'));
    const sendBtn = document.getElementById(id('send'));
    if (!messagesEl || !inputEl || !formEl) return null;
    return { tabsEl, messagesEl, chipsEl, inputEl, formEl, sendBtn, suffix };
  }

  function setTab(inst, tab) {
    if (!inst || !inst.tabsEl) return;
    const attr = inst.suffix ? 'data-max-tab-mob' : 'data-max-tab';
    inst.tabsEl.querySelectorAll('.max-tab').forEach((b) => {
      b.classList.toggle('max-tab-active', b.getAttribute(attr) === tab);
    });
    const root = inst.tabsEl.parentElement;
    if (!root) return;
    const panelAttr = inst.suffix ? 'data-max-panel-mob' : 'data-max-panel';
    root.querySelectorAll('[' + panelAttr + ']').forEach((p) => {
      p.classList.toggle('max-panel-active', p.getAttribute(panelAttr) === tab);
    });
    if (tab === 'chat') setTimeout(() => focusInput(inst), 50);
  }

  function focusInput(inst) {
    if (!inst || !inst.inputEl) return;
    if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) return;
    try { inst.inputEl.focus(); } catch (e) {}
  }

  /* ------------------- Rendering ------------------- */
  function renderAll(inst) {
    if (!inst) return;
    inst.messagesEl.innerHTML = '';
    state.messages.forEach((m) => appendMessage(inst, m, false));
    if (state.lead && state.leadSent) {
      renderInformedCard(inst);
    } else if (state.lead && !state.leadSent) {
      renderLeadFallbackCard(inst, state.lead);
    }
    renderChips(inst);
    scrollToBottom(inst, false);
  }

  function appendMessage(inst, msg, animate) {
    if (!inst) return null;
    const isUser = msg.role === 'user';
    if (isUser) {
      const wrap = el('div', 'max-msg max-msg-user');
      if (!animate) wrap.style.animation = 'none';
      const bubble = el('div', 'max-bubble');
      bubble.innerHTML = renderText(msg.content);
      wrap.appendChild(bubble);
      inst.messagesEl.appendChild(wrap);
      return { wrap, bubble };
    }
    // Bot: parse card tags and render mixed text + card blocks
    const parts = splitCardTags(msg.content || '');
    let firstWrap = null, lastBubble = null;
    if (parts.length === 0) parts.push({ kind: 'text', value: '…' });
    parts.forEach((p) => {
      if (p.kind === 'text' && p.value) {
        const wrap = el('div', 'max-msg max-msg-bot');
        if (!animate) wrap.style.animation = 'none';
        const av = el('div', 'max-msg-avatar', '⚡');
        wrap.appendChild(av);
        const bubble = el('div', 'max-bubble');
        bubble.innerHTML = renderText(p.value);
        wrap.appendChild(bubble);
        inst.messagesEl.appendChild(wrap);
        firstWrap = firstWrap || wrap;
        lastBubble = bubble;
      } else if (p.kind === 'cards') {
        const fn = CARD_BUILDERS[p.type];
        if (!fn) return;
        const html = fn(p.param);
        if (!html) return;
        const block = el('div', 'max-msg max-msg-bot max-msg-cards');
        if (!animate) block.style.animation = 'none';
        block.innerHTML = html;
        inst.messagesEl.appendChild(block);
        firstWrap = firstWrap || block;
      }
    });
    return { wrap: firstWrap, bubble: lastBubble };
  }

  function appendTyping(inst) {
    if (!inst) return null;
    const wrap = el('div', 'max-msg max-msg-bot max-msg-typing');
    const av = el('div', 'max-msg-avatar', '⚡');
    const bubble = el('div', 'max-bubble');
    const typing = el('div', 'max-typing', '<span></span><span></span><span></span>');
    bubble.appendChild(typing);
    wrap.appendChild(av);
    wrap.appendChild(bubble);
    inst.messagesEl.appendChild(wrap);
    scrollToBottom(inst, true);
    return wrap;
  }

  function renderChips(inst) {
    if (!inst || !inst.chipsEl) return;
    inst.chipsEl.innerHTML = '';
    const hasUserMsg = state.messages.some((m) => m.role === 'user');
    if (hasUserMsg) return;
    QUICK_REPLIES_INITIAL.forEach((q) => {
      const b = el('button', 'max-chip', q);
      b.type = 'button';
      b.addEventListener('click', () => sendMessage(q));
      inst.chipsEl.appendChild(b);
    });
  }

  function buildContactCardsHTML() {
    const cards = CONTACT_CARDS.map((c) => (
      '<a class="max-cc" href="' + escapeHtml(c.href) + '"' + (c.href.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
        '<div class="max-cc-icon" style="background:' + c.grad + ';">' + c.svg + '</div>' +
        '<div class="max-cc-text"><div class="max-cc-label">' + escapeHtml(c.label) + '</div><div class="max-cc-value">' + escapeHtml(c.value) + '</div></div>' +
      '</a>'
    )).join('');
    return '<div class="max-cc-grid">' + cards + '</div>';
  }

  /* ------------------- Card builders ------------------- */
  function buildPRCard(pr, status) {
    const cls = status === 'merged' ? 'max-pr-merged' : 'max-pr-open';
    const label = status === 'merged' ? '✓ Merged' : '⟳ Open';
    return (
      '<a class="max-pr-card" href="https://github.com/flutter/flutter/pull/' + pr.num + '" target="_blank" rel="noopener noreferrer">' +
        '<div class="max-pr-status ' + cls + '">' + label + '</div>' +
        '<div class="max-pr-title">' + escapeHtml(pr.title) + '</div>' +
        '<div class="max-pr-repo">flutter/flutter #' + pr.num + '</div>' +
      '</a>'
    );
  }

  function buildPRsCardsHTML() {
    const merged = PR_CARDS_MERGED.map((p) => buildPRCard(p, 'merged')).join('');
    const open = PR_CARDS_OPEN.map((p) => buildPRCard(p, 'open')).join('');
    return (
      '<div class="max-cards-block">' +
        '<div class="max-cards-section">6 Merged into Flutter framework</div>' +
        '<div class="max-pr-grid">' + merged + '</div>' +
        '<div class="max-cards-section" style="margin-top:14px;">3 Open / In-review</div>' +
        '<div class="max-pr-grid">' + open + '</div>' +
        '<a class="max-cards-cta" href="/flutter-contributions" onclick="return window.maxOpenSection(\'prs\',event)">View all PRs →</a>' +
      '</div>'
    );
  }

  function buildArticleCard(a) {
    return (
      '<a class="max-art-card" href="' + escapeHtml(a.href) + '" target="_blank" rel="noopener noreferrer">' +
        '<div class="max-art-tag">' + escapeHtml(a.tag) + '</div>' +
        '<div class="max-art-title">' + escapeHtml(a.title) + '</div>' +
        '<div class="max-art-excerpt">' + escapeHtml(a.excerpt) + '</div>' +
        '<div class="max-art-meta">' + a.mins + ' min read</div>' +
      '</a>'
    );
  }

  function buildArticlesCardsHTML(param) {
    let list;
    if (param) {
      const slugs = String(param).split(',').map((s) => s.trim()).filter(Boolean);
      list = slugs.map((s) => ARTICLE_CATALOG[s]).filter(Boolean);
    }
    if (!list || list.length === 0) list = ARTICLE_CARDS;
    const cards = list.map(buildArticleCard).join('');
    return (
      '<div class="max-cards-block">' +
        '<div class="max-art-grid">' + cards + '</div>' +
        '<a class="max-cards-cta" href="/articles/" onclick="return window.maxOpenSection(\'articles\',event)">View all articles →</a>' +
      '</div>'
    );
  }

  function buildSpeakingCardsHTML() {
    const cards = SPEAKING_CARDS.map((s) => (
      '<a class="max-spk-card" href="' + escapeHtml(s.href) + '" target="_blank" rel="noopener noreferrer">' +
        '<div class="max-spk-date">' + escapeHtml(s.date) + '</div>' +
        '<div class="max-spk-title">' + escapeHtml(s.title) + '</div>' +
        '<div class="max-spk-org">' + escapeHtml(s.org) + ' · <span style="opacity:.7;">' + escapeHtml(s.role) + '</span></div>' +
      '</a>'
    )).join('');
    return (
      '<div class="max-cards-block">' +
        '<div class="max-spk-grid">' + cards + '</div>' +
        '<a class="max-cards-cta" href="/speaking" onclick="return window.maxOpenSection(\'speaking\',event)">View all speaking events →</a>' +
      '</div>'
    );
  }

  function buildOSSCardsHTML(param) {
    let list;
    if (param) {
      const slugs = String(param).split(',').map((s) => s.trim()).filter(Boolean);
      list = slugs.map((s) => OSS_CATALOG[s]).filter(Boolean);
    }
    if (!list || list.length === 0) list = OSS_CARDS;
    const cards = list.map((o) => (
      '<a class="max-oss-card" href="' + escapeHtml(o.href) + '" target="_blank" rel="noopener noreferrer">' +
        '<div class="max-oss-head">' +
          '<div class="max-oss-name">' + escapeHtml(o.name) + '</div>' +
          '<div class="max-oss-stars">' + escapeHtml(o.stars) + '</div>' +
        '</div>' +
        '<div class="max-oss-desc">' + escapeHtml(o.desc) + '</div>' +
        '<div class="max-oss-lang">' + escapeHtml(o.lang) + '</div>' +
      '</a>'
    )).join('');
    return (
      '<div class="max-cards-block">' +
        '<div class="max-oss-grid">' + cards + '</div>' +
        '<a class="max-cards-cta" href="/open-source" onclick="return window.maxOpenSection(\'oss\',event)">View all open source →</a>' +
      '</div>'
    );
  }

  function buildTechCardsHTML() {
    const groups = TECH_GROUPS.map((g) => (
      '<div class="max-tech-group">' +
        '<div class="max-tech-label">' + escapeHtml(g.label) + '</div>' +
        '<div class="max-tech-chips">' + g.items.map((i) => '<span class="max-tech-chip">' + escapeHtml(i) + '</span>').join('') + '</div>' +
      '</div>'
    )).join('');
    return (
      '<div class="max-cards-block">' + groups +
        '<a class="max-cards-cta" href="/tech-stack" onclick="return window.maxOpenSection(\'tech\',event)">Full tech stack →</a>' +
      '</div>'
    );
  }

  function buildCourseCardHTML() {
    const c = COURSE_CARD;
    const bullets = c.bullets.map((b) => '<li>' + escapeHtml(b) + '</li>').join('');
    return (
      '<div class="max-cards-block">' +
        '<a class="max-course-card" href="/flutter-course" onclick="return window.maxOpenSection(\'course\',event)">' +
          '<div class="max-course-badge">FREE · 35 videos</div>' +
          '<div class="max-course-title">' + escapeHtml(c.title) + '</div>' +
          '<div class="max-course-sub">' + escapeHtml(c.sub) + '</div>' +
          '<ul class="max-course-bullets">' + bullets + '</ul>' +
          '<div class="max-course-cta">▶ Open the course</div>' +
        '</a>' +
      '</div>'
    );
  }

  function buildContactCardsBlockHTML() {
    return '<div class="max-cards-block">' + buildContactCardsHTML() + '</div>';
  }

  function buildVideoCard(v, idx) {
    const thumb = 'https://img.youtube.com/vi/' + v.id + '/mqdefault.jpg';
    return (
      '<a class="max-video-card" href="https://www.youtube.com/watch?v=' + v.id + '"' +
        ' onclick="return window.maxOpenVideo(' + idx + ', event)">' +
        '<div class="max-video-thumb">' +
          '<img src="' + thumb + '" alt="' + escapeHtml(v.t) + '" loading="lazy">' +
          '<div class="max-video-badge">#' + (idx + 1) + '</div>' +
          '<div class="max-video-play">▶</div>' +
        '</div>' +
        '<div class="max-video-meta">' +
          '<div class="max-video-section">' + escapeHtml(v.s) + '</div>' +
          '<div class="max-video-title">' + escapeHtml(v.t) + '</div>' +
        '</div>' +
      '</a>'
    );
  }

  // Build cards for one or more video IDs (param can be id or comma-separated ids)
  function buildVideoCardsHTML(param) {
    const ids = String(param || '').split(',').map((s) => s.trim()).filter(Boolean);
    const items = ids.map((id) => {
      const idx = FC_VIDEO_INDEX[id];
      if (idx == null) return null;
      return { v: FC_VIDEOS[idx], idx };
    }).filter(Boolean);
    if (items.length === 0) return '';
    const grid = items.map((it) => buildVideoCard(it.v, it.idx)).join('');
    return (
      '<div class="max-cards-block">' +
        '<div class="max-video-grid">' + grid + '</div>' +
        '<a class="max-cards-cta" href="/flutter-course" onclick="return window.maxOpenSection(\'course\',event)">Open full Flutter course →</a>' +
      '</div>'
    );
  }

  // Map of CTA keys to (desktop window id, mobile section id)
  const NAV_MAP = {
    prs: { win: 'flutter', mob: 'prs' },
    speaking: { win: 'speaking', mob: 'speaking' },
    oss: { win: 'oss', mob: 'oss' },
    tech: { win: 'tech', mob: 'tech' },
    articles: { win: 'articles', mob: 'articles' },
    course: { win: 'flutter-course', mob: 'flutter-course' },
    contact: { win: 'contact', mob: 'connect' },
  };

  // Open a section in-site (window on desktop, expanded section on mobile)
  window.maxOpenSection = function (key, ev) {
    const m = NAV_MAP[key];
    if (!m) return true;
    const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
    try {
      if (isMobile && typeof window.expandMobileSection === 'function') {
        if (ev) { ev.preventDefault(); ev.stopPropagation(); }
        window.expandMobileSection(ev || { stopPropagation: function(){} }, m.mob);
        return false;
      }
      if (!isMobile && typeof window.openWindow === 'function') {
        if (ev) { ev.preventDefault(); ev.stopPropagation(); }
        window.openWindow(m.win);
        return false;
      }
    } catch (e) {}
    return true;
  };

  // Click handler: if course player is available in same page, use it; else fall back to YouTube link
  window.maxOpenVideo = function (idx, ev) {
    try {
      if (typeof window.playFcVideo === 'function') {
        if (ev) { ev.preventDefault(); ev.stopPropagation(); }
        // Ensure flutter-course module is initialized so the player window exists
        if (typeof window.initFlutterCourse === 'function') {
          try { window.initFlutterCourse(); } catch (e) {}
        }
        window.playFcVideo(idx);
        return false;
      }
    } catch (e) {}
    return true; // allow default href to open YouTube
  };

  const CARD_BUILDERS = {
    contact: () => buildContactCardsBlockHTML(),
    prs: () => buildPRsCardsHTML(),
    articles: (p) => buildArticlesCardsHTML(p),
    article: (p) => buildArticlesCardsHTML(p),
    course: () => buildCourseCardHTML(),
    speaking: () => buildSpeakingCardsHTML(),
    opensource: () => buildOSSCardsHTML(),
    oss: () => buildOSSCardsHTML(),
    tech: () => buildTechCardsHTML(),
    techstack: () => buildTechCardsHTML(),
    video: (p) => buildVideoCardsHTML(p),
    videos: (p) => buildVideoCardsHTML(p),
  };

  // Extract card tags from text. Supported:
  //   [[CARDS:type]]         e.g. [[CARDS:contact]]
  //   [[type]]               shorthand for type alone
  //   [[type:param]]         e.g. [[VIDEO:GJpmATFL3JQ]] or [[ARTICLES:state-mgmt,three-tree]]
  //   [[CARDS:type:param]]   verbose version
  // Returns segments: { kind:'text', value } | { kind:'cards', type, param }
  function splitCardTags(text) {
    if (!text) return [{ kind: 'text', value: '' }];
    const re = /\[\[(?:CARDS?:)?([a-zA-Z_-]+)(?::([^\]]+))?\]\]/g;
    const parts = [];
    let last = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const type = (m[1] || '').toLowerCase();
      const param = (m[2] || '').trim();
      if (!CARD_BUILDERS[type]) continue;
      if (m.index > last) {
        parts.push({ kind: 'text', value: text.slice(last, m.index).trim() });
      }
      parts.push({ kind: 'cards', type: type, param: param });
      last = m.index + m[0].length;
    }
    if (last < text.length) {
      parts.push({ kind: 'text', value: text.slice(last).trim() });
    }
    return parts.filter((p) => p.kind === 'cards' || (p.value && p.value.length > 0));
  }

  function renderInformedCard(inst) {
    if (!inst) return;
    const card = el('div', 'max-informed-card');
    card.innerHTML =
      '<div class="max-informed-head">' +
        '<div class="max-informed-icon">✓</div>' +
        '<div>' +
          '<div class="max-informed-title">Ishaq has been notified</div>' +
          '<div class="max-informed-sub">He will respond shortly. Busy schedule, but he checks lead emails fast.</div>' +
        '</div>' +
      '</div>' +
      '<div class="max-informed-meanwhile">Meanwhile, browse his direct contact links</div>' +
      buildContactCardsHTML();
    inst.messagesEl.appendChild(card);
    scrollToBottom(inst, true);
  }

  function renderLeadFallbackCard(inst, lead) {
    if (!inst) return;
    const card = el('div', 'max-lead-card');
    const subject = encodeURIComponent('Lead from ishaqhassan.dev: ' + (lead.intent || 'Inquiry'));
    const bodyLines = [
      'Name: ' + (lead.name || ''),
      'Email: ' + (lead.email || ''),
      'Intent: ' + (lead.intent || ''),
      lead.phone ? 'Phone: ' + lead.phone : null,
      '',
      lead.summary || '',
      '',
      '— Sent via Max chat',
    ].filter(Boolean).join('\n');
    const mailto = 'mailto:hello@ishaqhassan.dev?subject=' + subject + '&body=' + encodeURIComponent(bodyLines);

    card.innerHTML =
      '<div class="max-lead-title">📬 Lead Summary</div>' +
      '<div class="max-lead-rows">' +
        '<div class="max-lead-key">Name</div><div class="max-lead-val">' + escapeHtml(lead.name || '—') + '</div>' +
        '<div class="max-lead-key">Email</div><div class="max-lead-val">' + escapeHtml(lead.email || '—') + '</div>' +
        '<div class="max-lead-key">Intent</div><div class="max-lead-val">' + escapeHtml(lead.intent || '—') + '</div>' +
        (lead.summary ? '<div class="max-lead-key">Details</div><div class="max-lead-val">' + escapeHtml(lead.summary) + '</div>' : '') +
      '</div>' +
      '<div class="max-lead-actions">' +
        '<a class="max-lead-btn max-lead-btn-primary" href="' + mailto + '" target="_blank" rel="noopener" data-max-action="send">📤 Send to Ishaq</a>' +
        '<button class="max-lead-btn max-lead-btn-ghost" type="button" data-max-action="edit">Edit</button>' +
      '</div>';

    card.querySelector('[data-max-action="edit"]').addEventListener('click', () => {
      state.lead = null;
      state.leadSent = false;
      saveSession(state);
      const m = { role: 'assistant', content: "Theek hai, tell me what to fix and we'll redo." };
      state.messages.push(m);
      saveSession(state);
      bindAll().forEach((i) => renderAll(i));
    });
    card.querySelector('[data-max-action="send"]').addEventListener('click', () => {
      try { if (window.gtag) window.gtag('event', 'max_lead_send', { intent: lead.intent || 'unknown' }); } catch (e) {}
    });

    inst.messagesEl.appendChild(card);
    scrollToBottom(inst, true);
  }

  function scrollToBottom(inst, smooth) {
    if (!inst) return;
    requestAnimationFrame(() => {
      try {
        inst.messagesEl.scrollTo({
          top: inst.messagesEl.scrollHeight,
          behavior: smooth ? 'smooth' : 'auto',
        });
      } catch (e) {
        inst.messagesEl.scrollTop = inst.messagesEl.scrollHeight;
      }
    });
  }

  /* ------------------- Lead JSON detection ------------------- */
  function extractLead(text) {
    if (!text) return { clean: text, lead: null };
    let lead = null;
    let clean = text;

    const jsonRe = /```json\s*([\s\S]*?)```|<lead>([\s\S]*?)<\/lead>/i;
    const m = clean.match(jsonRe);
    if (m) {
      const raw = (m[1] || m[2] || '').trim();
      try {
        const obj = JSON.parse(raw);
        if (obj && obj.lead_ready === true) {
          lead = {
            name: String(obj.name || '').slice(0, 80),
            email: String(obj.email || '').slice(0, 120),
            intent: String(obj.intent || '').slice(0, 60),
            summary: String(obj.summary || '').slice(0, 600),
            phone: obj.phone ? String(obj.phone).slice(0, 40) : null,
          };
        }
      } catch (e) {}
    }

    clean = clean.replace(/```json[\s\S]*?```/gi, '');
    clean = clean.replace(/```[\s\S]*?lead_ready[\s\S]*?```/gi, '');
    clean = clean.replace(/<lead>[\s\S]*?<\/lead>/gi, '');
    clean = clean.replace(/^[\s>*-]*(\*\*)?\s*(JSON\s*)?Lead\s*Ready\s*(Block|Object|Template)?(\*\*)?\s*:?\s*$/gim, '');

    // When a lead is being emitted, the success card already shows contact links —
    // strip any duplicate [[CARDS:contact]] tag (or [[contact]]) the model might add.
    if (lead) {
      clean = clean.replace(/\[\[(?:CARDS?:)?contact\]\]/gi, '');
    }

    clean = clean.replace(/\n{3,}/g, '\n\n').trim();

    return { clean: clean || '…', lead: lead };
  }

  /* ------------------- Network ------------------- */
  async function callLLM(messages) {
    if (!MAX_API) throw new Error('NOT_WIRED');
    const res = await fetch(MAX_API + '/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages.slice(-MAX_HISTORY) }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error('HTTP_' + res.status + ' ' + txt.slice(0, 80));
    }
    const data = await res.json();
    return String(data.reply || '').trim();
  }

  async function notifyLead(lead) {
    if (!MAX_API) throw new Error('NOT_WIRED');
    const res = await fetch(MAX_API + '/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead: lead }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error('NOTIFY_HTTP_' + res.status + ' ' + txt.slice(0, 80));
    }
    return res.json();
  }

  /* ------------------- Send flow ------------------- */
  let sending = false;

  async function sendMessage(textOverride) {
    if (sending) return;
    const insts = bindAll();
    if (insts.length === 0) return;
    let raw = '';
    if (textOverride != null) {
      raw = String(textOverride).trim();
    } else {
      for (let i = 0; i < insts.length; i++) {
        const v = (insts[i].inputEl.value || '').trim();
        if (v) { raw = v; break; }
      }
    }
    if (!raw) return;
    if (raw.length > MAX_CHARS) return;

    sending = true;
    bindAll().forEach((i) => {
      i.inputEl.value = '';
      i.inputEl.style.height = 'auto';
      if (i.sendBtn) i.sendBtn.disabled = true;
      if (i.chipsEl) i.chipsEl.innerHTML = '';
    });

    const userMsg = { role: 'user', content: raw };
    state.messages.push(userMsg);
    saveSession(state);
    bindAll().forEach((i) => appendMessage(i, userMsg, true));
    bindAll().forEach((i) => scrollToBottom(i, true));

    try { if (window.gtag) window.gtag('event', 'max_message_send', { len: raw.length }); } catch (e) {}

    const typingEls = bindAll().map((i) => ({ inst: i, node: appendTyping(i) }));

    try {
      const reply = await callLLM(state.messages);
      typingEls.forEach((t) => { if (t.node && t.node.parentNode) t.node.parentNode.removeChild(t.node); });

      const { clean, lead } = extractLead(reply);
      const botMsg = { role: 'assistant', content: clean || '…' };
      state.messages.push(botMsg);
      if (lead && !state.leadSent) state.lead = lead;
      saveSession(state);

      bindAll().forEach((i) => {
        appendMessage(i, botMsg, true);
        scrollToBottom(i, true);
      });

      if (lead && !state.leadSent) {
        try { if (window.gtag) window.gtag('event', 'max_lead_captured', { intent: lead.intent }); } catch (e) {}
        await dispatchNotify(lead);
      }
    } catch (err) {
      typingEls.forEach((t) => { if (t.node && t.node.parentNode) t.node.parentNode.removeChild(t.node); });
      const code = String(err && err.message || err);
      const friendly = (code === 'NOT_WIRED')
        ? "Max ka brain abhi connect ho raha hai. Thodi der mein retry karo, ya **Direct Links** tab se Ishaq ko seedha email karo."
        : "Connection issue. Retry karo ya Direct Links se contact karo.";
      const banner = { role: 'assistant', content: friendly };
      state.messages.push(banner);
      saveSession(state);
      bindAll().forEach((i) => { appendMessage(i, banner, true); scrollToBottom(i, true); });
      try { if (window.gtag) window.gtag('event', 'max_error', { code: code.slice(0, 40) }); } catch (e) {}
    } finally {
      sending = false;
      bindAll().forEach((i) => { if (i.sendBtn) i.sendBtn.disabled = false; });
    }
  }

  async function dispatchNotify(lead) {
    bindAll().forEach((i) => {
      const t = appendTyping(i);
      i._notifyTyping = t;
    });
    try {
      await notifyLead(lead);
      state.leadSent = true;
      saveSession(state);
      bindAll().forEach((i) => {
        if (i._notifyTyping && i._notifyTyping.parentNode) i._notifyTyping.parentNode.removeChild(i._notifyTyping);
        i._notifyTyping = null;
        renderInformedCard(i);
      });
      try { if (window.gtag) window.gtag('event', 'max_lead_emailed', { intent: lead.intent || 'unknown' }); } catch (e) {}
    } catch (err) {
      bindAll().forEach((i) => {
        if (i._notifyTyping && i._notifyTyping.parentNode) i._notifyTyping.parentNode.removeChild(i._notifyTyping);
        i._notifyTyping = null;
        renderLeadFallbackCard(i, lead);
      });
      try { if (window.gtag) window.gtag('event', 'max_lead_email_failed', { code: String(err.message || '').slice(0, 40) }); } catch (e) {}
    }
  }

  /* ------------------- Wire instances ------------------- */
  let instCache = null;
  function bindAll() {
    if (instCache) return instCache;
    const list = [];
    const d = bindInstance(null);
    if (d) list.push(d);
    const m = bindInstance('mob');
    if (m) list.push(m);
    instCache = list;
    return list;
  }

  function attachEvents(inst) {
    if (inst.tabsEl) {
      const attr = inst.suffix ? 'data-max-tab-mob' : 'data-max-tab';
      inst.tabsEl.querySelectorAll('.max-tab').forEach((b) => {
        b.addEventListener('click', () => setTab(inst, b.getAttribute(attr)));
      });
    }
    inst.formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      sendMessage();
    });
    inst.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    inst.inputEl.addEventListener('input', () => {
      inst.inputEl.style.height = 'auto';
      inst.inputEl.style.height = Math.min(120, inst.inputEl.scrollHeight) + 'px';
    });
  }

  function ensureGreeting() {
    if (state.messages.length > 0) return;
    state.messages.push({
      role: 'assistant',
      content: "Hey 👋 I'm Max, Ishaq's AI assistant. Looking to hire, book a talk, or get Flutter help? Pick a chip below or just type.",
    });
    saveSession(state);
  }

  function scrollAllToBottom(smooth) {
    bindAll().forEach((i) => scrollToBottom(i, !!smooth));
  }

  /* ------------------- Init ------------------- */
  function init() {
    const insts = bindAll();
    if (insts.length === 0) return;
    insts.forEach(attachEvents);
    ensureGreeting();
    insts.forEach(renderAll);
    // Scroll to bottom multiple times to cover layout/font-load settling
    [0, 60, 180, 400, 800].forEach((d) => setTimeout(() => scrollAllToBottom(false), d));

    // Re-scroll when chat container becomes visible (window opens / mobile section expands)
    insts.forEach((inst) => {
      if (!inst || !inst.messagesEl) return;
      let last = 0;
      try {
        const ro = new ResizeObserver(() => {
          const h = inst.messagesEl.clientHeight;
          if (h > 0 && h !== last) {
            last = h;
            scrollToBottom(inst, false);
          }
        });
        ro.observe(inst.messagesEl);
      } catch (e) {}
    });

    // Window resize / orientation change
    window.addEventListener('resize', () => scrollAllToBottom(false));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.MaxChat = {
    reset: function () {
      try { sessionStorage.removeItem(SS_KEY); } catch (e) {}
      state.messages = [];
      state.lead = null;
      state.leadSent = false;
      ensureGreeting();
      bindAll().forEach(renderAll);
    },
    setEndpoint: function (url) { window.MAX_API_URL = url; },
    switchTab: function (tab) {
      const insts = bindAll();
      insts.forEach((i) => setTab(i, tab));
    },
    send: function (text) { return sendMessage(text); },
    scrollBottom: function (smooth) { scrollAllToBottom(!!smooth); },
    _state: function () {
      const insts = bindAll();
      return {
        instCount: insts.length,
        sending: sending,
        messageCount: state.messages.length,
        lead: state.lead,
        leadSent: state.leadSent,
      };
    },
  };

  window.openMobileDirectContact = function (event) {
    if (event && event.stopPropagation) event.stopPropagation();
    if (typeof window.expandMobileSection === 'function') {
      window.expandMobileSection(event || { stopPropagation: function(){} }, 'connect');
    }
    setTimeout(function () {
      if (window.MaxChat && typeof window.MaxChat.switchTab === 'function') {
        window.MaxChat.switchTab('direct');
      }
    }, 60);
  };
})();
