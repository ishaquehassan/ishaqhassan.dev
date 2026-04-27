/* Contact Liquid Morph
   Click contact desk-icon → blob expands from icon → centered glass panel.
   Inside: animated mesh gradient bg, social cards (stagger reveal + tilt),
   inline form posting to /notify, success state animation.
   Mobile: bypass — falls through to navigate('contact'). */
(function () {
  'use strict';

  var MAX_API = (window.MAX_API_URL || '').replace(/\/$/, '');
  var body = document.body;
  var overlay, panel, closeBtn, form, openedFrom;
  var lastFocus = null;
  var initialized = false;

  function isMobile() {
    return window.matchMedia('(max-width: 768px)').matches;
  }

  function init() {
    if (initialized) return;
    overlay  = document.getElementById('contact-morph-overlay');
    panel    = document.getElementById('contact-morph-panel');
    closeBtn = document.getElementById('contact-morph-close');
    form     = document.getElementById('contact-morph-form');
    if (!overlay || !panel) return;

    if (closeBtn) closeBtn.addEventListener('click', closeMorph);
    overlay.addEventListener('mousedown', function (e) {
      if (e.target === overlay) closeMorph();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && body.classList.contains('contact-morph-active')) closeMorph();
    });
    if (form) form.addEventListener('submit', handleSubmit);

    // Parallax mouse-tracking on panel
    panel.addEventListener('mousemove', onPanelMouseMove);
    panel.addEventListener('mouseleave', resetPanelTilt);

    // Card tilt on hover
    Array.prototype.forEach.call(panel.querySelectorAll('.cm-card'), function (card) {
      card.addEventListener('mousemove', onCardMouseMove);
      card.addEventListener('mouseleave', resetCardTilt);
    });

    initialized = true;
  }

  function getIconRect() {
    // Try desk-icon contact (desktop), fall back to dock contact area
    var icon = document.querySelector('.desk-icon[aria-label="Open Contact"] .desk-icon-art');
    if (icon) return icon.getBoundingClientRect();
    var fallback = document.querySelector('.desk-icon[aria-label="Open Contact"]');
    return fallback ? fallback.getBoundingClientRect() : null;
  }

  function getOriginTransform() {
    // Compute transform that places the (final-size) panel's center over the
    // contact icon, scaled down to roughly the icon's size. GPU-composited.
    var rect = getIconRect();
    if (!rect) return null;
    var panelW = panel.offsetWidth || Math.min(720, window.innerWidth * 0.92);
    var panelH = panel.offsetHeight || Math.min(620, window.innerHeight * 0.88);
    var iconCx = rect.left + rect.width / 2;
    var iconCy = rect.top + rect.height / 2;
    var viewCx = window.innerWidth / 2;
    var viewCy = window.innerHeight / 2;
    var dx = iconCx - viewCx;
    var dy = iconCy - viewCy;
    var s = Math.max(rect.width, rect.height) / Math.max(panelW, panelH);
    return 'translate(-50%, -50%) translate(' + dx.toFixed(1) + 'px, ' + dy.toFixed(1) + 'px) scale(' + s.toFixed(4) + ')';
  }

  function openMorph(triggerEl) {
    if (isMobile()) {
      if (typeof window.navigate === 'function') window.navigate('contact');
      return;
    }
    init();
    if (body.classList.contains('contact-morph-active') ||
        body.classList.contains('contact-morph-closing')) return;

    openedFrom = triggerEl || null;
    lastFocus = document.activeElement;

    overlay.style.display = 'block';
    overlay.offsetHeight; // flush so panel measurements are valid

    var origin = getOriginTransform();
    if (origin) {
      // Snap to icon position with NO transition (preset state)
      panel.style.transition = 'none';
      panel.style.transform = origin;
      panel.offsetHeight; // commit the no-transition state
    }

    // One paint cycle later, trigger the smooth transition by adding active class
    requestAnimationFrame(function () {
      panel.style.transition = ''; // restore CSS-defined transitions
      // Read computed style to ensure transition is applied before the next mutation
      void panel.offsetWidth;
      body.classList.add('contact-morph-active');
      panel.style.transform = '';
    });

  }

  function closeMorph() {
    if (!body.classList.contains('contact-morph-active')) return;

    body.classList.add('contact-morph-closing');
    body.classList.remove('contact-morph-active');

    // Revert URL if we're at /contact (or ?w=contact). Use replaceState so
    // back-button doesn't reopen the morph.
    try {
      var path = location.pathname || '';
      var search = location.search || '';
      if (path === '/contact' || path === '/contact/' || search.indexOf('w=contact') !== -1) {
        history.replaceState({}, '', '/');
        if (typeof window.updateMetaForWindow === 'function') {
          try { window.updateMetaForWindow(null); } catch (e) {}
        }
      }
    } catch (e) {}

    setTimeout(function () {
      body.classList.remove('contact-morph-closing');
      overlay.style.display = '';
      panel.classList.remove('cm-sent');
      if (form) form.reset();
      if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
    }, 280);
  }

  function onPanelMouseMove(e) {
    var rect = panel.getBoundingClientRect();
    var x = (e.clientX - rect.left) / rect.width - 0.5;
    var y = (e.clientY - rect.top) / rect.height - 0.5;
    panel.style.setProperty('--cm-px', x.toFixed(3));
    panel.style.setProperty('--cm-py', y.toFixed(3));
  }

  function resetPanelTilt() {
    panel.style.setProperty('--cm-px', '0');
    panel.style.setProperty('--cm-py', '0');
  }

  function onCardMouseMove(e) {
    var card = e.currentTarget;
    var rect = card.getBoundingClientRect();
    var x = (e.clientX - rect.left) / rect.width - 0.5;
    var y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty('--cm-cx', x.toFixed(3));
    card.style.setProperty('--cm-cy', y.toFixed(3));
  }

  function resetCardTilt(e) {
    var card = e.currentTarget;
    card.style.setProperty('--cm-cx', '0');
    card.style.setProperty('--cm-cy', '0');
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form || form.classList.contains('cm-form-busy')) return;
    var fd = new FormData(form);
    var name = (fd.get('name') || '').toString().trim();
    var email = (fd.get('email') || '').toString().trim();
    var message = (fd.get('message') || '').toString().trim();
    if (!email || !message) return;

    form.classList.add('cm-form-busy');
    var summary = 'Contact form submission via desktop morph.\n\nName: ' + (name || '(unspecified)') +
                  '\nEmail: ' + email + '\n\nMessage:\n' + message;

    var payload = {
      lead: {
        name: name || null,
        email: email,
        intent: 'contact',
        summary: summary,
      },
    };

    if (!MAX_API) {
      // Fallback when worker URL missing — open mailto
      window.location.href = 'mailto:hello@ishaqhassan.dev?subject=Contact via site&body=' +
        encodeURIComponent(summary);
      form.classList.remove('cm-form-busy');
      return;
    }

    fetch(MAX_API + '/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(function (r) {
      if (!r.ok) throw new Error('http_' + r.status);
      return r.json();
    }).then(function () {
      form.classList.remove('cm-form-busy');
      panel.classList.add('cm-sent');
    }).catch(function () {
      form.classList.remove('cm-form-busy');
      // Hard fallback to mailto
      window.location.href = 'mailto:hello@ishaqhassan.dev?subject=Contact via site&body=' +
        encodeURIComponent(summary);
    });
  }

  window.openContactMorph = openMorph;
  window.closeContactMorph = closeMorph;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
