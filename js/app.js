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

  if (navigator.storage && navigator.storage.estimate) {
    navigator.storage.estimate().then(est => {
      const totalGB = (est.quota / (1024 * 1024 * 1024)).toFixed(0);
      const usedGB = (est.usage / (1024 * 1024 * 1024)).toFixed(1);
      document.getElementById('about-disk').textContent = usedGB + ' GB / ' + totalGB + ' GB available';
    });
  } else {
    document.getElementById('about-disk').textContent = 'Not Available';
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
  document.getElementById('about-dialog-overlay').classList.add('show');
}
function closeAboutDialog() {
  document.getElementById('about-dialog-overlay').classList.remove('show');
}

// ===== MENUBAR DROPDOWNS =====
let activeMenu = null;
let activeParent = null;

function closeActiveMenu() {
  if (activeMenu) activeMenu.classList.remove('show');
  if (activeParent) activeParent.classList.remove('open');
  activeMenu = null;
  activeParent = null;
}

function openMenu(parent) {
  const menu = parent.querySelector('.menu-dropdown');
  if (!menu) return;
  if (activeMenu === menu) { closeActiveMenu(); return; }
  closeActiveMenu();
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
    const menu = parent.querySelector('.menu-dropdown');
    if (menu && menu !== activeMenu) openMenu(parent);
  });
});

// Click outside to close
document.addEventListener('mousedown', (e) => {
  if (activeMenu && !e.target.closest('.menu-parent')) closeActiveMenu();
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

// ===== CLOCK =====
function updateClock() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2,'0');
  const m = now.getMinutes().toString().padStart(2,'0');
  document.getElementById('clock-time').textContent = `${h}:${m}`;
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

function openWindow(id) {
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

  // Smart position: find empty space or offset stack
  const pos = findSmartPosition(win);
  win.style.top = pos.top + 'px';
  win.style.left = pos.left + 'px';
  if (pos.tileW && pos.tileH) {
    win.style.width = pos.tileW + 'px';
    win.style.height = pos.tileH + 'px';
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
    { type: 'out', text: '  ✅ <span class="str">3 PRs merged</span> into flutter/flutter (official framework)' },
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
  {id:'DB51xmXlaX4',t:'Basics Of Computers & Why Flutter',s:'Dart Basics'},
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
const fcSectionOrder = ['Dart Basics','OOP','Foundation','Flutter UI','State Management','API & Network','Advanced'];
let fcCurrentVideo = null;
let fcGridRendered = false;

function initFlutterCourse() {
  if (!fcGridRendered) {
    renderFlutterCourseGrid();
    fcGridRendered = true;
  }
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
    return '<div class="fc-section"><div class="fc-section-header" onclick="this.parentElement.classList.toggle(\'collapsed\')"><span>' + s + '</span><div class="fc-section-right"><span class="fc-section-count">' + vids.length + ' videos</span><span class="fc-collapse-icon">▼</span></div></div><div class="fc-videos-grid">' + vids.map(v =>
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
  document.getElementById('fc-pw-iframe').src = 'https://www.youtube.com/embed/' + v.id + '?autoplay=1&rel=0&enablejsapi=1' + (startTime > 5 ? '&start=' + Math.floor(startTime) : '');
  document.getElementById('fc-pw-title').textContent = v.t;
  document.getElementById('fc-pw-counter').textContent = (i + 1) + ' / ' + fcVideos.length;
  document.getElementById('fc-pw-section').textContent = v.s;
  document.getElementById('fc-pw-vidnum').textContent = v.t;
  document.getElementById('fc-pw-prev').disabled = i === 0;
  document.getElementById('fc-pw-next').disabled = i === fcVideos.length - 1;
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
  {t:'Articles',s:'Blog Posts, Medium, Writing',w:'articles',cat:'Applications',icon:'📝',p:100},
  {t:'Contact',s:'Email, Social Links',w:'contact',cat:'Applications',icon:'✉️',p:100},
  {t:'GitHub',s:'Profile, Repositories, Contributions',w:'github',cat:'Applications',icon:'🐙',p:100},
  {t:'LinkedIn',s:'Professional Profile, Network',w:'linkedin',cat:'Applications',icon:'💼',p:100},
  {t:'Snake Game',s:'Neon Arcade Game',w:'snake',cat:'Applications',icon:'🎮',p:100},
  {t:'Flutter Course',s:'35 Videos, Urdu, Tech Idara',w:'flutter-course',cat:'Applications',icon:'🎬',p:100},

  // Flutter PRs
  {t:'Fix AnimatedCrossFade clipBehavior forwarding',s:'flutter/flutter #183081, Merged',w:'flutter',cat:'Contributions',icon:'🔀',el:'#win-flutter .pr-card:nth-child(1)',p:70},
  {t:'Forward clipBehavior in AnimatedSize widget',s:'flutter/flutter #183097, Merged',w:'flutter',cat:'Contributions',icon:'🔀',el:'#win-flutter .pr-card:nth-child(2)',p:70},
  {t:'Add clipBehavior to SizeTransition widget',s:'flutter/flutter #183109, Merged',w:'flutter',cat:'Contributions',icon:'🔀',el:'#win-flutter .pr-card:nth-child(3)',p:70},
  {t:'Expose decoration properties in CupertinoTextField',s:'flutter/flutter #184545, Approved',w:'flutter',cat:'Contributions',icon:'🔀',el:'#win-flutter .pr-card:nth-child(4)',p:70},
  {t:'Add missing property forwarding in Material widgets',s:'flutter/flutter #184569, Approved',w:'flutter',cat:'Contributions',icon:'🔀',el:'#win-flutter .pr-card:nth-child(5)',p:70},

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
      openWindow(item.w);
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

// Poll YouTube iframe for current time via postMessage
var fcProgressInterval = null;
function startProgressTracking() {
  clearInterval(fcProgressInterval);
  fcProgressInterval = setInterval(function() {
    if (fcCurrentVideo === null) { clearInterval(fcProgressInterval); return; }
    var iframe = document.getElementById('fc-pw-iframe');
    if (!iframe) iframe = document.querySelector('.mfc-player-iframe');
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.postMessage('{"event":"command","func":"getCurrentTime","args":""}', '*');
      } catch(e) {}
    }
  }, 5000);
}

window.addEventListener('message', function(e) {
  if (!e.data || typeof e.data !== 'string') return;
  try {
    var msg = JSON.parse(e.data);
    if (msg.event === 'infoDelivery' && msg.info && typeof msg.info.currentTime === 'number') {
      if (fcCurrentVideo !== null && msg.info.currentTime > 0) {
        saveVideoProgress(fcCurrentVideo, msg.info.currentTime);
      }
    }
  } catch(e) {}
});

// Start tracking when video plays
var origPlayFcVideo = playFcVideo;
playFcVideo = function(i) { origPlayFcVideo(i); startProgressTracking(); };
var origPlayMfcVideo = playMfcVideo;
playMfcVideo = function(i, evt) { origPlayMfcVideo(i, evt); startProgressTracking(); };

/* ===== WINDOW STATE PERSISTENCE (localStorage) ===== */
var winStateKey = 'ishaq_win_state';

function saveWindowStates() {
  var state = {};
  var allIds = ['about','flutter','speaking','oss','tech','articles','contact','github','linkedin','snake','flutter-course','fc-player'];
  allIds.forEach(function(id) {
    var win = document.getElementById('win-' + id);
    if (!win) return;
    if (openWindows[id]) {
      state[id] = {
        open: true,
        top: win.style.top,
        left: win.style.left,
        width: win.style.width,
        height: win.style.height,
        z: win.style.zIndex
      };
    }
  });
  try { localStorage.setItem(winStateKey, JSON.stringify(state)); } catch(e) {}
}

function restoreWindowStates() {
  try {
    var state = JSON.parse(localStorage.getItem(winStateKey));
    if (!state) return;
    Object.keys(state).forEach(function(id) {
      var s = state[id];
      if (!s.open) return;
      var win = document.getElementById('win-' + id);
      if (!win) return;
      // Restore position, clamp to viewport
      if (s.top) win.style.top = s.top;
      if (s.left) win.style.left = s.left;
      if (s.width) win.style.width = s.width;
      if (s.height) win.style.height = s.height;
      clampWindowToViewport(win);
      openWindow(id);
      if (s.z) win.style.zIndex = s.z;
    });
  } catch(e) {}
}

function clampWindowToViewport(win) {
  var menuH = 28;
  var dockH = 80;
  var t = parseInt(win.style.top) || 0;
  var l = parseInt(win.style.left) || 0;
  var w = win.offsetWidth || parseInt(win.style.width) || 400;
  var h = win.offsetHeight || parseInt(win.style.height) || 300;

  // Shrink window if larger than viewport
  if (w > window.innerWidth) { w = window.innerWidth - 20; win.style.width = w + 'px'; }
  if (h > window.innerHeight - menuH - dockH) { h = window.innerHeight - menuH - dockH; win.style.height = h + 'px'; }

  // Keep fully inside viewport
  if (l < 0) l = 0;
  if (l + w > window.innerWidth) l = window.innerWidth - w;
  if (t < menuH) t = menuH;
  if (t + h > window.innerHeight - dockH) t = window.innerHeight - dockH - h;

  win.style.transition = 'top 0.3s, left 0.3s, width 0.3s, height 0.3s';
  win.style.top = t + 'px';
  win.style.left = l + 'px';
  setTimeout(function() { win.style.transition = ''; }, 350);
}

// Save state periodically and on close/open
setInterval(saveWindowStates, 3000);
window.addEventListener('beforeunload', saveWindowStates);

// Clamp all windows on resize
window.addEventListener('resize', function() {
  var allIds = ['about','flutter','speaking','oss','tech','articles','contact','github','linkedin','snake','flutter-course','fc-player'];
  allIds.forEach(function(id) {
    if (!openWindows[id]) return;
    var win = document.getElementById('win-' + id);
    if (win) clampWindowToViewport(win);
  });
});

// Restore windows after boot
document.addEventListener('DOMContentLoaded', function() {
  var checkBoot = setInterval(function() {
    var boot = document.getElementById('boot-screen');
    if (!boot || boot.style.display === 'none' || boot.classList.contains('hidden') || getComputedStyle(boot).display === 'none') {
      clearInterval(checkBoot);
      setTimeout(restoreWindowStates, 500);
    }
  }, 500);
});

/* ===== DYNAMIC MENUBAR (per-window, macOS style) ===== */
var menuBarDefault = {
  name: 'Ishaq Hassan',
  nameMenu: '<div class="menu-dd-item disabled">Flutter Framework Contributor</div><div class="menu-dd-item disabled">Engineering Manager @ DigitalHire</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="window.open(\'https://github.com/ishaquehassan\')">GitHub Profile</div><div class="menu-dd-item" onclick="window.open(\'https://linkedin.com/in/ishaquehassan\')">LinkedIn Profile</div><div class="menu-dd-item" onclick="window.open(\'https://medium.com/@ishaqhassan\')">Medium Blog</div>',
  file: '<div class="menu-dd-item" onclick="openWindow(\'flutter\')">Flutter Contributions<span class="shortcut">⌘1</span></div><div class="menu-dd-item" onclick="openWindow(\'oss\')">Open Source Projects<span class="shortcut">⌘2</span></div><div class="menu-dd-item" onclick="openWindow(\'articles\')">Articles & Writing<span class="shortcut">⌘3</span></div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="openWindow(\'tech\')">Tech Stack</div><div class="menu-dd-item" onclick="openWindow(\'speaking\')">Speaking Events</div><div class="menu-dd-item" onclick="openWindow(\'experience\')">Experience</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="closeAllWindows()">Close All Windows<span class="shortcut">⌘W</span></div>',
  view: '<div class="menu-dd-item" onclick="openAllWindows()">Open All Windows</div><div class="menu-dd-item" onclick="toggleMissionControl()">Mission Control<span class="shortcut">F3</span></div>'
};

var appMenus = {
  about: {
    name: 'Terminal',
    nameMenu: '<div class="menu-dd-item disabled">ishaq@dev: ~</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="openWindow(\'about\')">New Terminal Window</div><div class="menu-dd-item" onclick="closeWindow(\'about\')">Close Terminal</div>',
    file: '<div class="menu-dd-item" onclick="closeWindow(\'about\')">Close Window<span class="shortcut">⌘W</span></div>',
    go: '<div class="menu-dd-item" onclick="openWindow(\'github\')">GitHub</div><div class="menu-dd-item" onclick="openWindow(\'contact\')">Contact</div>'
  },
  flutter: {
    name: 'Flutter PRs',
    nameMenu: '<div class="menu-dd-item disabled">3 Merged, 2 Approved</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="window.open(\'https://github.com/flutter/flutter/pulls?q=author:ishaquehassan\')">View All on GitHub</div>',
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
    go: '<div class="menu-dd-item" onclick="window.open(\'https://github.com/ishaquehassan\')">GitHub Profile</div><div class="menu-dd-item" onclick="openWindow(\'flutter\')">Flutter PRs</div>'
  },
  tech: {
    name: 'Tech Stack',
    nameMenu: '<div class="menu-dd-item disabled">21 Technologies</div><div class="menu-dd-sep"></div><div class="menu-dd-item disabled">Mobile, Backend, Database, DevOps</div>',
    file: '<div class="menu-dd-item" onclick="window.open(\'https://flutter.dev\')">Flutter</div><div class="menu-dd-item" onclick="window.open(\'https://dart.dev\')">Dart</div><div class="menu-dd-item" onclick="window.open(\'https://firebase.google.com\')">Firebase</div><div class="menu-dd-item" onclick="window.open(\'https://nodejs.org\')">Node.js</div><div class="menu-dd-item" onclick="window.open(\'https://python.org\')">Python</div><div class="menu-dd-item" onclick="window.open(\'https://go.dev\')">Go</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="closeWindow(\'tech\')">Close Window<span class="shortcut">⌘W</span></div>',
    go: '<div class="menu-dd-item" onclick="openWindow(\'oss\')">Open Source</div><div class="menu-dd-item" onclick="openWindow(\'flutter\')">Flutter PRs</div>'
  },
  articles: {
    name: 'Articles',
    nameMenu: '<div class="menu-dd-item disabled">Published on Medium</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="window.open(\'https://medium.com/@ishaqhassan\')">View All on Medium</div>',
    file: '<div class="menu-dd-item" onclick="window.open(\'https://medium.com/@ishaqhassan/dart-isolates-the-missing-guide-for-production-flutter-apps-66ed990ced3e\')">Dart Isolates: The Missing Guide</div><div class="menu-dd-item" onclick="window.open(\'https://medium.com/@ishaqhassan/how-flutters-three-tree-architecture-actually-works-953c8cc17226\')">Flutter Three-Tree Architecture</div><div class="menu-dd-item" onclick="window.open(\'https://medium.com/@ishaqhassan/how-i-got-my-pull-requests-merged-into-flutters-official-repository-98d055f3270e\')">PRs Merged Into Flutter</div><div class="menu-dd-item" onclick="window.open(\'https://medium.com/nerd-for-tech/a-journey-with-flutter-native-plugin-development-for-ios-android-3f0dd4ab8061\')">Flutter Native Plugin Dev</div><div class="menu-dd-item" onclick="window.open(\'https://medium.com/nerd-for-tech/indexing-assets-in-a-dart-class-just-like-r-java-flutter-3febf558a2bb\')">Indexing Assets in Dart</div><div class="menu-dd-item" onclick="window.open(\'https://medium.com/@ishaqhassan/firebase-cloud-functions-using-kotlin-55631dd43f67\')">Firebase Cloud Functions</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="closeWindow(\'articles\')">Close Window<span class="shortcut">⌘W</span></div>',
    go: '<div class="menu-dd-item" onclick="window.open(\'https://medium.com/@ishaqhassan\')">Medium Profile</div><div class="menu-dd-item" onclick="openWindow(\'flutter\')">Flutter PRs</div>'
  },
  contact: {
    name: 'Contact',
    nameMenu: '<div class="menu-dd-item disabled">Let\'s Build Something Together</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="window.open(\'mailto:hello@ishaqhassan.dev\')">hello@ishaqhassan.dev</div>',
    file: '<div class="menu-dd-item" onclick="window.open(\'mailto:hello@ishaqhassan.dev\')">Send Email</div><div class="menu-dd-item" onclick="window.open(\'https://github.com/ishaquehassan\')">GitHub</div><div class="menu-dd-item" onclick="window.open(\'https://linkedin.com/in/ishaquehassan\')">LinkedIn</div><div class="menu-dd-item" onclick="window.open(\'https://medium.com/@ishaqhassan\')">Medium</div><div class="menu-dd-item" onclick="window.open(\'https://stackoverflow.com/users/2094696/ishaq-hassan\')">Stack Overflow</div><div class="menu-dd-item" onclick="window.open(\'https://ishaqhassan.dev\')">Website</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="closeWindow(\'contact\')">Close Window<span class="shortcut">⌘W</span></div>',
    go: '<div class="menu-dd-item" onclick="openWindow(\'github\')">GitHub Window</div><div class="menu-dd-item" onclick="openWindow(\'linkedin\')">LinkedIn Window</div>'
  },
  github: {
    name: 'GitHub',
    nameMenu: '<div class="menu-dd-item disabled">@ishaquehassan</div><div class="menu-dd-item disabled">213 followers, 170 repos</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="window.open(\'https://github.com/ishaquehassan\')">Open in Browser</div>',
    file: '<div class="menu-dd-item" onclick="window.open(\'https://github.com/ishaquehassan?tab=repositories\')">Repositories</div><div class="menu-dd-item" onclick="window.open(\'https://github.com/ishaquehassan?tab=stars\')">Stars</div><div class="menu-dd-item" onclick="window.open(\'https://github.com/ishaquehassan?tab=followers\')">Followers</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="closeWindow(\'github\')">Close Window<span class="shortcut">⌘W</span></div>',
    go: '<div class="menu-dd-item" onclick="openWindow(\'oss\')">Open Source</div><div class="menu-dd-item" onclick="openWindow(\'flutter\')">Flutter PRs</div>'
  },
  linkedin: {
    name: 'LinkedIn',
    nameMenu: '<div class="menu-dd-item disabled">@ishaquehassan</div><div class="menu-dd-item disabled">Engineering Manager</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="window.open(\'https://linkedin.com/in/ishaquehassan\')">Open in Browser</div>',
    file: '<div class="menu-dd-item" onclick="window.open(\'https://linkedin.com/in/ishaquehassan\')">View Profile</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="closeWindow(\'linkedin\')">Close Window<span class="shortcut">⌘W</span></div>',
    go: '<div class="menu-dd-item" onclick="openWindow(\'speaking\')">Speaking</div>'
  },
  snake: {
    name: 'Snake Neon',
    nameMenu: '<div class="menu-dd-item disabled">Arcade Game</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="snakeReset()">New Game</div>',
    file: '<div class="menu-dd-item" onclick="snakeReset()">New Game</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="closeWindow(\'snake\')">Close Window<span class="shortcut">⌘W</span></div>',
    go: '<div class="menu-dd-item" onclick="openWindow(\'about\')">Terminal</div>'
  },
  'flutter-course': {
    name: 'Flutter Course',
    nameMenu: '<div class="menu-dd-item disabled">35 Videos, 7 Sections, Urdu</div><div class="menu-dd-item disabled">by Tech Idara</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="window.open(\'https://docs.flutter.dev/resources/courses\')">Listed on Flutter Docs</div>',
    file: '<div class="menu-dd-item" onclick="window.open(\'https://www.youtube.com/playlist?list=PLX97VxArfzkmXeUqUxeKW7XS8oYraH7A5\')">Open YouTube Playlist</div><div class="menu-dd-item" onclick="window.open(\'https://docs.flutter.dev/resources/courses\')">Flutter Docs Courses</div><div class="menu-dd-item" onclick="window.open(\'https://www.youtube.com/@ishaquehassan\')">YouTube Channel</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="closeWindow(\'flutter-course\')">Close Window<span class="shortcut">⌘W</span></div>',
    go: '<div class="menu-dd-item" onclick="openWindow(\'flutter\')">Flutter PRs</div><div class="menu-dd-item" onclick="openWindow(\'articles\')">Articles</div>'
  },
  'fc-player': {
    name: 'Video Player',
    nameMenu: '<div class="menu-dd-item disabled">Flutter Course Player</div><div class="menu-dd-sep"></div><div class="menu-dd-item" onclick="openWindow(\'flutter-course\')">Back to Library</div>',
    file: '<div class="menu-dd-item" onclick="closeFcPlayer()">Close Player<span class="shortcut">⌘W</span></div>',
    go: '<div class="menu-dd-item" onclick="openWindow(\'flutter-course\')">Course Library</div>'
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

