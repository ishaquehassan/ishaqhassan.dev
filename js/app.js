// ===== macOS NOTIFICATION =====
let notifTimeout = null;
function showNotif(msg, app) {
  const notif = document.getElementById('macos-notif');
  document.getElementById('notif-msg').textContent = msg;
  document.getElementById('notif-app').textContent = app || 'Ishaq OS';
  notif.classList.add('show');
  playSfx(sfxClick);
  clearTimeout(notifTimeout);
  notifTimeout = setTimeout(() => notif.classList.remove('show'), 5000);
}
function dismissNotif() {
  document.getElementById('macos-notif').classList.remove('show');
  clearTimeout(notifTimeout);
}

// Swipe to dismiss notification
(function() {
  const notif = document.getElementById('macos-notif');
  let startX = 0, currentX = 0, swiping = false;
  notif.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    currentX = startX;
    swiping = true;
    notif.style.transition = 'none';
  });
  notif.addEventListener('touchmove', (e) => {
    if (!swiping) return;
    currentX = e.touches[0].clientX;
    const dx = currentX - startX;
    if (Math.abs(dx) > 10) {
      notif.style.transform = 'translateX(' + dx + 'px)';
      notif.style.opacity = Math.max(0, 1 - Math.abs(dx) / 200);
    }
  });
  notif.addEventListener('touchend', () => {
    if (!swiping) return;
    swiping = false;
    const dx = currentX - startX;
    notif.style.transition = '';
    if (Math.abs(dx) > 80) {
      notif.style.transform = 'translateX(' + (dx > 0 ? '120%' : '-120%') + ')';
      notif.style.opacity = '0';
      setTimeout(() => { notif.classList.remove('show'); notif.style.opacity = ''; }, 300);
      clearTimeout(notifTimeout);
    } else {
      notif.style.transform = 'translateX(0)';
      notif.style.opacity = '1';
    }
  });
})();

// ===== ABOUT DIALOG =====
function detectSystemSpecs() {
  const cores = navigator.hardwareConcurrency || 4;
  document.getElementById('about-cpu').textContent = cores + '-Core Processor';

  const ram = navigator.deviceMemory;
  document.getElementById('about-ram').textContent = ram ? ram + ' GB' : 'Unknown';

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (ext) {
        const gpu = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
        const short = gpu.replace(/ANGLE \(|,.*?\)$/g, '').replace(/\)$/, '').trim();
        document.getElementById('about-gpu').textContent = short || gpu;
      } else {
        document.getElementById('about-gpu').textContent = 'WebGL Supported';
      }
    }
  } catch(e) {
    document.getElementById('about-gpu').textContent = 'Not Available';
  }


  const w = screen.width * (window.devicePixelRatio || 1);
  const h = screen.height * (window.devicePixelRatio || 1);
  const dpr = window.devicePixelRatio || 1;
  document.getElementById('about-display').textContent = w + ' x ' + h + ' (' + dpr + 'x Retina)';

  const ua = navigator.userAgent;
  let browser = 'Unknown';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome ' + (ua.match(/Chrome\/(\d+)/) || [])[1];
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari ' + (ua.match(/Version\/(\d+\.\d+)/) || [])[1];
  else if (ua.includes('Firefox')) browser = 'Firefox ' + (ua.match(/Firefox\/(\d+)/) || [])[1];
  else if (ua.includes('Edg')) browser = 'Edge ' + (ua.match(/Edg\/(\d+)/) || [])[1];
  document.getElementById('about-browser').textContent = browser;
}

function openAboutDialog() {
  detectSystemSpecs();
  var yEl = document.getElementById('about-year');
  if (yEl) yEl.textContent = new Date().getFullYear();
  document.getElementById('about-dialog-overlay').classList.add('show');
}
function closeAboutDialog() {
  document.getElementById('about-dialog-overlay').classList.remove('show');
}

// ===== MENUBAR DROPDOWNS =====
let activeMenu = null;
let activeParent = null;

// Detach all menu dropdowns to body at init so they escape widget backdrop-filter
// stacking contexts (widgets' blur creates a paint layer that covers menus even at z:99999)
const menuDropdownMap = new Map(); // parent → dropdown
document.querySelectorAll('.menu-parent[data-menu]').forEach(parent => {
  const dd = parent.querySelector(':scope > .menu-dropdown');
  if (dd) {
    menuDropdownMap.set(parent, dd);
    document.body.appendChild(dd);
    dd.dataset.anchorMenu = parent.dataset.menu;
    dd.style.position = 'fixed';
    dd.style.zIndex = '9999999';
  }
});

function positionDropdown(parent, menu) {
  const r = parent.getBoundingClientRect();
  menu.style.top = r.bottom + 'px';
  menu.style.left = r.left + 'px';
}

function closeActiveMenu() {
  if (activeMenu) activeMenu.classList.remove('show');
  if (activeParent) activeParent.classList.remove('open');
  activeMenu = null;
  activeParent = null;
}

function openMenu(parent) {
  const menu = menuDropdownMap.get(parent) || parent.querySelector('.menu-dropdown');
  if (!menu) return;
  if (activeMenu === menu) { closeActiveMenu(); return; }
  closeActiveMenu();
  positionDropdown(parent, menu);
  menu.classList.add('show');
  parent.classList.add('open');
  activeMenu = menu;
  activeParent = parent;
}

// Mousedown on menu parents
document.querySelectorAll('.menu-parent[data-menu]').forEach(parent => {
  parent.addEventListener('mousedown', (e) => {
    if (e.target.closest('.menu-dropdown')) return;
    e.preventDefault();
    e.stopPropagation();
    openMenu(parent);
  });

  // Hover switch when a menu is already open
  parent.addEventListener('mouseenter', () => {
    if (!activeMenu) return;
    const menu = menuDropdownMap.get(parent) || parent.querySelector('.menu-dropdown');
    if (menu && menu !== activeMenu) openMenu(parent);
  });
});

// Re-position active menu on window resize
window.addEventListener('resize', () => {
  if (activeMenu && activeParent) positionDropdown(activeParent, activeMenu);
});

// Click outside to close
document.addEventListener('mousedown', (e) => {
  if (!activeMenu) return;
  if (e.target.closest('.menu-parent')) return;
  if (e.target.closest('.menu-dropdown')) return;
  closeActiveMenu();
});

// Click any dropdown item to close menu (event delegation for dynamic items)
document.addEventListener('click', function(e) {
  var item = e.target.closest('.menu-dd-item:not(.disabled)');
  if (item) closeActiveMenu();
});

function openAllWindows() {
  ['about','flutter','speaking','oss','tech','articles','contact','github','linkedin'].forEach((id, i) => {
    setTimeout(() => openWindow(id), i * 150);
  });
}

function closeAllWindows() {
  Object.keys(openWindows).forEach(id => closeWindow(id));
}

function _collectDesktopWindowIds() {
  var wins = document.querySelectorAll('.window.open');
  var items = [];
  wins.forEach(function(win) {
    var id = win.id.replace(/^win-/, '');
    var z = parseInt(win.style.zIndex || 0, 10) || 0;
    items.push({ id: id, z: z });
  });
  // Front window first so user sees the topmost close first
  items.sort(function(a, b) { return b.z - a.z; });
  return items.map(function(x) { return x.id; });
}

function forceCloseAllWindows() {
  if (document.body.classList.contains('has-fullscreen') && typeof fullscreenState !== 'undefined') {
    Object.keys(fullscreenState).forEach(function(id) {
      if (typeof exitFullscreen === 'function') { try { exitFullscreen(id); } catch(e){} }
    });
  }
  var ids = _collectDesktopWindowIds();
  var stagger = 55; // ms between each window starting its close animation
  ids.forEach(function(id, i) {
    setTimeout(function() {
      try { closeWindow(id); } catch(e){}
    }, i * stagger);
  });
  setTimeout(function() {
    document.body.classList.remove('has-fullscreen');
    if (typeof syncDockIndicators === 'function') syncDockIndicators();
    if (typeof updateMenuBarForWindow === 'function') updateMenuBarForWindow(null);
  }, ids.length * stagger + 260);
}

function forceMinimizeAllWindows() {
  var ids = _collectDesktopWindowIds();
  var stagger = 55;
  ids.forEach(function(id, i) {
    setTimeout(function() {
      try { minimizeWindow(id); } catch(e){}
    }, i * stagger);
  });
  setTimeout(function() {
    if (typeof updateMenuBarForWindow === 'function') updateMenuBarForWindow(null);
  }, ids.length * stagger + 400);
}

// ===== CLOCK =====
function updateClock() {
  const now = new Date();
  const raw = now.getHours();
  const ampm = raw >= 12 ? 'PM' : 'AM';
  const h = (raw % 12 || 12).toString().padStart(2,'0');
  const m = now.getMinutes().toString().padStart(2,'0');
  const hEl = document.getElementById('clock-h');
  const mEl = document.getElementById('clock-m');
  const apEl = document.getElementById('clock-ampm');
  if (hEl) hEl.textContent = h;
  if (mEl) mEl.textContent = m;
  if (apEl) apEl.textContent = ampm;
  document.getElementById('clock-date').textContent = now.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
  document.getElementById('menubar-time').textContent = now.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' }) + ' ' + now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

// Battery percentage
if (navigator.getBattery) {
  navigator.getBattery().then(bat => {
    function updateBat() {
      const pct = Math.round(bat.level * 100);
      const icon = bat.charging ? '⚡' : (pct > 20 ? '🔋' : '🪫');
      document.getElementById('menubar-battery').textContent = icon + ' ' + pct + '%';
    }
    updateBat();
    bat.addEventListener('levelchange', updateBat);
    bat.addEventListener('chargingchange', updateBat);
  });
}

// ===== WINDOW MANAGEMENT =====
let activeZ = 100;
const openWindows = {};
const windowStates = {};

function findSmartPosition(win) {
  var menuH = 28, dockH = 80, pad = 20;
  var winW = parseInt(win.style.width) || 700;
  var winH = parseInt(win.style.height) || 560;
  var maxRight = window.innerWidth - pad;
  var maxBottom = window.innerHeight - dockH;

  // Collect open window rects
  var rects = [];
  document.querySelectorAll('.window.open').forEach(function(w) {
    if (w === win) return;
    rects.push({
      x: parseInt(w.style.left) || w.offsetLeft,
      y: parseInt(w.style.top) || w.offsetTop,
      w: w.offsetWidth, h: w.offsetHeight
    });
  });

  // No windows? center it
  if (rects.length === 0) {
    return {
      top: menuH + Math.max(0, (maxBottom - menuH - winH) / 2),
      left: pad + Math.max(0, (maxRight - pad - winW) / 2)
    };
  }

  // 1st priority: find ZERO overlap position (fine grid scan)
  var best = null, bestOverlap = Infinity;
  for (var y = menuH + pad; y + winH <= maxBottom; y += 30) {
    for (var x = pad; x + winW <= maxRight; x += 30) {
      var overlap = 0;
      for (var i = 0; i < rects.length; i++) {
        var r = rects[i];
        var ox = Math.max(0, Math.min(x + winW, r.x + r.w) - Math.max(x, r.x));
        var oy = Math.max(0, Math.min(y + winH, r.y + r.h) - Math.max(y, r.y));
        overlap += ox * oy;
        if (overlap >= bestOverlap) break;
      }
      if (overlap < bestOverlap) {
        bestOverlap = overlap;
        best = {top: y, left: x};
        if (overlap === 0) return best;
      }
    }
  }

  // If minimal overlap found, use it
  if (best && bestOverlap < winW * winH * 0.1) return best;

  // 2nd priority: auto-tile all windows to make room
  var allOpen = [];
  document.querySelectorAll('.window.open').forEach(function(w) {
    if (w === win && !w.classList.contains('fullscreen-space')) return;
    if (w.classList.contains('fullscreen-space')) return;
    allOpen.push(w);
  });
  var totalWins = allOpen.length + 1; // including new window
  var areaW = maxRight - pad;
  var areaH = maxBottom - menuH - pad;

  // Calculate grid: try to fit windows in rows/cols
  var cols = Math.ceil(Math.sqrt(totalWins));
  var rows = Math.ceil(totalWins / cols);
  var cellW = Math.floor(areaW / cols);
  var cellH = Math.floor(areaH / rows);
  var minW = 600, minH = 480;
  // Max 6 windows tiled
  if (totalWins > 6) {
    var off = 42;
    var last2 = rects[rects.length - 1];
    var cx2 = last2.x + off, cy2 = last2.y + off;
    if (cx2 + winW > maxRight) cx2 = pad;
    if (cy2 + winH > maxBottom) cy2 = menuH + pad;
    for (var j = 0; j < rects.length; j++) {
      if (Math.abs(rects[j].x - cx2) < 10 && Math.abs(rects[j].y - cy2) < 10) {
        cx2 += off; cy2 += off;
        if (cx2 + winW > maxRight) cx2 = pad;
        if (cy2 + winH > maxBottom) cy2 = menuH + pad;
      }
    }
    return {top: cy2, left: cx2};
  }

  // Only rearrange if cells are big enough
  if (cellW >= minW && cellH >= minH) {
    // Any window whose CSS min-width can't fit in the current tile cell gets
    // pulled out of the tile grid and sent to the back, keeping its full size.
    // Iterate until no more windows need to be removed (removing one may shrink
    // the cell further depending on grid reshape — but reshape here grows cellW
    // so a single pass is usually enough, still loop to be safe).
    var bumped = true;
    while (bumped && allOpen.length > 0) {
      bumped = false;
      for (var bI = allOpen.length - 1; bI >= 0; bI--) {
        var bW = allOpen[bI];
        var bMinW = parseInt(getComputedStyle(bW).minWidth) || 0;
        if (bMinW > 0 && cellW < bMinW) {
          allOpen.splice(bI, 1);
          bW.style.zIndex = 1;
          totalWins = allOpen.length + 1;
          cols = Math.ceil(Math.sqrt(totalWins));
          rows = Math.ceil(totalWins / cols);
          cellW = Math.floor(areaW / cols);
          cellH = Math.floor(areaH / rows);
          bumped = true;
          break;
        }
      }
    }
    var idx = 0;
    allOpen.forEach(function(w) {
      var col = idx % cols;
      var row = Math.floor(idx / cols);
      w.style.transition = 'all 0.35s cubic-bezier(0.25, 1, 0.5, 1)';
      w.style.left = (pad + col * cellW) + 'px';
      w.style.top = (menuH + pad + row * cellH) + 'px';
      w.style.width = (cellW - 8) + 'px';
      w.style.height = (cellH - 8) + 'px';
      setTimeout(function() { w.style.transition = ''; }, 400);
      idx++;
    });
    // New window goes in next cell
    var newCol = idx % cols;
    var newRow = Math.floor(idx / cols);
    return {
      top: menuH + pad + newRow * cellH,
      left: pad + newCol * cellW,
      tileW: cellW - 8,
      tileH: cellH - 8
    };
  }

  // 3rd priority: cascade (offset = toolbar height so each titlebar visible)
  var offset = 42;
  var last = rects[rects.length - 1];
  var cx = last.x + offset;
  var cy = last.y + offset;
  if (cx + winW > maxRight) cx = pad;
  if (cy + winH > maxBottom) cy = menuH + pad;
  // Avoid landing exactly on another window
  for (var i = 0; i < rects.length; i++) {
    if (Math.abs(rects[i].x - cx) < 10 && Math.abs(rects[i].y - cy) < 10) {
      cx += offset; cy += offset;
      if (cx + winW > maxRight) cx = pad;
      if (cy + winH > maxBottom) cy = menuH + pad;
    }
  }
  return {top: cy, left: cx};
}

function openWindow(id, skipPosition) {
  const win = document.getElementById('win-' + id);
  if (!win) return;

  // If in fullscreen space and opening a different window, exit fullscreen first
  if (document.body.classList.contains('has-fullscreen') && typeof fullscreenState !== 'undefined') {
    var fsWinId = Object.keys(fullscreenState)[0];
    if (fsWinId && fsWinId !== id) {
      exitFullscreen(fsWinId);
      setTimeout(function() { openWindow(id); }, 600);
      return;
    }
  }

  // Bounce dock icon
  const dockItems = document.querySelectorAll('.dock-item');
  const names = ['about','flutter','speaking','oss','tech','articles','contact','github','linkedin','snake','flutter-course'];
  const idx = names.indexOf(id);
  if (idx >= 0 && dockItems[idx]) {
    dockItems[idx].querySelector('.dock-icon').classList.add('dock-bounce');
    setTimeout(() => dockItems[idx].querySelector('.dock-icon').classList.remove('dock-bounce'), 500);
  }

  if (openWindows[id]) {
    // Already open on THIS desktop, just bring to front
    win.style.zIndex = ++activeZ;
    if (win.classList.contains('minimizing')) {
      win.classList.remove('minimizing');
      win.classList.add('open');
    }
    return;
  }

  // Smart position: find empty space or offset stack (skipped on state restore)
  if (!skipPosition) {
    const pos = findSmartPosition(win);
    win.style.top = pos.top + 'px';
    win.style.left = pos.left + 'px';
    if (pos.tileW && pos.tileH) {
      win.style.width = pos.tileW + 'px';
      win.style.height = pos.tileH + 'px';
    }
  }

  win.classList.remove('closing','minimizing','hidden-desktop');
  win.classList.add('open');
  win.style.zIndex = ++activeZ;
  openWindows[id] = true;

  // Show loader then hide
  const loader = document.getElementById('loader-' + id);
  if (loader) {
    loader.classList.remove('hidden');
    setTimeout(() => loader.classList.add('hidden'), 600 + Math.random() * 400);
  }

  // Special: terminal typing
  if (id === 'about') startTerminal();
  if (id === 'snake') {
    if (typeof snakeLocked !== 'undefined') snakeLocked = false;
    if (typeof snakeReset === 'function') snakeReset();
    if (typeof snakeResizeCanvas === 'function') setTimeout(snakeResizeCanvas, 50);
  }
  if (id === 'flutter-course' && typeof initFlutterCourse === 'function') setTimeout(initFlutterCourse, 50);
  if (id === 'wisesend') {
    var wif = document.getElementById('wisesend-iframe');
    if (wif && wif.dataset.src && wif.src !== wif.dataset.src) wif.src = wif.dataset.src;
  }

  win.addEventListener('mousedown', () => { win.style.zIndex = ++activeZ; updateMenuBarForWindow(id); });

  // Sync dock indicators + menubar
  if (typeof syncDockIndicators === 'function') syncDockIndicators();
  updateMenuBarForWindow(id);
}

function closeWindow(id) {
  const win = document.getElementById('win-' + id);
  if (!win) return;
  if (id === 'snake') snakeReset();
  if (id === 'flutter-course') stopAllFlutterCourseVideos();
  if (id === 'fc-player') { var pif = document.getElementById('fc-pw-iframe'); if (pif) pif.src = ''; fcCurrentVideo = null; }
  win.classList.add('closing');
  setTimeout(() => {
    win.classList.remove('open','closing','hidden-desktop');
    delete openWindows[id];
    if (typeof syncDockIndicators === 'function') syncDockIndicators();
    updateMenuBarForWindow(null);
    // Revert URL to / if the closed window matched the current path
    try {
      if (typeof windowIdFromCurrentUrl === 'function' && windowIdFromCurrentUrl() === id) {
        history.pushState({}, '', '/');
        if (typeof updateMetaForWindow === 'function') updateMetaForWindow(null);
      }
    } catch (e) {}
    }, 250);
}

function minimizeWindow(id) {
  const win = document.getElementById('win-' + id);
  if (!win) return;
  win.classList.add('minimizing');
  setTimeout(() => { win.classList.remove('open'); }, 400);
}

function maximizeWindow(id) {
  const win = document.getElementById('win-' + id);
  if (!win) return;
  if (win.classList.contains('maximized')) {
    win.classList.remove('maximized');
    if (windowStates[id]) {
      Object.assign(win.style, windowStates[id]);
    }
  } else {
    windowStates[id] = {
      top: win.style.top, left: win.style.left,
      width: win.style.width, height: win.style.height
    };
    win.classList.add('maximized');
  }
}

// ===== DRAG =====
let dragEl = null, dragOffX = 0, dragOffY = 0;

function startDrag(e, winId) {
  if (e.target.classList.contains('traffic-light')) return;
  const win = document.getElementById(winId);
  if (win.classList.contains('maximized')) return;
  dragEl = win;
  const rect = win.getBoundingClientRect();
  dragOffX = e.clientX - rect.left;
  dragOffY = e.clientY - rect.top;
  win.style.zIndex = ++activeZ;
  e.preventDefault();
}

var dragRafId = null;
document.addEventListener('mousemove', (e) => {
  if (!dragEl) return;
  if (dragRafId) return;
  var ex = e.clientX, ey = e.clientY;
  dragRafId = requestAnimationFrame(function() {
    dragRafId = null;
    if (!dragEl) return;
    var newLeft = ex - dragOffX;
    var newTop = ey - dragOffY;
    var w = dragEl.offsetWidth;
    var h = dragEl.offsetHeight;
    var dockH = 80, menuH = 28;
    if (newLeft < 0) newLeft = 0;
    if (newLeft + w > window.innerWidth) newLeft = window.innerWidth - w;
    if (newTop < menuH) newTop = menuH;
    if (newTop + h > window.innerHeight - dockH) newTop = window.innerHeight - dockH - h;
    dragEl.style.left = newLeft + 'px';
    dragEl.style.top = newTop + 'px';
    updateSnapPreview(ex, ey);
  });
});

document.addEventListener('mouseup', (e) => {
  if (dragEl && currentSnapZone) {
    const winId = dragEl.id.replace('win-', '');
    snapWindow(winId, currentSnapZone);
  }
  const preview = document.getElementById('snap-preview');
  if (preview) preview.classList.remove('active');
  currentSnapZone = null;
  dragEl = null;
});

// Touch drag for mobile
document.addEventListener('touchmove', (e) => {
  if (!dragEl) return;
  const t = e.touches[0];
  dragEl.style.left = (t.clientX - dragOffX) + 'px';
  dragEl.style.top = (t.clientY - dragOffY) + 'px';
});

document.addEventListener('touchend', () => { dragEl = null; });

// ===== TERMINAL =====
function startTerminal() {
  const term = document.getElementById('terminal-content');
  if (term.children.length > 0) return;

  const lines = [
    { type: 'cmd', text: '<span class="prompt">ishaq@dev</span> <span class="cmd">~</span> $ <span class="cmd">whoami</span>' },
    { type: 'out', text: '' },
    { type: 'out', text: '  <span class="str">name</span>      : Ishaq Hassan' },
    { type: 'out', text: '  <span class="str">role</span>      : Full Stack Developer & Engineering Manager' },
    { type: 'out', text: '  <span class="str">focus</span>     : Flutter Framework | Mobile Development' },
    { type: 'out', text: '  <span class="str">company</span>   : DigitalHire (world\'s first integrated talent engine)' },
    { type: 'out', text: '  <span class="str">years</span>     : 13+ years in software development' },
    { type: 'out', text: '  <span class="str">location</span>  : Karachi, Pakistan 🇵🇰' },
    { type: 'out', text: '' },
    { type: 'cmd', text: '<span class="prompt">ishaq@dev</span> <span class="cmd">~</span> $ <span class="cmd">cat</span> <span class="flag">achievements.md</span>' },
    { type: 'out', text: '' },
    { type: 'out', text: '  ✅ <span class="str">6 PRs merged</span> into Flutter (official framework)' },
    { type: 'out', text: '  ✅ <span class="str">Flutter course</span> listed on official Flutter docs' },
    { type: 'out', text: '  ✅ <span class="str">10+ speaking events</span> at GDG, Nest I/O, universities' },
    { type: 'out', text: '  ✅ <span class="str">GDG Kolachi Mentor</span> & community leader' },
    { type: 'out', text: '  ✅ <span class="str">9,800+ contributions</span> on GitHub' },
    { type: 'out', text: '  ✅ <span class="str">document_scanner_flutter</span> 63 stars, 135 forks' },
    { type: 'out', text: '' },
    { type: 'cmd', text: '<span class="prompt">ishaq@dev</span> <span class="cmd">~</span> $ <span class="cmd">echo</span> <span class="str">"Building Flutter from the inside out."</span>' },
    { type: 'out', text: '  Building Flutter from the inside out.' },
    { type: 'out', text: '' },
    { type: 'cmd', text: '<span class="prompt">ishaq@dev</span> <span class="cmd">~</span> $ <span class="cursor"></span>' },
  ];

  let i = 0;
  function addLine() {
    if (i >= lines.length) return;
    const div = document.createElement('div');
    div.className = 'terminal-line';
    div.innerHTML = lines[i].text;
    div.style.animationDelay = '0s';
    div.style.opacity = '1';
    term.appendChild(div);
    term.parentElement.scrollTop = term.parentElement.scrollHeight;
    i++;
    setTimeout(addLine, lines[i-1].type === 'cmd' ? 400 : 80);
  }
  setTimeout(addLine, 300);
}

// ===== LINKEDIN TABS =====
function switchLiTab(tab) {
  document.querySelectorAll('.li-panel').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.li-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('li-' + tab).style.display = 'block';
  event.target.classList.add('active');
}

// ===== SOUND EFFECTS =====
const sfxClick = new Audio('assets/music/click.mp3');
const sfxHover = new Audio('assets/music/hover.mp3');
sfxClick.volume = 0.3;
sfxHover.volume = 0.15;

function playSfx(sfx) {
  sfx.currentTime = 0;
  sfx.play().catch(() => {});
}

document.addEventListener('click', (e) => {
  const target = e.target.closest('.dock-item, .traffic-light, .menu-dd-item, .music-btn, .weather-permit-btn, .about-close, .widget, .snap-menu-item, .exit-fullscreen');
  if (target) playSfx(sfxClick);
});

document.addEventListener('mouseenter', (e) => {
  if (!e.target.closest) return;
  const target = e.target.closest('.dock-item, .traffic-light, .menu-parent, .menu-dd-item:not(.disabled)');
  if (target) playSfx(sfxHover);
}, true);

// ===== FLUTTER COURSE =====
const fcVideos = [
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
  {id:'b_MPN5n8g6o',t:'Deploying Flutter Web / Github Actions',s:'Advanced'}
];
const fcSectionOrder = ['Foundation','Dart Basics','OOP','Flutter UI','State Management','API & Network','Advanced'];
let fcCurrentVideo = null;
let fcGridRendered = false;

function initFlutterCourse() {
  if (!fcGridRendered) {
    renderFlutterCourseGrid();
    fcGridRendered = true;
  }
  fcInitHeroScroll();
}

/* Hero scroll-collapse: listens to .fc-sections scroll, toggles .fc-header-compact
   with hysteresis (collapse at 28px, expand at 8px). Drives --fc-scroll CSS var
   for parallax orb AND scroll-progress bar (0→1 mapped to full scroll range). */
function fcInitHeroScroll() {
  var win = document.getElementById('win-flutter-course');
  if (!win) return;
  var sections = win.querySelector('.fc-sections');
  var header = win.querySelector('.fc-header');
  if (!sections || !header || sections._fcHeroBound) return;
  sections._fcHeroBound = true;

  // Inject scroll progress bar (thin cyan neon line at bottom of header)
  if (!header.querySelector('.fc-header-progress')) {
    var bar = document.createElement('div');
    bar.className = 'fc-header-progress';
    header.appendChild(bar);
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    setTimeout(function() {
      var st = sections.scrollTop;
      var maxScroll = Math.max(1, sections.scrollHeight - sections.clientHeight);
      // Parallax ratio (0-120px range, for orb)
      var orbRatio = Math.min(1, Math.max(0, st / 120));
      // Progress ratio (full scroll range, for progress bar)
      var progressRatio = Math.min(1, Math.max(0, st / maxScroll));
      header.style.setProperty('--fc-scroll', orbRatio.toFixed(3));
      var progressEl = header.querySelector('.fc-header-progress');
      if (progressEl) progressEl.style.setProperty('--fc-scroll', progressRatio.toFixed(3));
      ticking = false;
    }, 16);
  }
  sections.addEventListener('scroll', onScroll, { passive: true });
}

function fcGroupVideos() {
  const groups = {};
  fcVideos.forEach((v, i) => {
    if (!groups[v.s]) groups[v.s] = [];
    groups[v.s].push({...v, idx: i});
  });
  return groups;
}

function renderFlutterCourseGrid() {
  const c = document.getElementById('fc-sections-container');
  if (!c) return;
  const g = fcGroupVideos();
  c.innerHTML = fcSectionOrder.filter(s => g[s]).map(s => {
    const vids = g[s];
    const iconKey = (typeof FC_SECTION_ICONS !== 'undefined' && FC_SECTION_ICONS[s]) || 'play';
    const iconSvg = (typeof FSHELL_ICONS !== 'undefined' && FSHELL_ICONS[iconKey]) || '';
    return '<div class="fc-section"><div class="fc-section-header" onclick="this.parentElement.classList.toggle(\'collapsed\')"><div class="fc-sh-left"><span class="fc-sh-icon">' + iconSvg + '</span><span class="fc-sh-title">' + s + '</span></div><div class="fc-section-right"><span class="fc-section-count"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="margin-right:4px;vertical-align:-1px;"><polygon points="6 4 20 12 6 20 6 4"/></svg>' + vids.length + ' videos</span><span class="fc-collapse-icon"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></span></div></div><div class="fc-videos-grid">' + vids.map(v =>
      '<div class="fc-video-card" onclick="playFcVideo(' + v.idx + ')"><div class="fc-thumb-wrap"><img class="fc-video-thumbnail" src="https://img.youtube.com/vi/' + v.id + '/mqdefault.jpg" alt="" loading="lazy"><span class="fc-vid-badge">#' + (v.idx + 1) + '</span><div class="fc-play-overlay"><div class="fc-play-icon"></div></div></div><div class="fc-video-info"><div class="fc-video-num">Video ' + (v.idx + 1) + '</div><div class="fc-video-title">' + v.t + '</div></div></div>'
    ).join('') + '</div></div>';
  }).join('');
}

function stopAllVideoIframes() {
  var mfcIframe = document.querySelector('.mfc-player-iframe');
  if (mfcIframe) mfcIframe.src = '';
  var fcIframe = document.getElementById('fc-pw-iframe');
  if (fcIframe) fcIframe.src = '';
}

function playFcVideo(i) {
  if (i < 0 || i >= fcVideos.length) return;
  if (typeof musicPlaying !== 'undefined' && musicPlaying && typeof toggleMusic === 'function') toggleMusic();
  stopAllVideoIframes();
  fcCurrentVideo = i;
  var v = fcVideos[i];

  // Open/update standalone player window
  if (!openWindows['fc-player']) {
    openWindow('fc-player');
  } else {
    var pw = document.getElementById('win-fc-player');
    if (pw) pw.style.zIndex = ++activeZ;
  }

  // Update player content
  var startTime = getVideoProgress(i);
  var $ = function(id) { return document.getElementById(id); };
  if ($('fc-pw-iframe')) $('fc-pw-iframe').src = 'https://www.youtube.com/embed/' + v.id + '?autoplay=1&rel=0&enablejsapi=1' + (startTime > 5 ? '&start=' + Math.floor(startTime) : '');
  if ($('fc-pw-title')) $('fc-pw-title').textContent = v.t;
  if ($('fc-pw-counter')) $('fc-pw-counter').textContent = (i + 1) + ' / ' + fcVideos.length;
  if ($('fc-pw-section')) $('fc-pw-section').textContent = v.s;
  if ($('fc-pw-vidnum')) $('fc-pw-vidnum').textContent = v.t;
  if ($('fc-pw-prev')) $('fc-pw-prev').disabled = i === 0;
  if ($('fc-pw-next')) $('fc-pw-next').disabled = i === fcVideos.length - 1;
}

function closeFcPlayer() {
  var iframe = document.getElementById('fc-pw-iframe');
  if (iframe) iframe.src = '';
  fcCurrentVideo = null;
  closeWindow('fc-player');
}

function fcNext() { if (fcCurrentVideo !== null && fcCurrentVideo < fcVideos.length - 1) playFcVideo(fcCurrentVideo + 1); }
function fcPrev() { if (fcCurrentVideo !== null && fcCurrentVideo > 0) playFcVideo(fcCurrentVideo - 1); }

function fcShowPreview(dir) {
  var idx = dir === 'prev' ? (fcCurrentVideo - 1) : (fcCurrentVideo + 1);
  if (idx < 0 || idx >= fcVideos.length) return;
  var v = fcVideos[idx];
  var el = document.getElementById('fc-preview-' + dir);
  var btn = document.getElementById('fc-pw-' + dir);
  if (!btn) return;
  var rect = btn.getBoundingClientRect();
  el.innerHTML = '<div class="fc-nav-preview-thumb"><img src="https://img.youtube.com/vi/' + v.id + '/mqdefault.jpg" alt=""><div class="fc-nav-preview-badge">#' + (idx + 1) + '</div></div>' +
    '<div class="fc-nav-preview-title">' + v.t + '</div>' +
    '<div class="fc-nav-preview-meta">' + v.s + '</div>';
  el.style.left = rect.left + 'px';
  el.style.top = (rect.top - 12) + 'px';
  requestAnimationFrame(function() { el.classList.add('show'); });
}

function fcHidePreview(dir) {
  var el = document.getElementById('fc-preview-' + dir);
  el.classList.remove('show');
}

function fcDesktopSearch(q) {
  var query = q.trim().toLowerCase();
  var sections = document.getElementById('fc-sections-container');
  var results = document.getElementById('fc-search-results');
  if (!query) {
    sections.style.display = '';
    results.style.display = 'none';
    results.innerHTML = '';
    return;
  }
  sections.style.display = 'none';
  results.style.display = '';
  var words = query.split(/\s+/);
  var matched = [];
  for (var i = 0; i < fcVideos.length; i++) {
    var v = fcVideos[i];
    var hay = (v.t + ' ' + v.s).toLowerCase();
    var ok = true;
    for (var w = 0; w < words.length; w++) {
      if (hay.indexOf(words[w]) === -1) { ok = false; break; }
    }
    if (ok) matched.push({v: v, i: i});
  }
  if (matched.length === 0) {
    results.innerHTML = '<div class="fc-search-empty">No videos found for "' + q.replace(/</g,'&lt;') + '"</div>';
    return;
  }
  results.innerHTML = matched.map(function(m) {
    var title = m.v.t;
    for (var w = 0; w < words.length; w++) {
      var re = new RegExp('(' + words[w].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      title = title.replace(re, '<mark>$1</mark>');
    }
    return '<div class="fc-search-result" onclick="fcDesktopSearchClear();playFcVideo(' + m.i + ')">' +
      '<div class="fc-search-result-thumb"><img src="https://img.youtube.com/vi/' + m.v.id + '/mqdefault.jpg" alt="" loading="lazy"><div class="fc-search-result-num">#' + (m.i + 1) + '</div></div>' +
      '<div class="fc-search-result-info"><div class="fc-search-result-title">' + title + '</div><div class="fc-search-result-meta">' + m.v.s + ' · Video ' + (m.i + 1) + '</div></div></div>';
  }).join('');
}

function fcDesktopSearchClear() {
  var input = document.getElementById('fc-search-input');
  if (input) input.value = '';
  fcDesktopSearch('');
}

// ===== MOBILE FLUTTER COURSE =====
function renderMobileFlutterCourseGrid() {
  const c = document.getElementById('mfc-content');
  if (!c) return;

  // Hero banner (first video thumbnail)
  var hero = '<div class="mfc-hero"><img src="https://img.youtube.com/vi/' + fcVideos[0].id + '/maxresdefault.jpg" alt="" loading="lazy"><div class="mfc-hero-gradient"></div></div>';

  // Playlist info
  var info = '<div class="mfc-playlist-info">' +
    '<div class="mfc-playlist-title">Flutter: Basic to Advanced</div>' +
    '<a class="mfc-playlist-channel" href="https://www.youtube.com/@ishaquehassan" target="_blank">' +
      '<div class="mfc-channel-avatar"><img src="assets/tech/flutter.svg" width="18" height="18"></div>' +
      '<span>by Tech Idara</span>' +
    '</a>' +
    '<div class="mfc-playlist-meta">Playlist · 35 videos · Urdu · 7 sections</div>' +
    '<a href="https://docs.flutter.dev/resources/courses" target="_blank" class="mfc-verified-inline"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="#54c5f8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#54c5f8" stroke-width="2"/></svg> Official Flutter Docs</a>' +
  '</div>';

  // Play all + actions row
  var actions = '<div class="mfc-actions-row">' +
    '<button class="mfc-play-all" onclick="playMfcVideo(0)"><svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg> Play all</button>' +
    '<a href="https://www.youtube.com/playlist?list=PLX97VxArfzkmXeUqUxeKW7XS8oYraH7A5" target="_blank" class="mfc-action-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg></a>' +
  '</div>';

  // Video list (flat, no sections)
  var list = fcVideos.map(function(v, i) {
    return '<div class="mfc-list-item" onclick="playMfcVideo(' + i + ',event)">' +
      '<div class="mfc-list-num">' + (i + 1) + '</div>' +
      '<div class="mfc-list-thumb"><img src="https://img.youtube.com/vi/' + v.id + '/mqdefault.jpg" alt="" loading="lazy"></div>' +
      '<div class="mfc-list-info"><div class="mfc-list-title">' + v.t + '</div><div class="mfc-list-meta">Tech Idara · ' + v.s + '</div></div>' +
    '</div>';
  }).join('');

  c.innerHTML = hero + info + actions + '<div class="mfc-list-divider"></div>' + list;
}

function playMfcVideo(i, evt) {
  if (i < 0 || i >= fcVideos.length) return;
  if (typeof musicPlaying !== 'undefined' && musicPlaying && typeof toggleMusic === 'function') toggleMusic();
  stopAllVideoIframes();
  var isFirstPlay = fcCurrentVideo === null;
  if (isFirstPlay) history.pushState({mfcVideo: true}, '');
  fcCurrentVideo = i;
  const v = fcVideos[i];
  const c = document.getElementById('mfc-content');
  document.getElementById('mfc-title').textContent = 'Flutter Course';

  // Shared element transition from tapped card
  if (evt && isFirstPlay) {
    var src = evt.currentTarget || evt.target.closest('.mfc-card');
    if (src) {
      var r = src.getBoundingClientRect();
      var cx = r.left + r.width / 2;
      var cy = r.top + r.height / 2;
      c.style.transformOrigin = cx + 'px ' + cy + 'px';
      c.style.animation = 'none';
      c.offsetHeight;
      c.style.animation = 'mfcPlayerIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards';
    }
  }
  // Build up-next list (prev + next 3)
  var upNext = '';
  var startIdx = Math.max(0, i - 1);
  var endIdx = Math.min(fcVideos.length, i + 4);
  for (var j = startIdx; j < endIdx; j++) {
    if (j === i) continue;
    var uv = fcVideos[j];
    upNext += '<div class="mfc-upnext-item" onclick="playMfcVideo(' + j + ')"><img src="https://img.youtube.com/vi/' + uv.id + '/mqdefault.jpg" alt="" loading="lazy"><div class="mfc-upnext-info"><div class="mfc-upnext-title">' + uv.t + '</div><div class="mfc-upnext-meta">' + uv.s + ' · Video ' + (j + 1) + '</div></div></div>';
  }

  c.innerHTML = '<div class="mfc-player">' +
    '<iframe class="mfc-player-iframe" src="https://www.youtube.com/embed/' + v.id + '?autoplay=1&rel=0&playsinline=1&enablejsapi=1' + (getVideoProgress(i) > 5 ? '&start=' + Math.floor(getVideoProgress(i)) : '') + '" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>' +
    '<div class="mfc-player-info">' +
      '<div class="mfc-player-title">' + v.t + '</div>' +
      '<div class="mfc-player-meta"><span class="mfc-player-counter">' + v.s + ' · Video ' + (i + 1) + ' of ' + fcVideos.length + '</span></div>' +
    '</div>' +
    '<a class="mfc-channel-row" href="https://www.youtube.com/@ishaquehassan" target="_blank">' +
      '<div class="mfc-channel-avatar"><img src="assets/tech/flutter.svg" width="18" height="18"></div>' +
      '<div class="mfc-channel-name">Tech Idara</div>' +
      '<a href="https://www.youtube.com/playlist?list=PLX97VxArfzkmXeUqUxeKW7XS8oYraH7A5" target="_blank" class="mfc-section-pill-m" onclick="event.stopPropagation()">Flutter Course</a>' +
    '</a>' +
    '<div class="mfc-player-actions">' +
      '<button onclick="playMfcVideo(' + (i - 1) + ')"' + (i === 0 ? ' disabled' : '') + '><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>Prev</button>' +
      '<button onclick="playMfcVideo(' + (i + 1) + ')"' + (i === fcVideos.length - 1 ? ' disabled' : '') + '>Next<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></button>' +
    '</div>' +
    '<div class="mfc-player-divider"></div>' +
    '<div class="mfc-upnext-header">Up next</div>' +
    upNext +
  '</div>';
}

// Fix: YouTube fullscreen exit on mobile can break the expanded section view
document.addEventListener('fullscreenchange', fcFullscreenFix);
document.addEventListener('webkitfullscreenchange', fcFullscreenFix);
function fcFullscreenFix() {
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    var expanded = document.getElementById('mobile-flutter-course-expanded');
    if (expanded && expanded.style.display === 'block') {
      expanded.style.zIndex = '1001';
      expanded.style.position = 'fixed';
      expanded.style.inset = '0';
      window.scrollTo(0, 0);
    }
  }
}

function mobileFlutterCourseBack() {
  if (fcCurrentVideo !== null) {
    var c = document.getElementById('mfc-content');
    if (c) {
      c.style.animation = 'mfcPlayerOut 0.3s cubic-bezier(0.4,0,0.2,1) forwards';
      setTimeout(function() {
        fcCurrentVideo = null;
        document.getElementById('mfc-title').textContent = 'Flutter Course';
        renderMobileFlutterCourseGrid();
        c.style.animation = '';
        c.style.transformOrigin = '';
      }, 300);
    }
  } else {
    closeMobileSection('flutter-course');
  }
}

// ===== MOBILE FLUTTER COURSE SEARCH =====
function openMfcSearch() {
  var screen = document.getElementById('mfc-search-screen');
  if (!screen) return;
  screen.style.display = 'flex';
  history.pushState({mfcSearch: true}, '');
  var input = document.getElementById('mfc-search-input');
  if (input) { input.value = ''; input.focus(); }
  // Show all videos as suggestions
  filterMfcSearch('');
}

function closeMfcSearch() {
  var screen = document.getElementById('mfc-search-screen');
  if (screen) screen.style.display = 'none';
}

function filterMfcSearch(q) {
  var results = document.getElementById('mfc-search-results');
  if (!results) return;
  var query = q.toLowerCase().trim();
  var searchIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>';

  if (!query) {
    // Show suggestions (all video titles)
    results.innerHTML = '<div style="padding:12px 16px;font-size:12px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:1px;">Suggestions</div>' +
      fcVideos.map(function(v, i) {
        return '<div class="mfc-search-item" onclick="closeMfcSearch();playMfcVideo(' + i + ')">' +
          '<div class="mfc-search-item-icon">' + searchIcon + '</div>' +
          '<div class="mfc-search-item-text">' + v.t + '</div>' +
          '<img class="mfc-search-item-thumb" src="https://img.youtube.com/vi/' + v.id + '/mqdefault.jpg" alt="" loading="lazy">' +
        '</div>';
      }).join('');
  } else {
    // Filter and show results with thumbnails
    var filtered = fcVideos.map(function(v, i) { return {v: v, i: i}; }).filter(function(item) {
      return item.v.t.toLowerCase().indexOf(query) !== -1 || item.v.s.toLowerCase().indexOf(query) !== -1;
    });
    if (filtered.length === 0) {
      results.innerHTML = '<div style="padding:40px 16px;text-align:center;color:rgba(255,255,255,0.3);font-size:14px;">No videos found</div>';
    } else {
      results.innerHTML = filtered.map(function(item) {
        return '<div class="mfc-search-result-item" onclick="closeMfcSearch();playMfcVideo(' + item.i + ')">' +
          '<img src="https://img.youtube.com/vi/' + item.v.id + '/mqdefault.jpg" alt="" loading="lazy">' +
          '<div class="mfc-search-result-info"><div class="mfc-search-result-title">' + item.v.t + '</div><div class="mfc-search-result-meta">' + item.v.s + ' · Video ' + (item.i + 1) + '</div></div>' +
        '</div>';
      }).join('');
    }
  }
}

function stopAllFlutterCourseVideos() {
  var fcPlayer = document.getElementById('fc-pw-iframe');
  if (fcPlayer) fcPlayer.src = '';
  var mfcIframe = document.querySelector('.mfc-player-iframe');
  if (mfcIframe) mfcIframe.src = '';
}

/* ===== SPOTLIGHT SEARCH ===== */
var spotlightOpen = false;
var spotlightIdx = -1;
var spotlightFiltered = [];

var spotlightIndex = [
  // Applications
  {t:'About Me',s:'Terminal, Profile, System Info',w:'about',cat:'Applications',icon:'💻',p:100},
  {t:'Flutter PRs',s:'Framework Contributions, Merged Pull Requests',w:'flutter',cat:'Applications',icon:'💙',p:100},
  {t:'Speaking & Community',s:'Events, Conferences, GDG',w:'speaking',cat:'Applications',icon:'🎤',p:100},
  {t:'Open Source',s:'GitHub Repos, Packages, Plugins',w:'oss',cat:'Applications',icon:'📦',p:100},
  {t:'Tech Stack',s:'Technologies, Skills, Languages',w:'tech',cat:'Applications',icon:'⚙️',p:100},
  {t:'Medium',s:'Blog Posts, Articles, Writing',w:'articles',cat:'Applications',icon:'📝',p:100},
  {t:'Contact',s:'Email, Social Links',w:'contact',cat:'Applications',icon:'✉️',p:100},
  {t:'GitHub',s:'Profile, Repositories, Contributions',w:'github',cat:'Applications',icon:'🐙',p:100},
  {t:'LinkedIn',s:'Professional Profile, Network',w:'linkedin',cat:'Applications',icon:'💼',p:100},
  {t:'Snake Game',s:'Neon Arcade Game',w:'snake',cat:'Applications',icon:'🎮',p:100},
  {t:'Flutter Course',s:'35 Videos, Urdu, Tech Idara',w:'flutter-course',cat:'Applications',icon:'🎬',p:100},

  // Flutter PRs
  {t:'Fix LicenseRegistry docs to reference NOTICES',s:'Flutter PR #184572, Merged',w:'flutter',cat:'Contributions',icon:'🔀',el:'#win-flutter .pr-card:nth-child(1)',p:70},
  {t:'Add disposal guidance to CurvedAnimation and CurveTween docs',s:'Flutter PR #184569, Merged',w:'flutter',cat:'Contributions',icon:'🔀',el:'#win-flutter .pr-card:nth-child(2)',p:70},
  {t:'Add clipBehavior parameter to AnimatedCrossFade',s:'Flutter PR #184545, Merged',w:'flutter',cat:'Contributions',icon:'🔀',el:'#win-flutter .pr-card:nth-child(3)',p:70},
  {t:'Add scrollPadding property to DropdownMenu',s:'Flutter PR #183109, Merged',w:'flutter',cat:'Contributions',icon:'🔀',el:'#win-flutter .pr-card:nth-child(4)',p:70},
  {t:'Fix RouteAware.didPushNext documentation inaccuracy',s:'Flutter PR #183097, Merged',w:'flutter',cat:'Contributions',icon:'🔀',el:'#win-flutter .pr-card:nth-child(5)',p:70},
  {t:'Use double quotes in settings.gradle.kts template',s:'Flutter PR #183081, Merged',w:'flutter',cat:'Contributions',icon:'🔀',el:'#win-flutter .pr-card:nth-child(6)',p:70},
  {t:'Suppress browser word-selection in SelectableText on web right-click',s:'Flutter PR #183110, Open',w:'flutter',cat:'Contributions',icon:'🔀',el:'#win-flutter .pr-card:nth-child(7)',p:70},
  {t:'Guard auto-scroll against Offset.infinite',s:'Flutter PR #183079, Open',w:'flutter',cat:'Contributions',icon:'🔀',el:'#win-flutter .pr-card:nth-child(8)',p:70},
  {t:'Reset AppBar _scrolledUnder flag when scroll context changes',s:'Flutter PR #183062, Open',w:'flutter',cat:'Contributions',icon:'🔀',el:'#win-flutter .pr-card:nth-child(9)',p:70},

  // Speaking Events
  {t:'DevFest Karachi',s:'GDG Kolachi, Panel Speaker',w:'speaking',cat:'Events',icon:'🎯',el:'#win-speaking .event-row:nth-child(1)',p:70},
  {t:'Google I/O Extended Karachi',s:'GDG Kolachi, Speaker',w:'speaking',cat:'Events',icon:'🌐',el:'#win-speaking .event-row:nth-child(2)',p:70},
  {t:'Flutter Bootcamp',s:'GDG Kolachi, Instructor, Aug 2021',w:'speaking',cat:'Events',icon:'🎓',el:'#win-speaking .event-row:nth-child(3)',p:70},
  {t:'Facebook Developer Circle',s:'The Nest I/O, Inaugural Speaker',w:'speaking',cat:'Events',icon:'🚀',el:'#win-speaking .event-row:nth-child(4)',p:70},
  {t:'Code to Create',s:'NIC Karachi, Speaker',w:'speaking',cat:'Events',icon:'💻',el:'#win-speaking .event-row:nth-child(5)',p:70},
  {t:'Flutter Seminar',s:'Iqra University, Speaker',w:'speaking',cat:'Events',icon:'🏫',el:'#win-speaking .event-row:nth-child(6)',p:70},
  {t:'Women Tech Makers',s:'DHA Suffa University, Speaker',w:'speaking',cat:'Events',icon:'👩‍💻',el:'#win-speaking .event-row:nth-child(7)',p:70},
  {t:'DevNCode Meetup IV: AI',s:'The Nest I/O, Speaker',w:'speaking',cat:'Events',icon:'🤖',el:'#win-speaking .event-row:nth-child(8)',p:70},
  {t:"Pakistan's First Flutter Meetup",s:'Karachi, 2018, Speaker',w:'speaking',cat:'Events',icon:'🏆',el:'#win-speaking .event-row:nth-child(9)',p:70},
  {t:'GDG Live Pakistan',s:'Online, Speaker',w:'speaking',cat:'Events',icon:'🌐',el:'#win-speaking .event-row:nth-child(10)',p:70},

  // OSS Projects
  {t:'document_scanner_flutter',s:'Flutter plugin for document scanning, 63 stars',w:'oss',cat:'Projects',icon:'📸',el:'#win-oss .pr-card:nth-child(1)',p:70},
  {t:'flutter_alarm_background_trigger',s:'Native Kotlin alarm plugin, 13 stars',w:'oss',cat:'Projects',icon:'⏰',el:'#win-oss .pr-card:nth-child(2)',p:70},
  {t:'assets_indexer',s:'Auto-generate asset references, 9 stars',w:'oss',cat:'Projects',icon:'📁',el:'#win-oss .pr-card:nth-child(3)',p:70},
  {t:'nadra_verisys_flutter',s:'NADRA CNIC KYC verification, 3 stars',w:'oss',cat:'Projects',icon:'🪪',el:'#win-oss .pr-card:nth-child(4)',p:70},
  {t:'goal-agent',s:'AI goal tracking agent',w:'oss',cat:'Projects',icon:'🎯',el:'#win-oss .pr-card:nth-child(5)',p:70},

  // Tech Stack
  {t:'Flutter',s:'Mobile Development',w:'tech',cat:'Technology',icon:'💙',p:60},
  {t:'Dart',s:'Mobile Development',w:'tech',cat:'Technology',icon:'🎯',p:60},
  {t:'Android',s:'Mobile Development',w:'tech',cat:'Technology',icon:'🤖',p:60},
  {t:'iOS',s:'Mobile Development',w:'tech',cat:'Technology',icon:'📱',p:60},
  {t:'Kotlin',s:'Mobile Development',w:'tech',cat:'Technology',icon:'🟣',p:60},
  {t:'Swift',s:'Mobile Development',w:'tech',cat:'Technology',icon:'🧡',p:60},
  {t:'React Native',s:'Mobile Development',w:'tech',cat:'Technology',icon:'⚛️',p:60},
  {t:'Firebase',s:'Backend & Cloud',w:'tech',cat:'Technology',icon:'🔥',p:60},
  {t:'Node.js',s:'Backend & Cloud',w:'tech',cat:'Technology',icon:'🟢',p:60},
  {t:'NestJS',s:'Backend & Cloud',w:'tech',cat:'Technology',icon:'🐈',p:60},
  {t:'Next.js',s:'Backend & Cloud',w:'tech',cat:'Technology',icon:'▲',p:60},
  {t:'Python',s:'Backend & Cloud',w:'tech',cat:'Technology',icon:'🐍',p:60},
  {t:'PHP',s:'Backend & Cloud',w:'tech',cat:'Technology',icon:'🐘',p:60},
  {t:'Spring Boot',s:'Backend & Cloud',w:'tech',cat:'Technology',icon:'🍃',p:60},
  {t:'Go',s:'Backend & Cloud',w:'tech',cat:'Technology',icon:'🐹',p:60},
  {t:'PostgreSQL',s:'Database',w:'tech',cat:'Technology',icon:'🐘',p:60},
  {t:'MySQL',s:'Database',w:'tech',cat:'Technology',icon:'🗄️',p:60},
  {t:'Git',s:'Tools & DevOps',w:'tech',cat:'Technology',icon:'📂',p:60},
  {t:'GitHub Actions',s:'Tools & DevOps, CI/CD',w:'tech',cat:'Technology',icon:'⚡',p:60},
  {t:'Docker',s:'Tools & DevOps, Containers',w:'tech',cat:'Technology',icon:'🐳',p:60},
  {t:'Linux',s:'Tools & DevOps, Server',w:'tech',cat:'Technology',icon:'🐧',p:60},
  {t:'Claude AI',s:'Tools & DevOps, AI Assistant',w:'tech',cat:'Technology',icon:'🤖',p:60},

  // Articles
  {t:'Dart Isolates: The Missing Guide',s:'5 min read, Concurrency, Performance',w:'articles',cat:'Articles',icon:'🧩',el:'#win-articles .article-card:nth-child(1)',p:70},
  {t:"Flutter's Three-Tree Architecture",s:'4 min read, Flutter Internals',w:'articles',cat:'Articles',icon:'🌳',el:'#win-articles .article-card:nth-child(2)',p:70},
  {t:"PRs Merged Into Flutter's Repository",s:'5 min read, 52 claps, Open Source',w:'articles',cat:'Articles',icon:'🔀',el:'#win-articles .article-card:nth-child(3)',p:70},
  {t:'Flutter Native Plugin Development',s:'3 min read, iOS, Android',w:'articles',cat:'Articles',icon:'📱',el:'#win-articles .article-card:nth-child(4)',p:70},
  {t:'Indexing Assets in a Dart Class',s:'4 min read, Nerd For Tech',w:'articles',cat:'Articles',icon:'📁',el:'#win-articles .article-card:nth-child(5)',p:70},
  {t:'Firebase Cloud Functions Using Kotlin',s:'3 min read, Firebase, Kotlin',w:'articles',cat:'Articles',icon:'🔥',el:'#win-articles .article-card:nth-child(6)',p:70},

  // Contact
  {t:'Email',s:'hello@ishaqhassan.dev',w:'contact',cat:'Contact',icon:'📧',p:60},
  {t:'GitHub',s:'@ishaquehassan',w:'contact',cat:'Contact',icon:'🐙',p:60},
  {t:'LinkedIn',s:'@ishaquehassan',w:'contact',cat:'Contact',icon:'💼',p:60},
  {t:'Medium',s:'@ishaqhassan',w:'contact',cat:'Contact',icon:'📰',p:60},
  {t:'Stack Overflow',s:'ishaq-hassan',w:'contact',cat:'Contact',icon:'📊',p:60},
  {t:'Website',s:'ishaqhassan.dev',w:'contact',cat:'Contact',icon:'🌐',p:60}
];

function openSpotlight() {
  if (spotlightOpen) return;
  spotlightOpen = true;
  spotlightIdx = -1;
  var overlay = document.getElementById('spotlight-overlay');
  var input = document.getElementById('spotlight-input');
  overlay.classList.remove('closing');
  overlay.classList.add('open');
  input.value = '';
  input.focus();
  spotlightSearch('');
}

function closeSpotlight() {
  if (!spotlightOpen) return;
  spotlightOpen = false;
  var overlay = document.getElementById('spotlight-overlay');
  overlay.classList.add('closing');
  setTimeout(function() {
    overlay.classList.remove('open', 'closing');
  }, 120);
}

function getSpotlightFullIndex() {
  var full = spotlightIndex.slice();
  if (typeof fcVideos !== 'undefined' && fcVideos.length) {
    for (var i = 0; i < fcVideos.length; i++) {
      full.push({t: fcVideos[i].t, s: fcVideos[i].s + ', Video ' + (i+1), w: 'flutter-course', cat: 'Videos', icon: '🎬', p: 50});
    }
  }
  return full;
}

function spotlightSearch(q) {
  var results = document.getElementById('spotlight-results');
  var query = q.trim().toLowerCase();
  spotlightIdx = -1;

  if (!query) {
    var apps = spotlightIndex.filter(function(item) { return item.cat === 'Applications'; });
    spotlightFiltered = apps;
    results.innerHTML = '<div class="spotlight-cat">Applications</div>' +
      apps.map(function(item, i) {
        return spotlightItemHTML(item, i, '');
      }).join('');
    return;
  }

  var words = query.split(/\s+/);
  var full = getSpotlightFullIndex();
  var scored = [];

  for (var i = 0; i < full.length; i++) {
    var item = full[i];
    var haystack = (item.t + ' ' + item.s).toLowerCase();
    var allMatch = true;
    var score = item.p || 0;

    for (var w = 0; w < words.length; w++) {
      var pos = haystack.indexOf(words[w]);
      if (pos === -1) { allMatch = false; break; }
      if (pos === 0) score += 20;
      else if (haystack.charAt(pos - 1) === ' ' || haystack.charAt(pos - 1) === ',') score += 10;
      else score += 5;
    }

    if (allMatch) scored.push({item: item, score: score});
  }

  scored.sort(function(a, b) { return b.score - a.score; });
  if (scored.length > 30) scored = scored.slice(0, 30);

  if (scored.length === 0) {
    spotlightFiltered = [];
    results.innerHTML = '<div class="spotlight-empty">No results for "' + q.replace(/</g,'&lt;') + '"</div>';
    return;
  }

  var grouped = {};
  var catOrder = [];
  for (var i = 0; i < scored.length; i++) {
    var cat = scored[i].item.cat;
    if (!grouped[cat]) { grouped[cat] = []; catOrder.push(cat); }
    if (grouped[cat].length < 8) grouped[cat].push(scored[i].item);
  }

  spotlightFiltered = [];
  var html = '';
  for (var c = 0; c < catOrder.length; c++) {
    var cat = catOrder[c];
    html += '<div class="spotlight-cat">' + cat + '</div>';
    for (var j = 0; j < grouped[cat].length; j++) {
      var idx = spotlightFiltered.length;
      spotlightFiltered.push(grouped[cat][j]);
      html += spotlightItemHTML(grouped[cat][j], idx, query);
    }
  }
  results.innerHTML = html;
}

function spotlightItemHTML(item, idx, query) {
  var title = item.t;
  if (query) {
    var words = query.split(/\s+/);
    for (var w = 0; w < words.length; w++) {
      var re = new RegExp('(' + words[w].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      title = title.replace(re, '<mark>$1</mark>');
    }
  }
  return '<div class="spotlight-item" data-idx="' + idx + '" onclick="activateSpotlightItem(' + idx + ')" onmouseenter="spotlightIdx=' + idx + ';spotlightHighlight()">' +
    '<div class="spotlight-item-icon">' + item.icon + '</div>' +
    '<div class="spotlight-item-text"><div class="spotlight-item-title">' + title + '</div>' +
    '<div class="spotlight-item-sub">' + item.s + '</div></div>' +
    '<div class="spotlight-item-arrow">›</div></div>';
}

function spotlightKeydown(e) {
  if (e.key === 'Escape') { e.preventDefault(); closeSpotlight(); }
  else if (e.key === 'ArrowDown') { e.preventDefault(); spotlightIdx = Math.min(spotlightIdx + 1, spotlightFiltered.length - 1); spotlightHighlight(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); spotlightIdx = Math.max(spotlightIdx - 1, 0); spotlightHighlight(); }
  else if (e.key === 'Enter') { e.preventDefault(); if (spotlightIdx >= 0) activateSpotlightItem(spotlightIdx); else if (spotlightFiltered.length > 0) activateSpotlightItem(0); }
}

function spotlightHighlight() {
  var items = document.querySelectorAll('.spotlight-item');
  for (var i = 0; i < items.length; i++) {
    items[i].classList.toggle('active', i === spotlightIdx);
  }
  if (spotlightIdx >= 0 && items[spotlightIdx]) {
    items[spotlightIdx].scrollIntoView({block: 'nearest'});
  }
}

function activateSpotlightItem(idx) {
  var item = spotlightFiltered[idx];
  if (!item) return;
  closeSpotlight();

  setTimeout(function() {
    if (window.innerWidth > 768) {
      if (typeof navigate === 'function') navigate(item.w); else openWindow(item.w);
      if (item.el) {
        setTimeout(function() {
          var el = document.querySelector(item.el);
          if (el) {
            el.scrollIntoView({behavior: 'smooth', block: 'center'});
            el.style.transition = 'outline-color 0.3s, outline-offset 0.3s';
            el.style.outline = '2px solid var(--accent)';
            el.style.outlineOffset = '4px';
            el.style.borderRadius = '8px';
            setTimeout(function() {
              el.style.outline = '2px solid transparent';
              el.style.outlineOffset = '0px';
              setTimeout(function() { el.style.outline = ''; el.style.outlineOffset = ''; el.style.borderRadius = ''; el.style.transition = ''; }, 300);
            }, 1200);
          }
        }, 400);
      }
    } else {
      var mobileMap = {about:'about',flutter:'prs',speaking:'speaking',oss:'oss',tech:'tech',articles:'articles',contact:'connect',github:'github',linkedin:'linkedin',snake:'snake','flutter-course':'flutter-course'};
      var section = mobileMap[item.w] || item.w;
      if (typeof expandMobileSection === 'function') expandMobileSection(null, section);
    }
  }, 150);
}

document.addEventListener('keydown', function(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    if (spotlightOpen) closeSpotlight();
    else openSpotlight();
  }
  if (e.key === 'Escape' && spotlightOpen) {
    e.preventDefault();
    closeSpotlight();
  }
});

/* ===== SHOW DESKTOP (macOS style) ===== */
var showDesktopActive = false;
var showDesktopStates = {};

function toggleShowDesktop() {
  showDesktopActive = !showDesktopActive;
  var screenCX = window.innerWidth / 2;
  var screenCY = window.innerHeight / 2;
  var allWins = document.querySelectorAll('.window.open');

  if (showDesktopActive) {
    allWins.forEach(function(win) {
      var rect = win.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var tx = cx < screenCX ? -(rect.right + 60) : (window.innerWidth - rect.left + 60);
      var ty = cy < screenCY ? -(rect.bottom + 60) : (window.innerHeight - rect.top + 60);
      // Weight: push more toward dominant axis
      var dx = Math.abs(cx - screenCX) / screenCX;
      var dy = Math.abs(cy - screenCY) / screenCY;
      if (dx > dy * 1.5) ty = ty * 0.3;
      else if (dy > dx * 1.5) tx = tx * 0.3;
      showDesktopStates[win.id] = {tx: tx, ty: ty};
      win.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s';
      win.style.transform = 'translate(' + tx + 'px,' + ty + 'px)';
      win.style.opacity = '0';
      win.style.pointerEvents = 'none';
    });
  } else {
    allWins.forEach(function(win) {
      win.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s';
      win.style.transform = '';
      win.style.opacity = '';
      win.style.pointerEvents = '';
      setTimeout(function() { win.style.transition = ''; }, 500);
    });
    showDesktopStates = {};
  }
}

// Click wallpaper (empty desktop) to toggle
document.addEventListener('click', function(e) {
  if (e.target.id === 'wallpaper' || e.target.classList.contains('floating-orb')) {
    toggleShowDesktop();
  }
});

// F11 / Escape shortcut
document.addEventListener('keydown', function(e) {
  if (e.key === 'F11') {
    e.preventDefault();
    toggleShowDesktop();
  }
  if (e.key === 'Escape' && showDesktopActive && !spotlightOpen) {
    if (openWindows['snake']) return;
    e.preventDefault();
    toggleShowDesktop();
  }
});

/* ===== VIDEO PROGRESS (per video, localStorage) ===== */
function getVideoProgress(idx) {
  try {
    var data = JSON.parse(localStorage.getItem('fc_progress') || '{}');
    return data[idx] || 0;
  } catch(e) { return 0; }
}

function saveVideoProgress(idx, seconds) {
  try {
    var data = JSON.parse(localStorage.getItem('fc_progress') || '{}');
    data[idx] = seconds;
    localStorage.setItem('fc_progress', JSON.stringify(data));
  } catch(e) {}
}

// Poll YouTube iframe for current time via postMessage.
// Flow: on iframe load send "listening" + subscribe to onStateChange events,
// then poll getCurrentTime every 3s. YouTube responds with infoDelivery events.
var fcProgressInterval = null;
var fcProgressHandshakeTimeout = null;

function fcYTHandshake(iframe) {
  if (!iframe || !iframe.contentWindow) return;
  try {
    // Start handshake: tell YT iframe we're listening
    iframe.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 'fc-player', channel: 'widget' }), '*');
    // Subscribe to state + info change events (triggers infoDelivery broadcasts)
    iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'] }), '*');
    iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onReady'] }), '*');
  } catch(e) {}
}

function startProgressTracking() {
  clearInterval(fcProgressInterval);
  clearTimeout(fcProgressHandshakeTimeout);
  // Give iframe time to load, then handshake
  fcProgressHandshakeTimeout = setTimeout(function() {
    var iframe = document.getElementById('fc-pw-iframe');
    if (!iframe || !iframe.src) iframe = document.querySelector('.mfc-player-iframe');
    fcYTHandshake(iframe);
  }, 800);
  // Poll currentTime every 3s
  fcProgressInterval = setInterval(function() {
    if (fcCurrentVideo === null) { clearInterval(fcProgressInterval); return; }
    var iframe = document.getElementById('fc-pw-iframe');
    if (!iframe || !iframe.src) iframe = document.querySelector('.mfc-player-iframe');
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'getCurrentTime', args: '' }), '*');
      } catch(e) {}
    }
  }, 3000);
}

window.addEventListener('message', function(e) {
  if (!e.data || typeof e.data !== 'string') return;
  try {
    var msg = JSON.parse(e.data);
    if ((msg.event === 'infoDelivery' || msg.event === 'onStateChange') && msg.info) {
      var t = null;
      if (typeof msg.info === 'number') t = msg.info; // onStateChange sometimes sends number
      if (msg.info && typeof msg.info.currentTime === 'number') t = msg.info.currentTime;
      if (fcCurrentVideo !== null && t !== null && t > 0) {
        saveVideoProgress(fcCurrentVideo, t);
      }
    }
  } catch(err) {}
});

// Also save progress when window/tab unloads
window.addEventListener('beforeunload', function() {
  // Attempt one last getCurrentTime; browser may not deliver before unload but no harm
  var iframe = document.getElementById('fc-pw-iframe') || document.querySelector('.mfc-player-iframe');
  if (iframe && iframe.contentWindow) {
    try { iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'getCurrentTime', args: '' }), '*'); } catch(e) {}
  }
});

// Start tracking when video plays
var origPlayFcVideo = playFcVideo;
playFcVideo = function(i) { origPlayFcVideo(i); startProgressTracking(); };
var origPlayMfcVideo = playMfcVideo;
playMfcVideo = function(i, evt) { origPlayMfcVideo(i, evt); startProgressTracking(); };

/* ===== WINDOW STATE PERSISTENCE (localStorage) ===== */
var winStateKey = 'user_win_state';
var winStateRestored = false; // guard: don't save until we've hydrated from storage (prevents boot-time {} overwrite)

// Scroll selectors per window — captures the actual inner scroll container(s).
// First-match wins; if none, fallback to .window-body or .fshell-content.
function getWindowScrollTargets(win) {
  var targets = [];
  // Flutter Course has .fc-sections as main scroller
  var fc = win.querySelector('.fc-sections');
  if (fc) targets.push({ sel: '.fc-sections', el: fc });
  // All fshell content panels
  var fshell = win.querySelector('.fshell-content');
  if (fshell) targets.push({ sel: '.fshell-content', el: fshell });
  // Fallback: standard body
  if (!targets.length) {
    var body = win.querySelector('.window-body');
    if (body) targets.push({ sel: '.window-body', el: body });
  }
  return targets;
}

function isDesktopViewport() {
  return window.innerWidth > 768;
}

function saveWindowStates() {
  if (!isDesktopViewport()) return;
  if (!winStateRestored) return; // don't overwrite saved state before restore has run
  var state = {};
  var allIds = ['about','flutter','speaking','oss','tech','articles','contact','github','linkedin','snake','flutter-course','fc-player'];
  allIds.forEach(function(id) {
    var win = document.getElementById('win-' + id);
    if (!win) return;
    if (openWindows[id]) {
      // Capture scroll positions per scroll target selector
      var scrolls = {};
      getWindowScrollTargets(win).forEach(function(t) {
        if (t.el.scrollTop > 0) scrolls[t.sel] = t.el.scrollTop;
      });
      state[id] = {
        open: true,
        top: win.style.top,
        left: win.style.left,
        width: win.style.width,
        height: win.style.height,
        z: win.style.zIndex,
        scrolls: scrolls,
        maximized: win.classList.contains('maximized'),
        fullscreenSpace: win.classList.contains('fullscreen-space')
      };
    }
  });
  try { localStorage.setItem(winStateKey, JSON.stringify(state)); } catch(e) {}
}

function restoreWindowStates() {
  // Always mark "restored" at the end so subsequent saves are allowed,
  // even on first-visit (no state) or non-desktop viewports.
  try {
    // Clean up legacy key from older builds
    try { localStorage.removeItem('ishaq_win_state'); } catch(e) {}

    if (!isDesktopViewport()) return;

    var raw = localStorage.getItem(winStateKey);
    var state = null;
    try { state = raw ? JSON.parse(raw) : null; } catch(e) { state = null; }
    if (!state || typeof state !== 'object') return;

    // Sort by z-index ascending so highest-z opens last (keeps focus order)
    var entries = Object.keys(state).map(function(id) { return { id: id, s: state[id] }; });
    entries.sort(function(a, b) { return (parseInt(a.s.z) || 0) - (parseInt(b.s.z) || 0); });

    // Track restored windows that should enter fullscreen AFTER all opens,
    // so the has-fullscreen body class doesn't make later openWindow calls bail.
    var fsRestore = [];
    var maxZ = 0;

    entries.forEach(function(entry) {
      var id = entry.id, s = entry.s;
      if (!s || !s.open) return;
      // Skip fc-player — transient player window, needs a video to make sense
      if (id === 'fc-player') return;
      var win = document.getElementById('win-' + id);
      if (!win) return;
      if (s.top)    win.style.top    = s.top;
      if (s.left)   win.style.left   = s.left;
      if (s.width)  win.style.width  = s.width;
      if (s.height) win.style.height = s.height;
      // Strict clamp so saved positions/sizes fit current viewport (no transition during restore)
      try { clampWindowToViewport(win, true); } catch(e) {}
      try { openWindow(id, true); } catch(e) {}
      var zVal = parseInt(s.z) || 0;
      if (zVal) { win.style.zIndex = zVal; if (zVal > maxZ) maxZ = zVal; }
      // Restore maximized immediately; defer fullscreen so later opens aren't blocked
      if (s.maximized) win.classList.add('maximized');
      if (s.fullscreenSpace) fsRestore.push(win);
      // Replay scroll positions after layout settles + async renderers
      if (s.scrolls) {
        (function(win, scrolls) {
          var applyScroll = function(attempt) {
            var anyMissed = false;
            Object.keys(scrolls).forEach(function(sel) {
              var el = win.querySelector(sel);
              if (!el) { anyMissed = true; return; }
              if (el.scrollHeight > el.clientHeight) {
                el.scrollTop = scrolls[sel];
                el.dispatchEvent(new Event('scroll'));
              } else {
                anyMissed = true;
              }
            });
            if (anyMissed && attempt < 15) setTimeout(function() { applyScroll(attempt + 1); }, 250);
          };
          setTimeout(function() { applyScroll(0); }, 150);
        })(win, s.scrolls);
      }
    });

    // Keep activeZ ahead of restored windows so newly opened windows stack above
    if (typeof activeZ !== 'undefined' && maxZ >= activeZ) activeZ = maxZ + 1;

    // Now apply deferred fullscreen state
    if (fsRestore.length) {
      fsRestore.forEach(function(w) { w.classList.add('fullscreen-space'); });
      document.body.classList.add('has-fullscreen');
    }
  } catch(e) {
    // swallow — never block the save loop from turning on
  } finally {
    winStateRestored = true;
  }
}

function clampWindowToViewport(win, skipTransition) {
  var menuH = 28;
  var dockH = 80;
  var cs = getComputedStyle(win);
  var minW = Math.max(parseInt(cs.minWidth) || 0, 400);
  var minH = Math.max(parseInt(cs.minHeight) || 0, 300);
  var t = parseInt(win.style.top) || 0;
  var l = parseInt(win.style.left) || 0;
  var w = win.offsetWidth || parseInt(win.style.width) || minW;
  var h = win.offsetHeight || parseInt(win.style.height) || minH;

  // Available vertical band
  var availH = Math.max(minH, window.innerHeight - menuH - dockH);
  var availW = Math.max(minW, window.innerWidth - 20);

  // Shrink window if larger than viewport, but never below its CSS min-width/height
  if (w > availW) { w = Math.max(minW, availW); win.style.width = w + 'px'; }
  if (h > availH) { h = Math.max(minH, availH); win.style.height = h + 'px'; }

  // Keep fully inside viewport
  if (l < 0) l = 0;
  if (l + w > window.innerWidth) l = Math.max(0, window.innerWidth - w);
  if (t < menuH) t = menuH;
  if (t + h > window.innerHeight - dockH) t = Math.max(menuH, window.innerHeight - dockH - h);

  // Edge case: window still exceeds (e.g. viewport < minW); accept overflow but clamp top-left to origin
  if (l + w > window.innerWidth && l === 0) { /* leave, width cap already applied */ }
  if (t + h > window.innerHeight - dockH && t === menuH) { /* leave */ }

  if (!skipTransition) {
    win.style.transition = 'top 0.3s, left 0.3s, width 0.3s, height 0.3s';
    setTimeout(function() { win.style.transition = ''; }, 350);
  }
  win.style.top = t + 'px';
  win.style.left = l + 'px';
}

// Save state periodically and on close/open
setInterval(saveWindowStates, 3000);
window.addEventListener('beforeunload', saveWindowStates);

// Clamp all windows on resize (desktop-only; mobile uses its own layout)
window.addEventListener('resize', function() {
  if (!isDesktopViewport()) return;
  var allIds = ['about','flutter','speaking','oss','tech','articles','contact','github','linkedin','snake','flutter-course','fc-player'];
  allIds.forEach(function(id) {
    if (!openWindows[id]) return;
    var win = document.getElementById('win-' + id);
    if (win) clampWindowToViewport(win);
  });
});

// Restore windows EARLY (during boot, hidden behind splash).
// User wants them ready before splash completes so entering desktop feels instant.
(function earlyRestore() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', earlyRestore);
    return;
  }
  // Run as soon as DOM is ready. Windows render behind the boot screen (higher z).
  setTimeout(function() {
    restoreWindowStates();
    // After restore, apply URL route so the URL-specified window sits on top
    try { applyUrlRoute(); } catch (e) {}
  }, 0);
})();

/* ===== PER-WINDOW URL ROUTING ===== */
var WINDOW_PATHS = {
  about: '/about',
  flutter: '/flutter-contributions',
  speaking: '/speaking',
  oss: '/open-source',
  tech: '/tech-stack',
  articles: '/medium-articles',
  contact: '/contact',
  github: '/github',
  linkedin: '/linkedin',
  snake: '/snake',
  'flutter-course': '/flutter-course',
  wisesend: '/wisesend'
};
var PATH_TO_WINDOW = {};
Object.keys(WINDOW_PATHS).forEach(function(id){ PATH_TO_WINDOW[WINDOW_PATHS[id]] = id; });

// Which desktop windows have an equivalent mobile expanded section.
// Keys: desktop window id. Values: mobile section slug (id of #mobile-<slug>-expanded).
// `about` and `wisesend` are desktop-only and intentionally omitted.
var MOBILE_SECTION_MAP = {
  flutter: 'prs',
  speaking: 'speaking',
  oss: 'oss',
  tech: 'tech',
  articles: 'articles',
  contact: 'connect',
  github: 'github',
  linkedin: 'linkedin',
  snake: 'snake',
  'flutter-course': 'flutter-course'
};

var DEFAULT_PAGE_TITLE = (typeof document !== 'undefined' && document.title) || 'Ishaq Hassan | Senior Engineer & Flutter Framework Contributor';
var DEFAULT_PAGE_DESC  = 'Senior full-stack engineer, Flutter Framework Contributor with 6 merged PRs, Engineering Manager at DigitalHire. Interactive macOS-style portfolio.';

var WINDOW_META = {
  about:           { title: 'About Ishaq Hassan | Flutter Framework Contributor',                 desc: '13+ years in software, 6 merged PRs into the Flutter framework, 50+ production apps shipped.' },
  flutter:         { title: 'Flutter Framework Contributions | 6 Merged PRs | Ishaq Hassan',      desc: 'Framework-level Flutter PRs: six merged, three approved. Contribution list and links.' },
  speaking:        { title: 'Speaking & Tech Talks | Ishaq Hassan',                               desc: 'Flutter bootcamps, GDG events, university seminars and community meetups.' },
  oss:             { title: 'Open Source Projects | Ishaq Hassan',                                desc: 'Open-source Flutter packages, Dart tools and developer utilities on pub.dev and GitHub.' },
  tech:            { title: 'Tech Stack & Tools | Ishaq Hassan',                                  desc: 'Flutter, Dart, Firebase, Node, Next.js, Rust and the broader stack behind 50+ production apps.' },
  articles:        { title: 'Medium Articles | Ishaq Hassan',                                     desc: 'Long-form technical writing: Dart isolates, Flutter three-tree architecture, Firebase and more.' },
  contact:         { title: 'Contact Ishaq Hassan',                                               desc: 'Reach out for Flutter consulting, speaking engagements, or collaboration.' },
  github:          { title: 'GitHub Profile | Ishaq Hassan',                                      desc: 'Open source repos, pub.dev packages, Flutter framework PRs and contribution heatmap.' },
  linkedin:        { title: 'LinkedIn Profile | Ishaq Hassan',                                    desc: 'Engineering Manager at DigitalHire, Flutter Framework Contributor, 13+ years of experience.' },
  snake:           { title: 'Snake Neon | Play inside the Portfolio',                             desc: 'A vanilla-JS arcade game with neon visuals, multiple control schemes and pause/resume.' },
  'flutter-course':{ title: 'Flutter Course (Urdu) | 35 Free Videos by Ishaq Hassan',             desc: 'Free Urdu Flutter course listed on official Flutter docs. 35 videos across 7 sections.' },
  wisesend:        { title: 'WiseSend | Side Project by Ishaq Hassan',                            desc: 'A side project by Ishaq Hassan under the XRLabs umbrella.' }
};

function windowIdFromCurrentUrl() {
  try {
    var sp = new URLSearchParams(location.search);
    var p = sp.get('w');
    if (p && WINDOW_PATHS[p]) return p;
    var path = location.pathname.replace(/\/+$/, '') || '/';
    return PATH_TO_WINDOW[path] || null;
  } catch (e) { return null; }
}

function updateMetaForWindow(id) {
  var m = id ? WINDOW_META[id] : null;
  var title = m ? m.title : DEFAULT_PAGE_TITLE;
  var desc  = m ? m.desc  : DEFAULT_PAGE_DESC;
  var url   = 'https://ishaqhassan.dev' + (id && WINDOW_PATHS[id] ? WINDOW_PATHS[id] : '/');
  try { document.title = title; } catch (e) {}
  var setAttr = function(selector, attr, val) {
    var el = document.querySelector(selector);
    if (el) el.setAttribute(attr, val);
  };
  setAttr('meta[name="description"]',    'content', desc);
  setAttr('meta[property="og:title"]',   'content', title);
  setAttr('meta[property="og:description"]', 'content', desc);
  setAttr('meta[property="og:url"]',     'content', url);
  setAttr('meta[name="twitter:title"]',  'content', title);
  setAttr('meta[name="twitter:description"]', 'content', desc);
  setAttr('link[rel="canonical"]',       'href',    url);
}

var _deeplinkCentered = {};
function deeplinkAnimateCenter(id) {
  // On first URL-land, glide the target window to a pleasant centered size.
  // No maximize, no fullscreen: just a smooth slide-to-center so the
  // deeplinked view lands in the visual focus of the desktop. If a saved
  // state had this window maximized/fullscreened, drop those classes first
  // so the incoming deeplinked view is a fresh centered frame.
  try {
    if (_deeplinkCentered[id]) return;
    _deeplinkCentered[id] = true;
    var win = document.getElementById('win-' + id);
    if (!win) return;
    if (win.classList.contains('maximized')) win.classList.remove('maximized');
    if (win.classList.contains('fullscreen-space')) {
      win.classList.remove('fullscreen-space');
      document.body.classList.remove('has-fullscreen');
    }
    var menuH = 28, dockH = 80;
    var vw = window.innerWidth, vh = window.innerHeight;
    var midW = Math.min(1080, Math.max(520, Math.floor(vw * 0.66)));
    var midH = Math.min(720,  Math.max(420, Math.floor((vh - menuH - dockH) * 0.78)));
    var midLeft = Math.floor((vw - midW) / 2);
    var midTop  = Math.floor(menuH + ((vh - menuH - dockH - midH) / 2));
    var easedT = 'top 0.48s cubic-bezier(.16,1,.3,1), left 0.48s cubic-bezier(.16,1,.3,1), width 0.48s cubic-bezier(.16,1,.3,1), height 0.48s cubic-bezier(.16,1,.3,1)';
    var applyCenter = function() {
      win.style.transition = easedT;
      win.style.top    = midTop  + 'px';
      win.style.left   = midLeft + 'px';
      win.style.width  = midW    + 'px';
      win.style.height = midH    + 'px';
    };
    // Apply immediately (works even in background tabs where rAF is throttled),
    // and again shortly after to override any late restore/clamp from other handlers.
    applyCenter();
    setTimeout(applyCenter, 60);
    setTimeout(function() { win.style.transition = ''; }, 700);
  } catch (e) {}
}
// Back-compat alias (older name used in window exports)
var deeplinkAnimateMaximize = deeplinkAnimateCenter;

function applyUrlRoute(shouldMaximize) {
  try {
    if (!isDesktopViewport()) {
      // Mobile: expand section for the URL-specified window, if one exists on mobile.
      // Only windows with an actual #mobile-<section>-expanded element get expanded here.
      // `about` and `wisesend` have no mobile surface — we keep the URL + meta and show home.
      var mid = windowIdFromCurrentUrl();
      if (mid) {
        // Canonicalise URL first (?w=X → pretty path) and update share metadata
        if (location.search.indexOf('w=') !== -1 && WINDOW_PATHS[mid]) {
          try { history.replaceState({w: mid}, '', WINDOW_PATHS[mid]); } catch(e) {}
        }
        updateMetaForWindow(mid);
        var section = MOBILE_SECTION_MAP[mid];
        if (section && typeof expandMobileSection === 'function') {
          setTimeout(function(){ try { expandMobileSection(null, section); } catch(e) {} }, 300);
        }
      }
      return;
    }
    var id = windowIdFromCurrentUrl();
    if (!id) return;
    var win = document.getElementById('win-' + id);
    if (!win) return;
    var wasClosed = !openWindows[id];
    if (wasClosed) {
      var hasSavedPos = !!(win.style.top && win.style.left);
      // Only add the premium deeplink-enter class when we're ABOUT to do the center-glide.
      // For restore/popstate cases (shouldMaximize=false), keep the default open animation.
      if (shouldMaximize) win.classList.add('deeplink-enter');
      try { openWindow(id, hasSavedPos); } catch(e) {}
      if (shouldMaximize) setTimeout(function(){ try { win.classList.remove('deeplink-enter'); } catch(e) {} }, 780);
    }
    // ALWAYS bump z-index so URL-specified window sits on top
    win.style.zIndex = ++activeZ;
    if (typeof updateMenuBarForWindow === 'function') updateMenuBarForWindow(id);
    if (location.search.indexOf('w=') !== -1) {
      try { history.replaceState({w: id}, '', WINDOW_PATHS[id]); } catch(e) {}
    }
    updateMetaForWindow(id);
    if (typeof window.__fbLogEvent === 'function') {
      try {
        window.__fbLogEvent('page_view', {
          page_path: WINDOW_PATHS[id],
          page_title: (WINDOW_META[id] && WINDOW_META[id].title) || document.title
        });
      } catch(e) {}
    }
    // When the user lands via the URL itself (not via dock/popstate), glide the target window
    // to the visual center of the desktop so the deeplinked view is immediately in focus.
    if (shouldMaximize) setTimeout(function() { deeplinkAnimateCenter(id); }, 60);
    // Ensure dock indicator for the deeplinked window is visibly lit
    if (typeof syncDockIndicators === 'function') try { syncDockIndicators(); } catch(e) {}
  } catch (e) {}
}

function navigate(id) {
  openWindow(id);
  if (!WINDOW_PATHS[id]) return;
  if (location.pathname === WINDOW_PATHS[id]) return;
  try { history.pushState({w: id}, '', WINDOW_PATHS[id]); } catch (e) {}
  updateMetaForWindow(id);
  if (typeof window.__fbLogEvent === 'function') {
    try {
      window.__fbLogEvent('page_view', {
        page_path: WINDOW_PATHS[id],
        page_title: (WINDOW_META[id] && WINDOW_META[id].title) || document.title
      });
    } catch(e) {}
  }
}

window.addEventListener('popstate', function() {
  var id = windowIdFromCurrentUrl();
  if (id) {
    var win = document.getElementById('win-' + id);
    if (!win) return;
    if (!openWindows[id]) { try { openWindow(id); } catch(e) {} }
    win.style.zIndex = ++activeZ;
    if (typeof updateMenuBarForWindow === 'function') updateMenuBarForWindow(id);
    updateMetaForWindow(id);
  } else {
    updateMetaForWindow(null);
  }
});

try { window.navigate = navigate; window.applyUrlRoute = applyUrlRoute; window.updateMetaForWindow = updateMetaForWindow; window.deeplinkAnimateCenter = deeplinkAnimateCenter; window.deeplinkAnimateMaximize = deeplinkAnimateCenter; } catch(e) {}

/* ===== FINDER SHELL (native macOS Finder layout: sidebar + content) =====
   Runs on DOMContentLoaded. Reshapes eligible windows into:
   .window-toolbar -> .wt-left (traffic lights) + .wt-right (nav/title/actions)
   .window-body -> .fshell-sidebar + .fshell-content (wraps existing content)
   Drag binding (.window-toolbar onmousedown), traffic-light guard, resize handles,
   all smart features untouched. */
var FSHELL_ICONS = {
  all:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  check:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>',
  clock:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  eye:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>',
  star:      '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>',
  mic:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v3"/></svg>',
  university:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10L12 4 2 10l10 6 10-6z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>',
  globe:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg>',
  code:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  package:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.3 7 12 12 20.7 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>',
  mobile:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>',
  browser:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="9" x2="22" y2="9"/></svg>',
  server:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="8" rx="1"/><rect x="2" y="13" width="20" height="8" rx="1"/><line x1="6" y1="7" x2="6" y2="7"/><line x1="6" y1="17" x2="6" y2="17"/></svg>',
  settings:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
  briefcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>',
  mail:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
  link:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>',
  article:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>',
  user:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  heart:     '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>',
  git:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 012 2v7"/><line x1="6" y1="9" x2="6" y2="21"/></svg>',
  school:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22V6a2 2 0 012-2h12a2 2 0 012 2v16"/><path d="M8 22v-5M16 22v-5M12 22V10"/></svg>',
  book:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>',
  play:      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l15 8-15 8z"/></svg>',
  folder:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>',
  /* Flutter Course per-section unique icons */
  foundation:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V9l9-6 9 6v12"/><path d="M3 21h18"/><rect x="9" y="13" width="6" height="8"/></svg>',
  dart:      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z"/></svg>',
  oop:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="12" cy="18" r="3"/><path d="M8.5 7.5l2 8M15.5 7.5l-2 8"/></svg>',
  ui:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5M3 17l9 5 9-5"/></svg>',
  state:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>',
  network:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>',
  advanced:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" fill="currentColor" fill-opacity="0.3"/><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>'
};
/* Map Flutter Course section name → icon key */
var FC_SECTION_ICONS = {
  'Foundation':        'foundation',
  'Dart Basics':       'dart',
  'OOP':               'oop',
  'Flutter UI':        'ui',
  'State Management':  'state',
  'API & Network':     'network',
  'Advanced':          'advanced'
};

var WIN_SIDEBAR = {
  flutter: {
    accent: 'cyan',
    title: 'Flutter Framework',
    mode: 'filter',
    sections: [
      { label: 'Contributions', items: [
        { target: 'all',      icon: 'all',    text: 'All PRs' },
        { target: 'merged',   icon: 'check',  text: 'Merged' },
        { target: 'open',     icon: 'eye',    text: 'Open' },
      ]},
      { label: 'Links', items: [
        { href: 'https://github.com/flutter/flutter/pulls?q=author:ishaquehassan', icon: 'git', text: 'On GitHub' },
        { href: 'https://flutter.dev', icon: 'globe', text: 'flutter.dev' },
      ]}
    ]
  },
  speaking: {
    accent: 'amber',
    title: 'Speaking & Community',
    mode: 'filter',
    sections: [
      { label: 'Events', items: [
        { target: 'all',         icon: 'all',        text: 'All Events' },
        { target: 'gdg',         icon: 'mic',        text: 'GDG / Google' },
        { target: 'university',  icon: 'university', text: 'Universities' },
        { target: 'online',      icon: 'globe',      text: 'Online' },
      ]}
    ]
  },
  oss: {
    accent: 'green',
    title: 'Open Source',
    mode: 'filter',
    sections: [
      { label: 'Projects', items: [
        { target: 'all',     icon: 'all',     text: 'All Projects' },
        { target: 'flutter', icon: 'mobile',  text: 'Flutter / Dart' },
        { target: 'js',      icon: 'code',    text: 'JavaScript' },
        { target: 'tool',    icon: 'package', text: 'Tools' },
      ]}
    ]
  },
  tech: {
    accent: 'slate',
    title: 'Tech Stack',
    mode: 'scroll',
    sections: [
      { label: 'Categories', items: [
        { target: 'all',      icon: 'all',     text: 'All' },
        { target: 'mobile',   icon: 'mobile',  text: 'Mobile' },
        { target: 'frontend', icon: 'browser', text: 'Frontend' },
        { target: 'backend',  icon: 'server',  text: 'Backend' },
        { target: 'tools',    icon: 'settings',text: 'Tools' },
      ]}
    ]
  },
  articles: {
    accent: 'medium',
    title: 'Medium',
    mode: 'filter',
    sections: [
      { label: 'Library', items: [
        { target: 'all',          icon: 'all',          text: 'All Stories' },
        { target: 'flutter',      icon: 'mobile',       text: 'Flutter' },
        { target: 'architecture', icon: 'package',      text: 'Architecture' },
      ]},
      { label: 'External', items: [
        { href: 'https://medium.com/@ishaqhassan', icon: 'link', text: 'Read on Medium' },
      ]}
    ]
  },
  linkedin: {
    accent: 'blue',
    title: 'LinkedIn',
    mode: 'swap-li-tab',
    sections: [
      { label: 'Profile', items: [
        { target: 'experience', icon: 'briefcase', text: 'Experience' },
        { target: 'opensource', icon: 'code',      text: 'Open Source' },
        { target: 'education',  icon: 'school',    text: 'Education' },
        { target: 'skills',     icon: 'star',      text: 'Skills' },
      ]},
      { label: 'External', items: [
        { href: 'https://linkedin.com/in/ishaquehassan', icon: 'link', text: 'Open LinkedIn' },
      ]}
    ]
  },
  'flutter-course': {
    accent: 'cyan',
    title: 'Flutter: Basic to Advanced',
    mode: 'scroll',
    dynamic: 'fcSections',
    sections: [
      { label: 'Sections', items: [] },
      { label: 'External', items: [
        { href: 'https://www.youtube.com/@ishaquehassan', icon: 'play',   text: 'YouTube Channel' },
        { href: 'https://www.youtube.com/playlist?list=PLX97VxArfzkmXeUqUxeKW7XS8oYraH7A5', icon: 'folder', text: 'Course Playlist' },
        { href: 'https://docs.flutter.dev/resources/courses#urdu', icon: 'book', text: 'Flutter Docs' },
      ]}
    ]
  }
};

/* Build a sidebar <aside> element from config */
function fshellRenderSidebar(winId, cfg) {
  var aside = document.createElement('aside');
  aside.className = 'fshell-sidebar';
  aside.dataset.winId = winId;
  aside.dataset.mode = cfg.mode;
  var html = '';
  // Search input at top (macOS Settings style)
  html += '<div class="sb-search-wrap">';
  html += '<div class="sb-search">';
  html += '<svg class="sb-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>';
  html += '<input type="text" class="sb-search-input" placeholder="Search" spellcheck="false" autocomplete="off">';
  html += '</div>';
  html += '<div class="sb-suggest" hidden><div class="sb-suggest-label">Suggestions</div><div class="sb-suggest-list"></div></div>';
  html += '</div>';
  cfg.sections.forEach(function(sec) {
    html += '<div class="sb-section">';
    if (sec.label) html += '<div class="sb-label">' + sec.label + '</div>';
    sec.items.forEach(function(it, i) {
      if (it.href) {
        html += '<a class="sb-item" href="' + it.href + '" target="_blank" rel="noopener noreferrer" data-search="' + it.text.toLowerCase() + '">';
        html += '<span class="sb-icon">' + (FSHELL_ICONS[it.icon] || '') + '</span>';
        html += '<span class="sb-text">' + it.text + '</span>';
        if (it.badge) html += '<span class="sb-badge">' + it.badge + '</span>';
        html += '</a>';
      } else {
        var activeCls = (i === 0 && sec.items === cfg.sections[0].items) ? ' sb-active' : '';
        html += '<button class="sb-item' + activeCls + '" data-target="' + it.target + '" data-search="' + it.text.toLowerCase() + '" type="button">';
        html += '<span class="sb-icon">' + (FSHELL_ICONS[it.icon] || '') + '</span>';
        html += '<span class="sb-text">' + it.text + '</span>';
        if (it.badge) html += '<span class="sb-badge">' + it.badge + '</span>';
        html += '</button>';
      }
    });
    html += '</div>';
  });
  aside.innerHTML = html;
  return aside;
}

/* Sidebar search: delegated input handler across all sidebars */
document.addEventListener('input', function(e) {
  if (!e.target.classList || !e.target.classList.contains('sb-search-input')) return;
  var sidebar = e.target.closest('.fshell-sidebar');
  if (!sidebar) return;
  var q = e.target.value.trim().toLowerCase();
  var suggest = sidebar.querySelector('.sb-suggest');
  var list = sidebar.querySelector('.sb-suggest-list');
  if (!q) {
    suggest.hidden = true;
    list.innerHTML = '';
    return;
  }
  var winId = sidebar.dataset.winId;
  var matches = [];
  // For flutter-course, skip sidebar-category matches — only show video matches
  if (winId !== 'flutter-course') {
    var items = sidebar.querySelectorAll('.sb-item[data-search]');
    items.forEach(function(it) {
      var txt = it.dataset.search || '';
      if (txt.indexOf(q) >= 0) {
        matches.push({
          text: it.querySelector('.sb-text').textContent,
          icon: it.querySelector('.sb-icon').innerHTML,
          target: it.dataset.target || null,
          href: it.tagName === 'A' ? it.href : null,
          score: (txt.indexOf(q) === 0 ? 10 : 1) + (txt === q ? 20 : 0)
        });
      }
    });
  }
  // Also search the window's primary content cards for richer matches
  var content = document.querySelector('#win-' + winId + ' .fshell-content');
  if (content) {
    // PRs / events / repos / articles / videos
    var extra = content.querySelectorAll('.pr-card, .event-row, .fc-video-card, .article-card');
    extra.forEach(function(el) {
      var t = (el.textContent || '').trim().toLowerCase();
      if (t.indexOf(q) >= 0) {
        var title = el.querySelector('.pr-title, .event-name, .fc-video-title, .article-title');
        var label = title ? title.textContent.trim() : t.slice(0, 50);
        var match = {
          text: label,
          icon: FSHELL_ICONS.article,
          scrollTo: el,
          score: (t.indexOf(q) === 0 ? 8 : 0.5)
        };
        // If it's a Flutter Course video card, extract the video index so Enter plays it
        if (el.classList.contains('fc-video-card')) {
          var onclickAttr = el.getAttribute('onclick') || '';
          var m = onclickAttr.match(/playFcVideo\s*\(\s*(\d+)\s*\)/);
          if (m) {
            match.playVideoIdx = parseInt(m[1], 10);
            match.icon = FSHELL_ICONS.play;
            match.score += 2;
          }
        }
        matches.push(match);
      }
    });
  }
  matches.sort(function(a, b) { return b.score - a.score; });
  matches = matches.slice(0, 6);
  if (!matches.length) {
    list.innerHTML = '<div class="sb-suggest-empty">No results</div>';
  } else {
    list.innerHTML = matches.map(function(m, i) {
      return '<button type="button" class="sb-suggest-item' + (i === 0 ? ' sb-suggest-active' : '') + '" data-idx="' + i + '">' +
        '<span class="sb-suggest-icon">' + m.icon + '</span>' +
        '<span class="sb-suggest-text">' + m.text + '</span></button>';
    }).join('');
    // Store matches on the list for click resolution
    list._fshellMatches = matches;
  }
  suggest.hidden = false;
});

/* Focus: show suggestions for empty search as "recent-like" preview (first 5 sidebar items) */
document.addEventListener('focus', function(e) {
  if (!e.target.classList || !e.target.classList.contains('sb-search-input')) return;
  var sidebar = e.target.closest('.fshell-sidebar');
  if (!sidebar) return;
  if (e.target.value.trim()) return;
  var items = Array.from(sidebar.querySelectorAll('.sb-item[data-target]')).slice(0, 5);
  var suggest = sidebar.querySelector('.sb-suggest');
  var list = sidebar.querySelector('.sb-suggest-list');
  if (!items.length) return;
  var matches = items.map(function(it) {
    return {
      text: it.querySelector('.sb-text').textContent,
      icon: it.querySelector('.sb-icon').innerHTML,
      target: it.dataset.target
    };
  });
  list.innerHTML = matches.map(function(m, i) {
    return '<button type="button" class="sb-suggest-item' + (i === 0 ? ' sb-suggest-active' : '') + '" data-idx="' + i + '">' +
      '<span class="sb-suggest-icon">' + m.icon + '</span>' +
      '<span class="sb-suggest-text">' + m.text + '</span></button>';
  }).join('');
  list._fshellMatches = matches;
  suggest.hidden = false;
}, true);

/* Blur (with small delay so clicks register) */
document.addEventListener('blur', function(e) {
  if (!e.target.classList || !e.target.classList.contains('sb-search-input')) return;
  var sidebar = e.target.closest('.fshell-sidebar');
  setTimeout(function() {
    var suggest = sidebar && sidebar.querySelector('.sb-suggest');
    if (suggest) suggest.hidden = true;
  }, 180);
}, true);

/* Click on suggestion */
document.addEventListener('click', function(e) {
  var sug = e.target.closest && e.target.closest('.sb-suggest-item');
  if (!sug) return;
  var list = sug.parentElement;
  var matches = list._fshellMatches || [];
  var m = matches[parseInt(sug.dataset.idx, 10)];
  if (!m) return;
  var sidebar = sug.closest('.fshell-sidebar');
  var winId = sidebar.dataset.winId;
  if (typeof m.playVideoIdx === 'number' && typeof playFcVideo === 'function') {
    playFcVideo(m.playVideoIdx);
  } else if (m.target) {
    // simulate click on matching sidebar item
    var btn = sidebar.querySelector('.sb-item[data-target="' + m.target + '"]');
    if (btn) btn.click();
  } else if (m.href) {
    window.open(m.href, '_blank', 'noopener,noreferrer');
  } else if (m.scrollTo) {
    m.scrollTo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    m.scrollTo.style.transition = 'outline 0.2s';
    m.scrollTo.style.outline = '2px solid rgba(125,211,252,0.8)';
    setTimeout(function() { m.scrollTo.style.outline = ''; }, 1500);
  }
  // Hide suggestions
  sidebar.querySelector('.sb-suggest').hidden = true;
  // Clear input
  var input = sidebar.querySelector('.sb-search-input');
  if (input) input.value = '';
});

/* Keyboard nav in search */
document.addEventListener('keydown', function(e) {
  if (!e.target.classList || !e.target.classList.contains('sb-search-input')) return;
  var sidebar = e.target.closest('.fshell-sidebar');
  if (!sidebar) return;
  var items = sidebar.querySelectorAll('.sb-suggest-item');
  if (!items.length) return;
  var activeIdx = Array.from(items).findIndex(function(x) { return x.classList.contains('sb-suggest-active'); });
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (activeIdx >= 0) items[activeIdx].classList.remove('sb-suggest-active');
    var next = Math.min(items.length - 1, activeIdx + 1);
    items[next].classList.add('sb-suggest-active');
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (activeIdx >= 0) items[activeIdx].classList.remove('sb-suggest-active');
    var prev = Math.max(0, activeIdx - 1);
    items[prev].classList.add('sb-suggest-active');
  } else if (e.key === 'Enter') {
    e.preventDefault();
    var active = sidebar.querySelector('.sb-suggest-item.sb-suggest-active');
    if (active) active.click();
  } else if (e.key === 'Escape') {
    sidebar.querySelector('.sb-suggest').hidden = true;
    e.target.value = '';
    e.target.blur();
  }
});

/* Populate Flutter Course sections from fcSectionOrder */
function fshellBuildFcSections() {
  if (typeof fcSectionOrder === 'undefined') return null;
  var items = [{ target: 'all', icon: 'all', text: 'All Sections' }];
  fcSectionOrder.forEach(function(s) {
    items.push({ target: 'sec-' + s.replace(/\s+/g, '-'), icon: (FC_SECTION_ICONS[s] || 'play'), text: s });
  });
  return [{ label: 'Course', items: items }];
}

/* Reshape a single window */
function fshellReshapeWindow(win) {
  var rawId = win.id.replace('win-', '');
  var cfg = WIN_SIDEBAR[rawId];
  if (!cfg) return;
  if (win.dataset.fshellDone === '1') return;

  // dynamic sections for Flutter Course
  if (cfg.dynamic === 'fcSections') {
    var secs = fshellBuildFcSections();
    if (secs) {
      var extras = cfg.sections.filter(function(s){ return s.label !== 'Sections'; });
      cfg.sections = secs.concat(extras);
    }
  }

  // 1) Toolbar restructure: wrap traffic-lights in .wt-left, build .wt-right
  var toolbar = win.querySelector(':scope > .window-toolbar');
  if (!toolbar) return;
  var tl = toolbar.querySelector(':scope > .traffic-lights');
  var existingTitle = toolbar.querySelector(':scope > .window-title');
  if (tl && !toolbar.querySelector(':scope > .wt-left')) {
    var wtLeft = document.createElement('div');
    wtLeft.className = 'wt-left';
    wtLeft.appendChild(tl);

    var wtRight = document.createElement('div');
    wtRight.className = 'wt-right';
    wtRight.innerHTML =
      '<div class="wt-title">' + (cfg.title || (existingTitle ? existingTitle.textContent.trim() : '')) + '</div>' +
      '<div class="wt-actions"></div>';

    // Remove the old absolute-positioned title (we replaced it in wt-right)
    if (existingTitle) existingTitle.remove();

    toolbar.insertBefore(wtLeft, toolbar.firstChild);
    toolbar.appendChild(wtRight);
  }

  // 2) Body restructure: wrap content in .fshell-content, prepend sidebar
  var body = win.querySelector(':scope > .window-body');
  if (!body || body.classList.contains('iframe-body')) return;
  if (body.querySelector(':scope > .fshell-sidebar')) return;

  var content = document.createElement('div');
  content.className = 'fshell-content';
  content.dataset.winId = rawId;
  // Copy inline style from body (padding was 24px default; our .fshell-content has 20/22 padding)
  while (body.firstChild) content.appendChild(body.firstChild);
  // Strip any inline padding/background from body that would fight our layout
  body.style.padding = '0';
  body.style.background = 'transparent';

  var sidebar = fshellRenderSidebar(rawId, cfg);
  body.appendChild(sidebar);
  body.appendChild(content);

  // 3) Mark window
  win.classList.add('has-fshell');
  if (cfg.accent) win.dataset.accent = cfg.accent;
  win.dataset.fshellDone = '1';

  // 4) Mode-specific post-processing
  if (cfg.mode === 'filter') {
    fshellTagFilterCards(rawId, content);
  } else if (cfg.mode === 'scroll') {
    fshellTagScrollAnchors(rawId, content);
  }
}

/* Tag existing cards with data-filter-val for CSS filter matching */
function fshellTagFilterCards(winId, content) {
  if (winId === 'flutter') {
    // PR cards: pick up status from .pr-status class text
    content.querySelectorAll('.pr-card').forEach(function(c) {
      var status = '';
      var s = c.querySelector('.pr-status');
      if (s) {
        var t = s.textContent.toLowerCase();
        if (t.indexOf('merged') >= 0) status = 'merged';
        else if (t.indexOf('approved') >= 0) status = 'approved';
        else if (t.indexOf('open') >= 0) status = 'open';
      }
      c.parentElement && c.parentElement.setAttribute('data-filter-val', 'all ' + status);
    });
  } else if (winId === 'speaking') {
    content.querySelectorAll('.event-row').forEach(function(ev) {
      var text = (ev.textContent || '').toLowerCase();
      var tags = 'all';
      if (text.indexOf('gdg') >= 0 || text.indexOf('google') >= 0 || text.indexOf('devfest') >= 0) tags += ' gdg';
      if (text.indexOf('university') >= 0 || text.indexOf('iqra') >= 0 || text.indexOf('suffa') >= 0 || text.indexOf('nic karachi') >= 0) tags += ' university';
      if (text.indexOf('online') >= 0 || text.indexOf('live') >= 0) tags += ' online';
      // Wrap link parent if exists
      var wrap = ev.closest('a') || ev;
      wrap.setAttribute('data-filter-val', tags);
    });
  } else if (winId === 'oss') {
    content.querySelectorAll('.repo-card, [class*="repo"]').forEach(function(r) {
      var text = (r.textContent || '').toLowerCase();
      var tags = 'all';
      if (text.indexOf('flutter') >= 0 || text.indexOf('dart') >= 0) tags += ' flutter';
      if (text.indexOf('javascript') >= 0 || text.indexOf('node') >= 0 || text.indexOf('typescript') >= 0 || text.indexOf('react') >= 0) tags += ' js';
      if (text.indexOf('cli') >= 0 || text.indexOf('tool') >= 0 || text.indexOf('package') >= 0) tags += ' tool';
      var wrap = r.closest('a') || r;
      wrap.setAttribute('data-filter-val', tags);
    });
  } else if (winId === 'articles') {
    content.querySelectorAll('.article-card, [class*="article"]').forEach(function(a) {
      var text = (a.textContent || '').toLowerCase();
      var tags = 'all';
      if (text.indexOf('flutter') >= 0) tags += ' flutter';
      if (text.indexOf('architecture') >= 0 || text.indexOf('pattern') >= 0 || text.indexOf('clean') >= 0) tags += ' architecture';
      if (text.indexOf('tutorial') >= 0 || text.indexOf('step') >= 0) tags += ' tutorial';
      if (text.indexOf('tip') >= 0 || text.indexOf('trick') >= 0) tags += ' tip';
      var wrap = a.closest('a') || a;
      wrap.setAttribute('data-filter-val', tags);
    });
  }
}

/* Register anchor IDs for scroll-mode windows */
function fshellTagScrollAnchors(winId, content) {
  if (winId === 'tech') {
    // Find tech-grid categories via section headers
    content.querySelectorAll('.section-header').forEach(function(h) {
      var t = h.textContent.trim().toLowerCase();
      if (t.indexOf('mobile') >= 0)  h.id = 'anchor-mobile';
      else if (t.indexOf('front') >= 0) h.id = 'anchor-frontend';
      else if (t.indexOf('back') >= 0)  h.id = 'anchor-backend';
      else if (t.indexOf('tool') >= 0 || t.indexOf('dev') >= 0) h.id = 'anchor-tools';
    });
  } else if (winId === 'contact') {
    content.querySelectorAll('.section-header').forEach(function(h) {
      var t = h.textContent.trim().toLowerCase();
      if (t.indexOf('direct') >= 0 || t.indexOf('email') >= 0) h.id = 'anchor-direct';
      else if (t.indexOf('profess') >= 0) h.id = 'anchor-professional';
      else if (t.indexOf('social') >= 0) h.id = 'anchor-social';
      else if (t.indexOf('code') >= 0 || t.indexOf('github') >= 0) h.id = 'anchor-code';
    });
  } else if (winId === 'github') {
    content.querySelectorAll('.section-header, h2, h3').forEach(function(h) {
      var t = h.textContent.trim().toLowerCase();
      if (t.indexOf('pinned') >= 0) h.id = 'anchor-pinned';
      else if (t.indexOf('contrib') >= 0) h.id = 'anchor-contributions';
      else if (t.indexOf('overview') >= 0 || t.indexOf('profile') >= 0) h.id = 'anchor-overview';
    });
  } else if (winId === 'flutter-course') {
    // Will be tagged by initFlutterCourse since sections render dynamically
  }
}

/* Delegated click on .sb-item across all sidebars */
document.addEventListener('click', function(e) {
  var item = e.target.closest && e.target.closest('.sb-item[data-target]');
  if (!item) return;
  var sidebar = item.closest('.fshell-sidebar');
  if (!sidebar) return;
  var mode = sidebar.dataset.mode;
  var winId = sidebar.dataset.winId;
  var target = item.dataset.target;
  var win = document.getElementById('win-' + winId);
  if (!win) return;
  var content = win.querySelector('.fshell-content');
  if (!content) return;

  // Update active state (buttons only, not anchor links)
  sidebar.querySelectorAll('.sb-item[data-target]').forEach(function(x) { x.classList.remove('sb-active'); });
  item.classList.add('sb-active');

  if (mode === 'filter') {
    if (target === 'all') content.removeAttribute('data-filter');
    else content.setAttribute('data-filter', target);
    content.scrollTop = 0;
  } else if (mode === 'scroll') {
    if (winId === 'flutter-course') {
      var fcSections = content.querySelector('.fc-sections');
      if (target === 'all') {
        if (fcSections) fcSections.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        var secName = target.replace(/^sec-/, '').replace(/-/g, ' ').toLowerCase();
        var sections = content.querySelectorAll('.fc-section');
        for (var i = 0; i < sections.length; i++) {
          var hdr = sections[i].querySelector('.fc-sh-title') || sections[i].querySelector('.fc-section-header span');
          if (hdr && hdr.textContent.trim().toLowerCase() === secName) {
            sections[i].classList.remove('collapsed');
            if (fcSections) {
              var sr = sections[i].getBoundingClientRect();
              var cr = fcSections.getBoundingClientRect();
              var delta = sr.top - cr.top;
              var targetTop = Math.max(0, fcSections.scrollTop + delta - 4);
              fshellSmoothScroll(fcSections, targetTop, 350);
            } else {
              sections[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            break;
          }
        }
      }
    } else if (target === 'all') {
      content.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      var anchor = content.querySelector('#anchor-' + target);
      if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else content.scrollTo({ top: 0, behavior: 'smooth' });
    }
  } else if (mode === 'swap-li-tab') {
    // LinkedIn: invoke switchLiTab() with mapped key
    var liTabKey = { experience:'experience', education:'education', skills:'skills', opensource:'opensource' }[target] || target;
    if (typeof switchLiTab === 'function') switchLiTab(liTabKey);
  }
});

/* Smooth scroll a specific scrollable element via setTimeout loop
   (rAF can be throttled in iframes/previews; setTimeout is reliable) */
function fshellSmoothScroll(el, to, duration) {
  var start = el.scrollTop;
  var diff = to - start;
  if (!diff) return;
  var startTime = Date.now();
  function step() {
    var t = Math.min(1, (Date.now() - startTime) / duration);
    var eased = 1 - Math.pow(1 - t, 3);
    el.scrollTop = start + diff * eased;
    if (t < 1) setTimeout(step, 16);
  }
  step();
}

/* Initialize Finder shell on all eligible windows after DOM ready */
function fshellInitAll() {
  Object.keys(WIN_SIDEBAR).forEach(function(id) {
    var win = document.getElementById('win-' + id);
    if (win) fshellReshapeWindow(win);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  // Wait for fcSectionOrder / dynamic data then reshape
  setTimeout(fshellInitAll, 80);
});


/* ===== DYNAMIC MENUBAR (per-window, macOS style) ===== */
var menuBarDefault = {
  name: 'Ishaq Hassan',
  nameMenu: '<div class="menu-dd-item disabled">Flutter Framework Contributor</div><div class="menu-dd-item disabled">Engineering Manager @ DigitalHire</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="window.open(\'https://github.com/ishaquehassan\')">GitHub Profile</div><div class="menu-dd-item" onclick="window.open(\'https://linkedin.com/in/ishaquehassan\')">LinkedIn Profile</div><div class="menu-dd-item" onclick="window.open(\'https://medium.com/@ishaqhassan\')">Medium Blog</div>',
  file: '<div class="menu-dd-item" onclick="navigate(\'flutter\')">Flutter Contributions<span class="shortcut">⌘1</span></div><div class="menu-dd-item" onclick="navigate(\'oss\')">Open Source Projects<span class="shortcut">⌘2</span></div><div class="menu-dd-item" onclick="navigate(\'articles\')">Medium Articles<span class="shortcut">⌘3</span></div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="navigate(\'tech\')">Tech Stack</div><div class="menu-dd-item" onclick="navigate(\'speaking\')">Speaking Events</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="closeAllWindows()">Close All Windows<span class="shortcut">⌘W</span></div>',
  view: '<div class="menu-dd-item" onclick="openAllWindows()">Open All Windows</div><div class="menu-dd-item" onclick="toggleMissionControl()">Mission Control<span class="shortcut">F3</span></div>'
};

var appMenus = {
  about: {
    name: 'Terminal',
    nameMenu: '<div class="menu-dd-item disabled">ishaq@dev: ~</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="navigate(\'about\')">New Terminal Window</div><div class="menu-dd-item" onclick="closeWindow(\'about\')">Close Terminal</div>',
    file: '<div class="menu-dd-item" onclick="closeWindow(\'about\')">Close Window<span class="shortcut">⌘W</span></div>',
    go: '<div class="menu-dd-item" onclick="navigate(\'github\')">GitHub</div><div class="menu-dd-item" onclick="navigate(\'contact\')">Contact</div>'
  },
  flutter: {
    name: 'Flutter PRs',
    nameMenu: '<div class="menu-dd-item disabled">6 Merged, 3 Open</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="window.open(\'https://github.com/flutter/flutter/pulls?q=author:ishaquehassan\')">View All on GitHub</div>',
    file: '<div class="menu-dd-item" onclick="window.open(\'https://github.com/flutter/flutter/pull/183081\')">PR #183081: AnimatedCrossFade</div><div class="menu-dd-item" onclick="window.open(\'https://github.com/flutter/flutter/pull/183097\')">PR #183097: AnimatedSize</div><div class="menu-dd-item" onclick="window.open(\'https://github.com/flutter/flutter/pull/183109\')">PR #183109: SizeTransition</div><div class="menu-dd-item" onclick="window.open(\'https://github.com/flutter/flutter/pull/184545\')">PR #184545: CupertinoTextField</div><div class="menu-dd-item" onclick="window.open(\'https://github.com/flutter/flutter/pull/184569\')">PR #184569: Material Widgets</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="closeWindow(\'flutter\')">Close Window<span class="shortcut">⌘W</span></div>',
    go: '<div class="menu-dd-item" onclick="window.open(\'https://github.com/flutter/flutter\')">Flutter Repository</div><div class="menu-dd-item" onclick="window.open(\'https://flutter.dev\')">flutter.dev</div>'
  },
  speaking: {
    name: 'Speaking',
    nameMenu: '<div class="menu-dd-item disabled">10+ Events, GDG Mentor</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="window.open(\'https://x.com/GDGKolachi\')">GDG Kolachi</div>',
    file: '<div class="menu-dd-item" onclick="window.open(\'https://www.facebook.com/GDGKolachi/posts/720743396758626/\')">Google I/O Extended</div><div class="menu-dd-item" onclick="window.open(\'https://gdg.community.dev/events/details/google-gdg-kolachi-presents-flutter-bootcamp/\')">Flutter Bootcamp</div><div class="menu-dd-item" onclick="window.open(\'https://medium.com/devncode/devncode-meetup-iv-artificial-intelligence-df8c602de7d5\')">DevNCode Meetup IV</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="closeWindow(\'speaking\')">Close Window<span class="shortcut">⌘W</span></div>',
    go: '<div class="menu-dd-item" onclick="window.open(\'https://linkedin.com/in/ishaquehassan\')">LinkedIn</div>'
  },
  oss: {
    name: 'Open Source',
    nameMenu: '<div class="menu-dd-item disabled">9.8K+ Contributions, 64 Stars</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="window.open(\'https://github.com/ishaquehassan?tab=repositories\')">All Repositories</div>',
    file: '<div class="menu-dd-item" onclick="window.open(\'https://github.com/ishaquehassan/document_scanner_flutter\')">document_scanner_flutter</div><div class="menu-dd-item" onclick="window.open(\'https://github.com/ishaquehassan/flutter_alarm_background_trigger\')">flutter_alarm_background_trigger</div><div class="menu-dd-item" onclick="window.open(\'https://github.com/ishaquehassan/assets_indexer\')">assets_indexer</div><div class="menu-dd-item" onclick="window.open(\'https://github.com/ishaquehassan/nadra_verisys_flutter\')">nadra_verisys_flutter</div><div class="menu-dd-item" onclick="window.open(\'https://github.com/ishaquehassan/goal-agent\')">goal-agent</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="closeWindow(\'oss\')">Close Window<span class="shortcut">⌘W</span></div>',
    go: '<div class="menu-dd-item" onclick="window.open(\'https://github.com/ishaquehassan\')">GitHub Profile</div><div class="menu-dd-item" onclick="navigate(\'flutter\')">Flutter PRs</div>'
  },
  tech: {
    name: 'Tech Stack',
    nameMenu: '<div class="menu-dd-item disabled">21 Technologies</div><div class="menu-dd-sep"></div><div class="menu-dd-item disabled">Mobile, Backend, Database, DevOps</div>',
    file: '<div class="menu-dd-item" onclick="window.open(\'https://flutter.dev\')">Flutter</div><div class="menu-dd-item" onclick="window.open(\'https://dart.dev\')">Dart</div><div class="menu-dd-item" onclick="window.open(\'https://firebase.google.com\')">Firebase</div><div class="menu-dd-item" onclick="window.open(\'https://nodejs.org\')">Node.js</div><div class="menu-dd-item" onclick="window.open(\'https://python.org\')">Python</div><div class="menu-dd-item" onclick="window.open(\'https://go.dev\')">Go</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="closeWindow(\'tech\')">Close Window<span class="shortcut">⌘W</span></div>',
    go: '<div class="menu-dd-item" onclick="navigate(\'oss\')">Open Source</div><div class="menu-dd-item" onclick="navigate(\'flutter\')">Flutter PRs</div>'
  },
  articles: {
    name: 'Medium',
    nameMenu: '<div class="menu-dd-item disabled">@ishaqhassan on Medium</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="window.open(\'https://medium.com/@ishaqhassan\')">Visit Profile on Medium</div>',
    file: '<div class="menu-dd-item" onclick="window.open(\'https://medium.com/@ishaqhassan/dart-isolates-the-missing-guide-for-production-flutter-apps-66ed990ced3e\')">Dart Isolates: The Missing Guide</div><div class="menu-dd-item" onclick="window.open(\'https://medium.com/@ishaqhassan/how-flutters-three-tree-architecture-actually-works-953c8cc17226\')">Flutter Three-Tree Architecture</div><div class="menu-dd-item" onclick="window.open(\'https://medium.com/@ishaqhassan/how-i-got-my-pull-requests-merged-into-flutters-official-repository-98d055f3270e\')">PRs Merged Into Flutter</div><div class="menu-dd-item" onclick="window.open(\'https://medium.com/nerd-for-tech/a-journey-with-flutter-native-plugin-development-for-ios-android-3f0dd4ab8061\')">Flutter Native Plugin Dev</div><div class="menu-dd-item" onclick="window.open(\'https://medium.com/nerd-for-tech/indexing-assets-in-a-dart-class-just-like-r-java-flutter-3febf558a2bb\')">Indexing Assets in Dart</div><div class="menu-dd-item" onclick="window.open(\'https://medium.com/@ishaqhassan/firebase-cloud-functions-using-kotlin-55631dd43f67\')">Firebase Cloud Functions</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="closeWindow(\'articles\')">Close Window<span class="shortcut">⌘W</span></div>',
    go: '<div class="menu-dd-item" onclick="window.open(\'https://medium.com/@ishaqhassan\')">Medium Profile</div><div class="menu-dd-item" onclick="navigate(\'flutter\')">Flutter PRs</div>'
  },
  contact: {
    name: 'Contact',
    nameMenu: '<div class="menu-dd-item disabled">Let\'s Build Something Together</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="window.open(\'mailto:hello@ishaqhassan.dev\')">hello@ishaqhassan.dev</div>',
    file: '<div class="menu-dd-item" onclick="window.open(\'mailto:hello@ishaqhassan.dev\')">Send Email</div><div class="menu-dd-item" onclick="window.open(\'https://github.com/ishaquehassan\')">GitHub</div><div class="menu-dd-item" onclick="window.open(\'https://linkedin.com/in/ishaquehassan\')">LinkedIn</div><div class="menu-dd-item" onclick="window.open(\'https://medium.com/@ishaqhassan\')">Medium</div><div class="menu-dd-item" onclick="window.open(\'https://stackoverflow.com/users/2094696/ishaq-hassan\')">Stack Overflow</div><div class="menu-dd-item" onclick="window.open(\'https://ishaqhassan.dev\')">Website</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="closeWindow(\'contact\')">Close Window<span class="shortcut">⌘W</span></div>',
    go: '<div class="menu-dd-item" onclick="navigate(\'github\')">GitHub Window</div><div class="menu-dd-item" onclick="navigate(\'linkedin\')">LinkedIn Window</div>'
  },
  github: {
    name: 'GitHub',
    nameMenu: '<div class="menu-dd-item disabled">@ishaquehassan</div><div class="menu-dd-item disabled">213 followers, 170 repos</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="window.open(\'https://github.com/ishaquehassan\')">Open in Browser</div>',
    file: '<div class="menu-dd-item" onclick="window.open(\'https://github.com/ishaquehassan?tab=repositories\')">Repositories</div><div class="menu-dd-item" onclick="window.open(\'https://github.com/ishaquehassan?tab=stars\')">Stars</div><div class="menu-dd-item" onclick="window.open(\'https://github.com/ishaquehassan?tab=followers\')">Followers</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="closeWindow(\'github\')">Close Window<span class="shortcut">⌘W</span></div>',
    go: '<div class="menu-dd-item" onclick="navigate(\'oss\')">Open Source</div><div class="menu-dd-item" onclick="navigate(\'flutter\')">Flutter PRs</div>'
  },
  linkedin: {
    name: 'LinkedIn',
    nameMenu: '<div class="menu-dd-item disabled">@ishaquehassan</div><div class="menu-dd-item disabled">Engineering Manager</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="window.open(\'https://linkedin.com/in/ishaquehassan\')">Open in Browser</div>',
    file: '<div class="menu-dd-item" onclick="window.open(\'https://linkedin.com/in/ishaquehassan\')">View Profile</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="closeWindow(\'linkedin\')">Close Window<span class="shortcut">⌘W</span></div>',
    go: '<div class="menu-dd-item" onclick="navigate(\'speaking\')">Speaking</div>'
  },
  snake: {
    name: 'Snake Neon',
    nameMenu: '<div class="menu-dd-item disabled">Arcade Game</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="snakeReset()">New Game</div>',
    file: '<div class="menu-dd-item" onclick="snakeReset()">New Game</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="closeWindow(\'snake\')">Close Window<span class="shortcut">⌘W</span></div>',
    go: '<div class="menu-dd-item" onclick="navigate(\'about\')">Terminal</div>'
  },
  'flutter-course': {
    name: 'Flutter Course',
    nameMenu: '<div class="menu-dd-item disabled">35 Videos, 7 Sections, Urdu</div><div class="menu-dd-item disabled">by Tech Idara</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="window.open(\'https://docs.flutter.dev/resources/courses\')">Listed on Flutter Docs</div>',
    file: '<div class="menu-dd-item" onclick="window.open(\'https://www.youtube.com/playlist?list=PLX97VxArfzkmXeUqUxeKW7XS8oYraH7A5\')">Open YouTube Playlist</div><div class="menu-dd-item" onclick="window.open(\'https://docs.flutter.dev/resources/courses\')">Flutter Docs Courses</div><div class="menu-dd-item" onclick="window.open(\'https://www.youtube.com/@ishaquehassan\')">YouTube Channel</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="closeWindow(\'flutter-course\')">Close Window<span class="shortcut">⌘W</span></div>',
    go: '<div class="menu-dd-item" onclick="navigate(\'flutter\')">Flutter PRs</div><div class="menu-dd-item" onclick="navigate(\'articles\')">Articles</div>'
  },
  'fc-player': {
    name: 'Video Player',
    nameMenu: '<div class="menu-dd-item disabled">Flutter Course Player</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="navigate(\'flutter-course\')">Back to Library</div>',
    file: '<div class="menu-dd-item" onclick="closeFcPlayer()">Close Player<span class="shortcut">⌘W</span></div>',
    go: '<div class="menu-dd-item" onclick="navigate(\'flutter-course\')">Course Library</div>'
  }
};

var currentMenuApp = null;

function updateMenuBarForWindow(winId) {
  // Find topmost window if winId is null
  if (!winId) {
    var topZ = 0, topId = null;
    document.querySelectorAll('.window.open').forEach(function(w) {
      var z = parseInt(w.style.zIndex) || 0;
      if (z > topZ) { topZ = z; topId = w.id.replace('win-', ''); }
    });
    winId = topId;
  }

  var menu = winId ? (appMenus[winId] || null) : null;
  var cfg = menu || menuBarDefault;
  if (currentMenuApp === winId) return;
  currentMenuApp = winId;

  // Update app name
  var nameEl = document.querySelector('[data-menu="name"] .menu-item');
  if (nameEl) {
    nameEl.style.transition = 'opacity 0.2s';
    nameEl.style.opacity = '0';
    setTimeout(function() {
      nameEl.textContent = cfg.name || menuBarDefault.name;
      nameEl.classList.toggle('bold', !menu);
      nameEl.style.opacity = '1';
    }, 150);
  }

  // Update name dropdown
  var nameMenu = document.getElementById('menu-name');
  if (nameMenu) nameMenu.innerHTML = menu ? (cfg.nameMenu || '<div class="menu-dd-item disabled">' + cfg.name + '</div>') : menuBarDefault.nameMenu;

  // Update File menu
  var fileMenu = document.getElementById('menu-file');
  if (fileMenu) fileMenu.innerHTML = cfg.file || menuBarDefault.file;

  // Update View menu
  var viewMenu = document.getElementById('menu-view');
  if (viewMenu) viewMenu.innerHTML = (cfg.view || '<div class="menu-dd-item" onclick="openAllWindows()">Open All Windows</div>') + '<div class="menu-dd-item" onclick="toggleMissionControl()">Mission Control<span class="shortcut">F3</span></div>';

  // Update Go menu
  var defaultGo = '<div class="menu-dd-item" onclick="window.open(\'https://github.com/ishaquehassan\')">GitHub<span class="shortcut">⇧⌘G</span></div><div class="menu-dd-item" onclick="window.open(\'https://linkedin.com/in/ishaquehassan\')">LinkedIn<span class="shortcut">⇧⌘L</span></div><div class="menu-dd-item" onclick="window.open(\'https://medium.com/@ishaqhassan\')">Medium<span class="shortcut">⇧⌘M</span></div><div class="menu-dd-item" onclick="window.open(\'https://stackoverflow.com/users/2094696/ishaq-hassan\')">Stack Overflow</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="window.open(\'mailto:hello@ishaqhassan.dev\')">Email</div>';
  var goMenu = document.getElementById('menu-go');
  if (goMenu) goMenu.innerHTML = cfg.go || defaultGo;
}

