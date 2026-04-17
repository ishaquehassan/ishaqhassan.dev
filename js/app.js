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

// Click dropdown item to close menu and execute
document.querySelectorAll('.menu-dd-item:not(.disabled)').forEach(item => {
  item.addEventListener('click', (e) => {
    e.stopPropagation();
    closeActiveMenu();
  });
});

function openAllWindows() {
  ['about','flutter','speaking','experience','oss','tech','articles','contact','github','linkedin'].forEach((id, i) => {
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
  const menubarH = 28;
  const dockH = 80;
  const padding = 20;
  const areaW = window.innerWidth - padding * 2;
  const areaH = window.innerHeight - menubarH - dockH - padding * 2;
  const winW = parseInt(win.style.width) || 700;
  const winH = parseInt(win.style.height) || 560;

  // Collect rects of all currently open windows
  const openRects = [];
  document.querySelectorAll('.window.open').forEach(w => {
    if (w === win) return;
    openRects.push({
      x: parseInt(w.style.left) || w.offsetLeft,
      y: parseInt(w.style.top) || w.offsetTop,
      w: w.offsetWidth,
      h: w.offsetHeight
    });
  });

  if (openRects.length === 0) {
    // No windows open, center it
    return {
      top: menubarH + Math.max(0, (areaH - winH) / 2),
      left: padding + Math.max(0, (areaW - winW) / 2)
    };
  }

  // Try candidate positions: grid slots across available area
  const stepX = 80;
  const stepY = 60;
  let bestPos = null;
  let bestOverlap = Infinity;

  for (let y = menubarH + padding; y + winH < window.innerHeight - dockH; y += stepY) {
    for (let x = padding; x + winW < window.innerWidth - padding; x += stepX) {
      let totalOverlap = 0;
      for (const r of openRects) {
        const ox = Math.max(0, Math.min(x + winW, r.x + r.w) - Math.max(x, r.x));
        const oy = Math.max(0, Math.min(y + winH, r.y + r.h) - Math.max(y, r.y));
        totalOverlap += ox * oy;
      }
      if (totalOverlap < bestOverlap) {
        bestOverlap = totalOverlap;
        bestPos = { top: y, left: x };
        if (totalOverlap === 0) return bestPos;
      }
    }
  }

  // If still overlapping, offset from last opened window so stacking is visible
  if (bestOverlap > 0) {
    const last = openRects[openRects.length - 1];
    const offsetX = 30;
    const offsetY = 30;
    let nx = last.x + offsetX;
    let ny = last.y + offsetY;
    // Wrap around if going off screen
    if (nx + winW > window.innerWidth - padding) nx = padding + 40;
    if (ny + winH > window.innerHeight - dockH) ny = menubarH + padding + 40;
    return { top: ny, left: nx };
  }

  return bestPos || { top: menubarH + 40, left: padding + 40 };
}

function openWindow(id) {
  const win = document.getElementById('win-' + id);
  if (!win) return;

  // Bounce dock icon
  const dockItems = document.querySelectorAll('.dock-item');
  const names = ['about','flutter','speaking','experience','oss','tech','articles','contact','github','linkedin','snake','flutter-course'];
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

  win.addEventListener('mousedown', () => { win.style.zIndex = ++activeZ; });

  // Sync dock indicators
  if (typeof syncDockIndicators === 'function') syncDockIndicators();
}

function closeWindow(id) {
  const win = document.getElementById('win-' + id);
  if (!win) return;
  if (id === 'snake') snakeReset();
  win.classList.add('closing');
  setTimeout(() => {
    win.classList.remove('open','closing','hidden-desktop');
    delete openWindows[id];
    if (typeof syncDockIndicators === 'function') syncDockIndicators();
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

document.addEventListener('mousemove', (e) => {
  if (!dragEl) return;
  dragEl.style.left = (e.clientX - dragOffX) + 'px';
  dragEl.style.top = (e.clientY - dragOffY) + 'px';
  updateSnapPreview(e.clientX, e.clientY);
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
    { type: 'out', text: '  <span class="str">experience</span>: 13+ years in software development' },
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
    return '<div class="fc-section"><div class="fc-section-header" onclick="this.parentElement.classList.toggle(\'collapsed\')"><span>' + s + ' (' + vids.length + ')</span><span class="fc-collapse-icon">▼</span></div><div class="fc-videos-grid">' + vids.map(v =>
      '<div class="fc-video-card" onclick="playFcVideo(' + v.idx + ')"><div class="fc-thumb-wrap"><img class="fc-video-thumbnail" src="https://img.youtube.com/vi/' + v.id + '/mqdefault.jpg" alt="" loading="lazy"><div class="fc-play-overlay"><div class="fc-play-icon"></div></div></div><div class="fc-video-info"><div class="fc-video-num">Video ' + (v.idx + 1) + '</div><div class="fc-video-title">' + v.t + '</div></div></div>'
    ).join('') + '</div></div>';
  }).join('');
}

function playFcVideo(i) {
  if (i < 0 || i >= fcVideos.length) return;
  fcCurrentVideo = i;
  const v = fcVideos[i];
  document.getElementById('fc-grid-view').style.display = 'none';
  const pv = document.getElementById('fc-player-view');
  pv.style.display = 'flex';
  document.getElementById('fc-youtube-player').src = 'https://www.youtube.com/embed/' + v.id + '?autoplay=1&rel=0';
  document.getElementById('fc-ptitle').textContent = v.t;
  document.getElementById('fc-counter').textContent = 'Video ' + (i + 1) + ' of ' + fcVideos.length;
  document.getElementById('fc-title').textContent = 'Video ' + (i + 1) + ' of ' + fcVideos.length;
  document.getElementById('fc-prev').disabled = i === 0;
  document.getElementById('fc-next').disabled = i === fcVideos.length - 1;
}

function fcBackToList() {
  fcCurrentVideo = null;
  document.getElementById('fc-youtube-player').src = '';
  document.getElementById('fc-grid-view').style.display = 'flex';
  document.getElementById('fc-player-view').style.display = 'none';
  document.getElementById('fc-title').textContent = 'Flutter Course';
}

function fcNext() { if (fcCurrentVideo !== null && fcCurrentVideo < fcVideos.length - 1) playFcVideo(fcCurrentVideo + 1); }
function fcPrev() { if (fcCurrentVideo !== null && fcCurrentVideo > 0) playFcVideo(fcCurrentVideo - 1); }

// ===== MOBILE FLUTTER COURSE =====
function renderMobileFlutterCourseGrid() {
  const c = document.getElementById('mfc-content');
  if (!c) return;
  const g = fcGroupVideos();
  c.innerHTML = '<div class="mfc-badges"><span class="mfc-badge">35 Videos</span><span class="mfc-badge mfc-badge-urdu">Urdu</span></div>' +
    '<a href="https://docs.flutter.dev/resources/courses" target="_blank" class="mfc-verified-link"><div class="mfc-verified"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="#54c5f8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#54c5f8" stroke-width="2"/></svg><span>Listed on Official Flutter Documentation</span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="opacity:0.5;"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div></a>' +
    fcSectionOrder.filter(s => g[s]).map(s => {
      const vids = g[s];
      return '<div class="mfc-section"><div class="mfc-section-hdr" onclick="this.parentElement.classList.toggle(\'collapsed\')"><span>' + s + ' (' + vids.length + ')</span><span class="mfc-collapse">▼</span></div><div class="mfc-grid">' + vids.map(v =>
        '<div class="mfc-card" onclick="playMfcVideo(' + v.idx + ')"><img src="https://img.youtube.com/vi/' + v.id + '/mqdefault.jpg" alt="" loading="lazy"><div class="mfc-card-info"><div class="mfc-card-num">Video ' + (v.idx + 1) + '</div><div class="mfc-card-title">' + v.t + '</div></div></div>'
      ).join('') + '</div></div>';
    }).join('');
}

function playMfcVideo(i) {
  if (i < 0 || i >= fcVideos.length) return;
  fcCurrentVideo = i;
  const v = fcVideos[i];
  const c = document.getElementById('mfc-content');
  document.getElementById('mfc-title').textContent = 'Video ' + (i + 1);
  c.innerHTML = '<div class="mfc-player"><iframe class="mfc-player-iframe" src="https://www.youtube.com/embed/' + v.id + '?autoplay=1&rel=0&playsinline=1" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe><div class="mfc-player-title">' + v.t + '</div><div class="mfc-player-meta"><span class="mfc-badge mfc-badge-flutter">' + v.s + '</span><span class="mfc-player-counter">Video ' + (i + 1) + ' of ' + fcVideos.length + '</span></div></div><div class="mfc-player-nav"><button onclick="playMfcVideo(' + (i - 1) + ')"' + (i === 0 ? ' disabled' : '') + '>&#9664; Previous</button><button onclick="playMfcVideo(' + (i + 1) + ')"' + (i === fcVideos.length - 1 ? ' disabled' : '') + '>Next &#9654;</button></div>';
}

function mobileFlutterCourseBack() {
  if (fcCurrentVideo !== null) {
    fcCurrentVideo = null;
    document.getElementById('mfc-title').textContent = 'Flutter Course';
    renderMobileFlutterCourseGrid();
  } else {
    closeMobileSection('flutter-course');
  }
}

