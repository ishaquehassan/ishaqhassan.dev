/* Max chat liquid morph
   Real dock pill + AI pill have transparent bg.
   Blob layer (filter: url(#dock-goo)) renders the visible bg always.
   On Max click: blobs animate together → goo merges → wide bar.
   Then max-bar (input + send) fades in over the merged bar; chat panel slides up.
*/
(function () {
  'use strict';

  var body = document.body;
  var blobMain, blobAi, panel, bar, input, sendBtn, closeBtn, messagesEl, chipsEl, splashEl;
  var contactTrigger, contactPopover;
  var dockContainer, dockAi, dockPill;
  var initialized = false;

  function isMobile() { return window.matchMedia('(max-width: 768px)').matches; }

  function init() {
    if (initialized) return;
    blobMain = document.querySelector('.dock-blob-main');
    blobAi   = document.querySelector('.dock-blob-ai');
    panel    = document.getElementById('max-panel');
    bar      = document.getElementById('max-bar');
    input    = document.getElementById('max-bar-input');
    sendBtn  = document.getElementById('max-bar-send');
    closeBtn = document.getElementById('max-bar-close');
    contactTrigger = document.getElementById('max-contact-trigger');
    contactPopover = document.getElementById('max-contact-popover');
    messagesEl = document.getElementById('max-panel-messages');
    chipsEl    = document.getElementById('max-panel-chips');
    splashEl   = document.getElementById('max-splash');
    if (messagesEl) messagesEl.classList.add('is-hidden');
    dockContainer = document.getElementById('dock-container');
    dockAi   = document.getElementById('dock-ai');
    dockPill = document.getElementById('dock');
    if (!blobMain || !blobAi || !panel || !dockContainer || !dockAi || !dockPill) return;

    syncBlobsToDock();
    requestAnimationFrame(syncBlobsToDock);
    setTimeout(syncBlobsToDock, 700);
    window.addEventListener('resize', function () {
      if (!body.classList.contains('max-active')) syncBlobsToDock();
    });

    if (closeBtn) closeBtn.addEventListener('click', closeMaxChat);
    if (sendBtn)  sendBtn.addEventListener('click', sendUserMessage);
    if (input)    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendUserMessage(); }
    });
    if (input) input.addEventListener('input', autoResizeInput);

    if (contactTrigger) contactTrigger.addEventListener('click', toggleContact);
    if (chipsEl) chipsEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.max-chip-btn');
      if (!btn) return;
      var label = btn.textContent.trim();
      input.value = label;
      sendUserMessage();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && body.classList.contains('max-active')) closeMaxChat();
    });

    document.addEventListener('mousedown', function (e) {
      // Close contact popover on outside click
      if (contactPopover && contactPopover.classList.contains('is-open')) {
        if (!e.target.closest('#max-contact-popover') && !e.target.closest('#max-contact-trigger')) {
          contactPopover.classList.remove('is-open');
          if (contactTrigger) contactTrigger.setAttribute('aria-expanded', 'false');
        }
      }
      if (!body.classList.contains('max-active')) return;
      if (e.target.closest('#max-panel') || e.target.closest('#max-bar') || e.target.closest('#dock-ai')) return;
      closeMaxChat();
    });

    initialized = true;
  }

  /* Place blobs to exactly cover the real dock pill and AI pill rects. */
  function syncBlobsToDock() {
    if (!dockPill || !dockAi) return;
    var shell = document.getElementById('dock-shell');
    if (!shell) return;
    var shellRect = shell.getBoundingClientRect();
    var dockRect  = dockPill.getBoundingClientRect();
    var aiRect    = dockAi.getBoundingClientRect();

    blobMain.style.transition = 'none';
    blobAi.style.transition   = 'none';

    blobMain.style.left  = (dockRect.left - shellRect.left) + 'px';
    blobMain.style.transform = 'none';
    blobMain.style.width = dockRect.width + 'px';
    blobMain.style.height = dockRect.height + 'px';
    blobMain.style.borderRadius = '18px';

    blobAi.style.left  = (aiRect.left - shellRect.left) + 'px';
    blobAi.style.right = 'auto';
    blobAi.style.transform = 'none';
    blobAi.style.width = aiRect.width + 'px';
    blobAi.style.height = aiRect.height + 'px';
    blobAi.style.borderRadius = '22px';
    blobAi.style.opacity = '1';

    // Restore transitions on next frame
    requestAnimationFrame(function () {
      blobMain.style.transition = '';
      blobAi.style.transition = '';
    });
  }

  function autoResizeInput() {
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 80) + 'px';
  }

  function openMaxChat() {
    if (isMobile()) {
      if (typeof window.navigate === 'function') window.navigate('contact');
      return;
    }
    init();
    if (body.classList.contains('max-active')) return;

    // Make sure blobs match current dock positions BEFORE animating
    syncBlobsToDock();

    body.classList.add('max-morphing');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        body.classList.add('max-active');

        var shell = document.getElementById('dock-shell');
        var shellRect = shell.getBoundingClientRect();
        var dockContRect = dockContainer.getBoundingClientRect();
        // Bar width matches the dock+AI cluster width exactly (no extra space)
        var barWidth = dockContRect.width;
        var barLeft = dockContRect.left - shellRect.left;

        // Main blob expands symmetrically around cluster center (no horizontal translate feel)
        blobMain.style.left  = barLeft + 'px';
        blobMain.style.width = barWidth + 'px';
        blobMain.style.borderRadius = '24px';

        // AI blob stays in place, just shrinks. Main blob engulfs it = goo merges visually.
        blobAi.style.borderRadius = '24px';
        setTimeout(function () {
          blobAi.style.width   = '0px';
          blobAi.style.opacity = '0';
        }, 200);

        // Max-bar: anchor to exact blob position (no transform centering surprises)
        bar.style.left = barLeft + 'px';
        bar.style.width = barWidth + 'px';
        bar.style.transform = 'none';

        setTimeout(function () { if (input) input.focus(); }, 600);
        // Disable goo filter once merge is done so idle/active states are crisp
        setTimeout(function () { body.classList.remove('max-morphing'); }, 520);
      });
    });
  }

  function closeMaxChat() {
    if (!body.classList.contains('max-active')) return;
    body.classList.add('max-morphing');
    body.classList.remove('max-active');
    setTimeout(function () { body.classList.remove('max-morphing'); }, 520);

    // Restore blob ai opacity instantly so it can animate back
    blobAi.style.opacity = '1';
    blobAi.style.width   = parseFloat(getComputedStyle(blobMain).height) + 'px';

    // Sync to dock positions (animated thanks to transitions)
    requestAnimationFrame(function () {
      var shell = document.getElementById('dock-shell');
      if (!shell) return;
      var shellRect = shell.getBoundingClientRect();
      var dockRect  = dockPill.getBoundingClientRect();
      var aiRect    = dockAi.getBoundingClientRect();

      blobMain.style.left  = (dockRect.left - shellRect.left) + 'px';
      blobMain.style.width = dockRect.width + 'px';
      blobMain.style.borderRadius = '18px';

      blobAi.style.left  = (aiRect.left - shellRect.left) + 'px';
      blobAi.style.width = aiRect.width + 'px';
      blobAi.style.borderRadius = '22px';
    });
  }

  function toggleContact() {
    if (!contactPopover || !contactTrigger) return;
    var open = contactPopover.classList.toggle('is-open');
    contactTrigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function appendMessage(role, text) {
    if (!messagesEl) return;
    if (splashEl && !splashEl.classList.contains('is-hidden')) {
      splashEl.classList.add('is-hidden');
      messagesEl.classList.remove('is-hidden');
    }
    var el = document.createElement('div');
    el.className = 'max-panel-msg ' + role;
    el.textContent = text;
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function sendUserMessage() {
    if (!input) return;
    var text = (input.value || '').trim();
    if (!text) return;
    appendMessage('user', text);
    input.value = '';
    autoResizeInput();
    if (typeof window.MaxAPI === 'object' && typeof window.MaxAPI.sendMessage === 'function') {
      window.MaxAPI.sendMessage(text, function (reply) { appendMessage('bot', reply); });
    } else {
      setTimeout(function () {
        appendMessage('bot', "Thanks — Ishaq will get back to you. For now, try the Contact tab for direct links.");
      }, 600);
    }
  }

  window.openMaxChat = openMaxChat;
  window.closeMaxChat = closeMaxChat;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
