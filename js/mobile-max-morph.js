/* Mobile Max liquid morph
   Mirrors desktop max-morph.js: dock pill (#mob-dock) + AI pill (#mob-dock-ai)
   merge under SVG goo filter into a single bar, then the chat sheet
   (#max-mob-panel) slides up above it.
*/
(function () {
  'use strict';

  var body = document.body;
  var shell, blobMain, blobAi, panel, bar, input, sendBtn, closeBtn;
  var dockContainer, dockMain, dockAi;
  var initialized = false;
  var resizeRaf = 0;

  function isMobile() { return window.matchMedia('(max-width: 768px)').matches; }

  function init() {
    if (initialized) return;
    shell         = document.getElementById('mob-dock-shell');
    blobMain      = shell && shell.querySelector('.mob-dock-blob-main');
    blobAi        = shell && shell.querySelector('.mob-dock-blob-ai');
    dockContainer = document.getElementById('mob-dock-container');
    dockMain      = document.getElementById('mob-dock');
    dockAi        = document.getElementById('mob-dock-ai');
    panel         = document.getElementById('max-mob-panel');
    bar           = document.getElementById('max-mob-bar');
    input         = document.getElementById('max-mob-bar-input');
    sendBtn       = document.getElementById('max-mob-bar-send');
    closeBtn      = document.getElementById('max-mob-close');
    if (!shell || !blobMain || !blobAi || !dockMain || !dockAi || !panel) return;

    syncBlobsToDock();
    requestAnimationFrame(syncBlobsToDock);
    setTimeout(syncBlobsToDock, 600);

    window.addEventListener('resize', function () {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(function () {
        if (!body.classList.contains('max-mob-active')) syncBlobsToDock();
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeMobMax);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && body.classList.contains('max-mob-active')) closeMobMax();
    });

    /* Outside-tap to close: ignore taps on the panel itself, the dock,
       or the bar. */
    document.addEventListener('touchstart', onOutsideTap, { passive: true });
    document.addEventListener('mousedown', onOutsideTap);

    initialized = true;
  }

  function onOutsideTap(e) {
    if (!body.classList.contains('max-mob-active')) return;
    if (
      e.target.closest('#max-mob-panel') ||
      e.target.closest('#max-mob-bar') ||
      e.target.closest('#mob-dock-shell')
    ) return;
    closeMobMax();
  }

  /* Place blobs to exactly cover the visible dock pill rects. */
  function syncBlobsToDock() {
    if (!shell || !dockMain || !dockAi) return;
    var shellRect = shell.getBoundingClientRect();
    var mainRect  = dockMain.getBoundingClientRect();
    var aiRect    = dockAi.getBoundingClientRect();

    blobMain.style.transition = 'none';
    blobAi.style.transition   = 'none';

    blobMain.style.left   = (mainRect.left - shellRect.left) + 'px';
    blobMain.style.width  = mainRect.width + 'px';
    blobMain.style.height = mainRect.height + 'px';
    blobMain.style.borderRadius = (mainRect.height / 2) + 'px';

    blobAi.style.left   = (aiRect.left - shellRect.left) + 'px';
    blobAi.style.width  = aiRect.width + 'px';
    blobAi.style.height = aiRect.height + 'px';
    blobAi.style.borderRadius = (aiRect.height / 2) + 'px';
    blobAi.style.opacity = '1';

    requestAnimationFrame(function () {
      blobMain.style.transition = '';
      blobAi.style.transition   = '';
    });
  }

  function openMobMax(ev) {
    if (!isMobile()) return;
    init();
    if (body.classList.contains('max-mob-active')) return;

    syncBlobsToDock();

    body.classList.add('max-mob-morphing');

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        body.classList.add('max-mob-active');

        var shellRect = shell.getBoundingClientRect();
        // Expand merged bar to viewport width minus a 16px gutter on each side
        var sideGap = 16;
        var barWidth = window.innerWidth - sideGap * 2;
        var barLeft  = sideGap - shellRect.left;

        // Main blob expands across nearly the whole viewport
        blobMain.style.left   = barLeft + 'px';
        blobMain.style.width  = barWidth + 'px';
        blobMain.style.borderRadius = '30px';

        // AI blob shrinks to 0 — goo merges visually
        blobAi.style.borderRadius = '30px';
        setTimeout(function () {
          blobAi.style.width   = '0px';
          blobAi.style.opacity = '0';
        }, 200);

        // Anchor input bar to the merged blob position
        if (bar) {
          bar.style.left  = barLeft + 'px';
          bar.style.width = barWidth + 'px';
        }

        // Release goo filter once merge is visually complete
        setTimeout(function () { body.classList.remove('max-mob-morphing'); }, 520);

        // Notify max.js to re-bind chat instance to the mobile sheet
        if (typeof window.maxMobOnPanelOpen === 'function') {
          window.maxMobOnPanelOpen();
        }
      });
    });
  }

  function closeMobMax() {
    if (!body.classList.contains('max-mob-active')) return;
    body.classList.add('max-mob-morphing');
    body.classList.remove('max-mob-active');

    // Wait for the panel to start sliding down, then reverse-morph the
    // blobs so the user reads it as: panel descends → bar splits back.
    setTimeout(function () {
      // Re-anchor AI blob inside the merged bar (collapsed width = 0)
      // BEFORE animating it back out. This avoids the snap from old
      // off-screen position.
      blobAi.style.transition = 'none';
      blobAi.style.opacity = '1';
      blobAi.style.width   = '0px';
      var shellRect0 = shell.getBoundingClientRect();
      var aiRect0    = dockAi.getBoundingClientRect();
      blobAi.style.left = (aiRect0.left - shellRect0.left) + 'px';

      requestAnimationFrame(function () {
        blobAi.style.transition = '';

        var shellRect = shell.getBoundingClientRect();
        var mainRect  = dockMain.getBoundingClientRect();
        var aiRect    = dockAi.getBoundingClientRect();

        blobMain.style.left   = (mainRect.left - shellRect.left) + 'px';
        blobMain.style.width  = mainRect.width + 'px';
        blobMain.style.borderRadius = (mainRect.height / 2) + 'px';

        blobAi.style.left   = (aiRect.left - shellRect.left) + 'px';
        blobAi.style.width  = aiRect.width + 'px';
        blobAi.style.borderRadius = (aiRect.height / 2) + 'px';
      });
    }, 200);

    setTimeout(function () { body.classList.remove('max-mob-morphing'); }, 900);

    if (typeof window.maxMobOnPanelClose === 'function') {
      window.maxMobOnPanelClose();
    }
  }

  window.openMobMax = openMobMax;
  window.closeMobMax = closeMobMax;

  /* Keyboard-safe positioning: when soft keyboard appears the visual
     viewport shrinks. Push the dock + panel up by that delta so they
     stay above the keyboard. */
  function handleViewport() {
    var vv = window.visualViewport;
    if (!vv) return;
    var kbdOffset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    document.body.style.setProperty('--mob-kbd-h', kbdOffset + 'px');
    if (body && body.classList) {
      body.classList.toggle('max-mob-kbd-open', kbdOffset > 80);
    }
    // Re-sync blob positions while keyboard is open (dock has shifted up).
    if (initialized && !body.classList.contains('max-mob-active')) {
      syncBlobsToDock();
    }
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleViewport);
    window.visualViewport.addEventListener('scroll', handleViewport);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
