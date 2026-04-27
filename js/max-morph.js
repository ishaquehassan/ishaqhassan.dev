/* Max chat liquid morph
   Real dock pill + AI pill have transparent bg.
   Blob layer (filter: url(#dock-goo)) renders the visible bg always.
   On Max click: blobs animate together → goo merges → wide bar.
   Then max-bar (input + send) fades in over the merged bar; chat panel slides up.
*/
(function () {
  'use strict';

  var body = document.body;
  var blobMain, blobAi, panel, bar, input, closeBtn;
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
    closeBtn = document.getElementById('max-bar-close');
    contactTrigger = document.getElementById('max-contact-trigger');
    contactPopover = document.getElementById('max-contact-popover');
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
    if (contactTrigger) contactTrigger.addEventListener('click', toggleContact);
    // Note: input keydown, send-btn click, and chip clicks are owned by
    // the main Max chat brain (js/max.js) which binds the morph DOM as a
    // third instance via bindInstance('morph'). Splash → messages swap is
    // also handled there inside renderAll.

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

  window.openMaxChat = openMaxChat;
  window.closeMaxChat = closeMaxChat;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
