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
  const names = ['about','flutter','speaking','experience','oss','tech','articles','contact','github','linkedin','snake'];
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

