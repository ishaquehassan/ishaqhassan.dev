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

  const ARTICLE_CARDS = [
    { tag: 'Flutter', title: 'How I Got 6 PRs Merged Into Flutter Framework', excerpt: '90-day path from triage to merge. Test-first bar, review etiquette.', mins: 10, href: '/blog/how-i-got-6-prs-merged-into-flutter.html' },
    { tag: 'Architecture', title: "Flutter's Three-Tree Architecture Explained", excerpt: 'Widget configures, Element mounts, RenderObject paints. Where bugs hide.', mins: 12, href: '/blog/flutter-three-tree-architecture-explained.html' },
    { tag: 'State', title: 'Flutter State Management 2026: A Decision Guide', excerpt: 'setState, Provider, Riverpod, Bloc, signals. When to use which.', mins: 14, href: '/blog/flutter-state-management-2026-guide.html' },
    { tag: 'Plugins', title: 'Building Production Flutter Plugins (156 likes case study)', excerpt: 'Build, publish, maintain a plugin with 156 pub.dev likes.', mins: 11, href: '/blog/building-production-flutter-plugins-case-study.html' },
  ];

  const SPEAKING_CARDS = [
    { date: 'Aug 2021', title: 'Flutter Bootcamp', org: 'GDG Kolachi', role: 'Lead Instructor', href: 'https://gdg.community.dev/events/details/google-gdg-kolachi-presents-flutter-bootcamp/' },
    { date: '2025', title: 'Code to Create / Road to DevFest', org: 'NIC Karachi', role: 'Speaker', href: 'https://www.linkedin.com/posts/gdgkolachi_codetocreate-roadtodevfest2025-gdgkolachi-activity-7400908378081767424-EB-7' },
    { date: 'May 2024', title: 'DevNCode Meetup IV: AI', org: 'The Nest I/O', role: 'Speaker', href: 'https://medium.com/devncode/devncode-meetup-iv-artificial-intelligence-df8c602de7d5' },
    { date: '2024', title: 'Flutter Seminar', org: 'Iqra University', role: 'Keynote', href: 'https://www.linkedin.com/posts/itrathussainzaidi_flutter-iqrauniversity-seminar-activity-7192627199412232192-8t2X' },
  ];

  const OSS_CARDS = [
    { name: 'document_scanner_flutter', desc: 'Flutter plugin: document scanning with edge detection', stars: '63★ · 135 forks', lang: 'Dart', href: 'https://github.com/ishaquehassan/document_scanner_flutter' },
    { name: 'flutter_alarm_background_trigger', desc: 'Native Kotlin alarm plugin for Flutter', stars: '13★', lang: 'Kotlin', href: 'https://github.com/ishaquehassan/flutter_alarm_background_trigger' },
    { name: 'assets_indexer', desc: 'Auto-generate typed asset references (R.java pattern)', stars: '9★', lang: 'Dart', href: 'https://github.com/ishaquehassan/assets_indexer' },
    { name: 'goal-agent', desc: 'AI-powered career goal tracking agent', stars: 'OSS', lang: 'TypeScript', href: 'https://github.com/ishaquehassan/goal-agent' },
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

  const CONTACT_CARDS = [
    { label: 'Email', value: 'hello@ishaqhassan.dev', href: 'mailto:hello@ishaqhassan.dev', grad: 'linear-gradient(135deg,#22c55e,#16a34a)', svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="#fff" stroke-width="1.5"/><path d="M22 6l-10 7L2 6" stroke="#fff" stroke-width="1.5"/></svg>' },
    { label: 'GitHub', value: '@ishaquehassan', href: 'https://github.com/ishaquehassan', grad: 'linear-gradient(135deg,#24292e,#40464d)', svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>' },
    { label: 'LinkedIn', value: '@ishaquehassan', href: 'https://linkedin.com/in/ishaquehassan', grad: 'linear-gradient(135deg,#0077B5,#00a0dc)', svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>' },
    { label: 'Medium', value: '@ishaqhassan', href: 'https://medium.com/@ishaqhassan', grad: 'linear-gradient(135deg,#1a8917,#0d7a0d)', svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/></svg>' },
    { label: 'YouTube', value: '@ishaquehassan', href: 'https://www.youtube.com/@ishaquehassan', grad: 'linear-gradient(135deg,#ff0033,#cc0000)', svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 00.5 6.2C0 8 0 12 0 12s0 4 .5 5.8a3 3 0 002.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 002.1-2.1C24 16 24 12 24 12s0-4-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg>' },
    { label: 'X (Twitter)', value: '@ishaque_hassan', href: 'https://x.com/ishaque_hassan', grad: 'linear-gradient(135deg,#000,#1a1a1a)', svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>' },
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

  function renderText(s) {
    let out = escapeHtml(s);
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    out = out.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    out = out.replace(/\n/g, '<br>');
    return out;
  }

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
        const block = el('div', 'max-msg max-msg-bot max-msg-cards');
        if (!animate) block.style.animation = 'none';
        block.innerHTML = fn();
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
        '<a class="max-cards-cta" href="/flutter-contributions">View all PRs →</a>' +
      '</div>'
    );
  }

  function buildArticleCard(a) {
    return (
      '<a class="max-art-card" href="' + escapeHtml(a.href) + '">' +
        '<div class="max-art-tag">' + escapeHtml(a.tag) + '</div>' +
        '<div class="max-art-title">' + escapeHtml(a.title) + '</div>' +
        '<div class="max-art-excerpt">' + escapeHtml(a.excerpt) + '</div>' +
        '<div class="max-art-meta">' + a.mins + ' min read</div>' +
      '</a>'
    );
  }

  function buildArticlesCardsHTML() {
    const cards = ARTICLE_CARDS.map(buildArticleCard).join('');
    return (
      '<div class="max-cards-block">' +
        '<div class="max-art-grid">' + cards + '</div>' +
        '<a class="max-cards-cta" href="/articles/">View all articles →</a>' +
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
        '<a class="max-cards-cta" href="/speaking">View all speaking events →</a>' +
      '</div>'
    );
  }

  function buildOSSCardsHTML() {
    const cards = OSS_CARDS.map((o) => (
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
        '<a class="max-cards-cta" href="/open-source">View all open source →</a>' +
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
        '<a class="max-cards-cta" href="/tech-stack">Full tech stack →</a>' +
      '</div>'
    );
  }

  function buildCourseCardHTML() {
    const c = COURSE_CARD;
    const bullets = c.bullets.map((b) => '<li>' + escapeHtml(b) + '</li>').join('');
    return (
      '<div class="max-cards-block">' +
        '<a class="max-course-card" href="' + escapeHtml(c.href) + '" target="_blank" rel="noopener noreferrer">' +
          '<div class="max-course-badge">FREE · 35 videos</div>' +
          '<div class="max-course-title">' + escapeHtml(c.title) + '</div>' +
          '<div class="max-course-sub">' + escapeHtml(c.sub) + '</div>' +
          '<ul class="max-course-bullets">' + bullets + '</ul>' +
          '<div class="max-course-cta">▶ Watch on YouTube</div>' +
        '</a>' +
      '</div>'
    );
  }

  function buildContactCardsBlockHTML() {
    return '<div class="max-cards-block">' + buildContactCardsHTML() + '</div>';
  }

  const CARD_BUILDERS = {
    contact: buildContactCardsBlockHTML,
    prs: buildPRsCardsHTML,
    articles: buildArticlesCardsHTML,
    course: buildCourseCardHTML,
    speaking: buildSpeakingCardsHTML,
    opensource: buildOSSCardsHTML,
    oss: buildOSSCardsHTML,
    tech: buildTechCardsHTML,
    techstack: buildTechCardsHTML,
  };

  // Extract [[CARDS:type]] tags from text and split into segments.
  // Returns array of { kind: 'text', value } | { kind: 'cards', type }
  function splitCardTags(text) {
    if (!text) return [{ kind: 'text', value: '' }];
    const re = /\[\[CARDS?:([a-z_-]+)\]\]/gi;
    const parts = [];
    let last = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) {
        parts.push({ kind: 'text', value: text.slice(last, m.index).trim() });
      }
      const type = (m[1] || '').toLowerCase();
      if (CARD_BUILDERS[type]) {
        parts.push({ kind: 'cards', type: type });
      }
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

  /* ------------------- Init ------------------- */
  function init() {
    const insts = bindAll();
    if (insts.length === 0) return;
    insts.forEach(attachEvents);
    ensureGreeting();
    insts.forEach(renderAll);
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
