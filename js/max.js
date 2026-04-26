/* =====================================================================
   MAX — AI Contact Bot
   Wired to Cloudflare Worker proxy with Workers AI (Llama 3.1 8b).
   Falls back to a clear error message if Worker not yet deployed.
   ===================================================================== */
(function () {
  'use strict';

  // CONFIG: Worker endpoint (set after deploy). Empty string = not yet wired.
  // Production: same-origin /api/max via nginx OR direct workers.dev URL.
  const MAX_API = (window.MAX_API_URL || '').replace(/\/$/, '');

  const SS_KEY = 'max_session_v1';
  const MAX_HISTORY = 16; // sent to LLM
  const MAX_CHARS = 800;

  const QUICK_REPLIES_INITIAL = [
    'I want to hire Ishaq',
    'Speaking inquiry',
    'Flutter help',
    'About Ishaq',
  ];

  /* ------------------- Persistence ------------------- */
  function loadSession() {
    try {
      const raw = sessionStorage.getItem(SS_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }
  function saveSession(state) {
    try { sessionStorage.setItem(SS_KEY, JSON.stringify(state)); } catch (e) {}
  }

  /* ------------------- State ------------------- */
  const state = loadSession() || {
    messages: [], // {role:'user'|'assistant', content:string}
    lead: null,   // {name,email,intent,summary} when emitted
    started: false,
  };

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

  // Lightweight markdown: **bold**, *italic*, `code`, links, line breaks
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
  // Each instance binds desktop OR mobile container ids
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
    // Find panels in same window/section
    const root = inst.tabsEl.parentElement; // window-body or mobile-expanded-content
    if (!root) return;
    const panelAttr = inst.suffix ? 'data-max-panel-mob' : 'data-max-panel';
    root.querySelectorAll('[' + panelAttr + ']').forEach((p) => {
      p.classList.toggle('max-panel-active', p.getAttribute(panelAttr) === tab);
    });
    if (tab === 'chat') setTimeout(() => focusInput(inst), 50);
  }

  function focusInput(inst) {
    if (!inst || !inst.inputEl) return;
    // Avoid auto-focus on mobile (would yank keyboard up unexpectedly)
    if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) return;
    try { inst.inputEl.focus(); } catch (e) {}
  }

  /* ------------------- Rendering ------------------- */
  function renderAll(inst) {
    if (!inst) return;
    inst.messagesEl.innerHTML = '';
    state.messages.forEach((m) => appendMessage(inst, m, /*animate*/ false));
    if (state.lead) renderLeadCard(inst, state.lead);
    renderChips(inst);
    scrollToBottom(inst, false);
  }

  function appendMessage(inst, msg, animate) {
    if (!inst) return null;
    const wrap = el('div', 'max-msg max-msg-' + (msg.role === 'user' ? 'user' : 'bot'));
    if (!animate) wrap.style.animation = 'none';
    if (msg.role !== 'user') {
      const av = el('div', 'max-msg-avatar', '⚡');
      wrap.appendChild(av);
    }
    const bubble = el('div', 'max-bubble');
    bubble.innerHTML = renderText(msg.content);
    wrap.appendChild(bubble);
    inst.messagesEl.appendChild(wrap);
    return { wrap, bubble };
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
    // Show chips until the user has sent at least one message
    const hasUserMsg = state.messages.some((m) => m.role === 'user');
    if (hasUserMsg) return;
    QUICK_REPLIES_INITIAL.forEach((q) => {
      const b = el('button', 'max-chip', q);
      b.type = 'button';
      b.addEventListener('click', () => sendMessage(q));
      inst.chipsEl.appendChild(b);
    });
  }

  function renderLeadCard(inst, lead) {
    if (!inst) return;
    const card = el('div', 'max-lead-card');
    const subject = encodeURIComponent('Lead from ishaqhassan.dev: ' + (lead.intent || 'Inquiry'));
    const bodyLines = [
      'Name: ' + (lead.name || ''),
      'Email: ' + (lead.email || ''),
      'Intent: ' + (lead.intent || ''),
      '',
      lead.summary || '',
      '',
      '— Sent via Max chat',
    ].join('\n');
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
      saveSession(state);
      const m = { role: 'assistant', content: "Theek hai, tell me what to fix and we'll redo." };
      state.messages.push(m);
      saveSession(state);
      bindAll().forEach((i) => { renderAll(i); });
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
  // Llama may emit a JSON block when intent is captured. We strip it from
  // the visible bubble and render the lead card instead.
  function extractLead(text) {
    if (!text) return { clean: text, lead: null };
    // Look for ```json {...} ``` or a bare JSON block on its own line
    const jsonRe = /```json\s*([\s\S]*?)```|<lead>([\s\S]*?)<\/lead>/i;
    const m = text.match(jsonRe);
    if (!m) return { clean: text, lead: null };
    const raw = (m[1] || m[2] || '').trim();
    try {
      const obj = JSON.parse(raw);
      if (obj && obj.lead_ready === true) {
        return {
          clean: text.replace(jsonRe, '').trim(),
          lead: {
            name: String(obj.name || '').slice(0, 80),
            email: String(obj.email || '').slice(0, 120),
            intent: String(obj.intent || '').slice(0, 60),
            summary: String(obj.summary || '').slice(0, 600),
          },
        };
      }
    } catch (e) {}
    return { clean: text, lead: null };
  }

  /* ------------------- Network ------------------- */
  async function callLLM(messages) {
    if (!MAX_API) {
      throw new Error('NOT_WIRED');
    }
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
      // Read from whichever instance (desktop or mobile) has a non-empty value
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
      if (lead) state.lead = lead;
      saveSession(state);

      bindAll().forEach((i) => {
        appendMessage(i, botMsg, true);
        if (lead) renderLeadCard(i, lead);
        scrollToBottom(i, true);
      });

      if (lead) {
        try { if (window.gtag) window.gtag('event', 'max_lead_captured', { intent: lead.intent }); } catch (e) {}
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
    // Tab switching
    if (inst.tabsEl) {
      const attr = inst.suffix ? 'data-max-tab-mob' : 'data-max-tab';
      inst.tabsEl.querySelectorAll('.max-tab').forEach((b) => {
        b.addEventListener('click', () => setTab(inst, b.getAttribute(attr)));
      });
    }
    // Form submit
    inst.formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      sendMessage();
    });
    // Enter to send, Shift+Enter newline
    inst.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    // Auto-grow textarea
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
    // Sync state across desktop+mobile when one updates
  }

  // Init on DOM ready (this script is loaded with `defer`)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-init hook in case dynamic loaders rebuild the panel
  window.MaxChat = {
    reset: function () {
      try { sessionStorage.removeItem(SS_KEY); } catch (e) {}
      state.messages = [];
      state.lead = null;
      ensureGreeting();
      bindAll().forEach(renderAll);
    },
    setEndpoint: function (url) { window.MAX_API_URL = url; },
  };
})();
