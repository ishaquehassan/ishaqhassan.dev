// ===== WINDOW RESIZE =====
let resizeEl = null, resizeStartX = 0, resizeStartY = 0, resizeStartW = 0, resizeStartH = 0;

function initResize() {
  document.querySelectorAll('.window').forEach(win => {
    const handle = document.createElement('div');
    handle.className = 'window-resize';
    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      resizeEl = win;
      resizeStartX = e.clientX;
      resizeStartY = e.clientY;
      resizeStartW = win.offsetWidth;
      resizeStartH = win.offsetHeight;
      win.classList.add('resizing');
    });
    win.appendChild(handle);

    const exitBtn = document.createElement('button');
    exitBtn.className = 'exit-fullscreen';
    exitBtn.textContent = 'Exit Full Screen';
    exitBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const winId = win.id.replace('win-', '');
      if (win.classList.contains('maximized')) {
        maximizeWindow(winId);
      } else if (win.dataset.snapped) {
        const saved = windowStates[winId + '_snap'];
        if (saved) {
          win.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
          Object.assign(win.style, saved);
          setTimeout(() => win.style.transition = '', 300);
          delete windowStates[winId + '_snap'];
        }
        delete win.dataset.snapped;
      }
    });
    win.appendChild(exitBtn);
  });
}

document.addEventListener('mousemove', (e) => {
  if (!resizeEl) return;
  const w = Math.max(380, resizeStartW + (e.clientX - resizeStartX));
  const h = Math.max(280, resizeStartH + (e.clientY - resizeStartY));
  resizeEl.style.width = w + 'px';
  resizeEl.style.height = h + 'px';
});

document.addEventListener('mouseup', () => {
  if (resizeEl) resizeEl.classList.remove('resizing');
  resizeEl = null;
});

// ===== BOOT SEQUENCE =====
window.addEventListener('load', () => {
  const bar = document.getElementById('boot-bar');
  const screen = document.getElementById('boot-screen');

  let progress = 0;
  const bootInterval = setInterval(() => {
    progress += Math.random() * 15 + 5;
    if (progress >= 100) {
      progress = 100;
      clearInterval(bootInterval);
      setTimeout(() => {
        screen.classList.add('fade-out');
        setTimeout(() => {
          screen.style.display = 'none';
          initResize();
          initMusicPlayer();
          if (window.innerWidth > 768) setTimeout(() => showNotif('Welcome to Ishaq OS ✨'), 500);
          // GitHub contribution graph
          fetch('assets/github-contributions.json')
            .then(r => r.json())
            .then(data => {
              const graph = document.getElementById('gh-graph');
              const total = document.getElementById('gh-total');
              if (!graph) return;
              const weeks = data.weeks.slice(-26);
              weeks.forEach(week => {
                week.contributionDays.forEach(day => {
                  const cell = document.createElement('div');
                  cell.className = 'gh-cell';
                  const c = day.contributionCount;
                  if (c > 0) cell.dataset.level = c >= 30 ? 4 : c >= 15 ? 3 : c >= 5 ? 2 : 1;
                  cell.title = day.date + ': ' + c + ' contributions';
                  graph.appendChild(cell);
                });
              });
              if (total) total.textContent = data.totalContributions.toLocaleString() + ' contributions this year';
              // Mobile graph: calculate how many weeks fit
              const mobGraph = document.getElementById('mob-gh-graph');
              const mobTotal = document.getElementById('mob-gh-total');
              if (mobGraph) {
                mobGraph.innerHTML = '';
                const graphW = mobGraph.parentElement.clientWidth - 24;
                const cellSize = 6;
                const gap = 2;
                const colW = cellSize + gap;
                const maxWeeks = Math.floor(graphW / colW);
                const mobWeeks = data.weeks.slice(-maxWeeks);
                mobWeeks.forEach(week => {
                  const col = document.createElement('div');
                  col.style.cssText = 'display:flex;flex-direction:column;gap:'+gap+'px;';
                  week.contributionDays.forEach(day => {
                    const cell = document.createElement('div');
                    cell.style.cssText = 'width:'+cellSize+'px;height:'+cellSize+'px;border-radius:2px;background:rgba(255,255,255,0.04);';
                    const c = day.contributionCount;
                    if (c >= 30) cell.style.background = '#39d353';
                    else if (c >= 15) cell.style.background = '#26a641';
                    else if (c >= 5) cell.style.background = '#006d32';
                    else if (c > 0) cell.style.background = '#0e4429';
                    col.appendChild(cell);
                  });
                  mobGraph.appendChild(col);
                });
                if (mobTotal) mobTotal.textContent = data.totalContributions.toLocaleString() + ' contributions';
              }
            });
        }, 800);
      }, 300);
    }
    bar.style.width = progress + '%';
  }, 200);
});

// ===== WIDGET DRAG =====
let widgetDrag = null, wdOffX = 0, wdOffY = 0, wdMoved = false, wdStartX = 0, wdStartY = 0;

document.querySelectorAll('.widget').forEach(w => {
  w.addEventListener('mousedown', (e) => {
    if (e.target.closest('a')) return;
    wdStartX = e.clientX;
    wdStartY = e.clientY;
    wdMoved = false;
    const rect = w.getBoundingClientRect();
    wdOffX = e.clientX - rect.left;
    wdOffY = e.clientY - rect.top;
    widgetDrag = w;
    widgetDrag._rect = rect;
    e.preventDefault();
  });
});

document.addEventListener('mousemove', (e) => {
  if (!widgetDrag) return;
  const dx = Math.abs(e.clientX - wdStartX);
  const dy = Math.abs(e.clientY - wdStartY);
  // Only start drag after 8px movement
  if (!wdMoved && dx < 8 && dy < 8) return;
  if (!wdMoved) {
    wdMoved = true;
    const rect = widgetDrag._rect;
    widgetDrag.style.position = 'fixed';
    widgetDrag.style.left = rect.left + 'px';
    widgetDrag.style.top = rect.top + 'px';
    widgetDrag.style.width = rect.width + 'px';
    widgetDrag.classList.add('dragging');
  }
  widgetDrag.style.left = (e.clientX - wdOffX) + 'px';
  widgetDrag.style.top = (e.clientY - wdOffY) + 'px';
  updateSnapPreview(e.clientX, e.clientY);
});

document.addEventListener('mouseup', (e) => {
  if (widgetDrag) {
    if (currentSnapZone) {
      const g = snapGeometry(currentSnapZone);
      widgetDrag.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
      widgetDrag.style.left = g.left + 'px';
      widgetDrag.style.top = g.top + 'px';
      widgetDrag.style.width = g.width + 'px';
      widgetDrag.style.height = g.height + 'px';
      setTimeout(() => { widgetDrag.style.transition = ''; }, 350);
    }
    const preview = document.getElementById('snap-preview');
    if (preview) preview.classList.remove('active');
    currentSnapZone = null;
    widgetDrag.classList.remove('dragging');
    widgetDrag = null;
  }
});

// ===== DOCK MAGNIFICATION (Desktop only) =====
if (window.innerWidth > 768) {
  const dock = document.getElementById('dock');
  const icons = dock.querySelectorAll('.dock-icon');
  const maxScale = 1.5;
  const maxDist = 120;

  dock.addEventListener('mousemove', (e) => {
    icons.forEach(icon => {
      const rect = icon.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const dist = Math.abs(e.clientX - center);
      const ratio = Math.max(0, 1 - dist / maxDist);
      const scale = 1 + (maxScale - 1) * ratio * ratio;
      const ty = -(scale - 1) * 28;
      icon.style.transform = `scale(${scale}) translateY(${ty}px)`;
      icon.style.transition = 'transform 0.08s ease-out, box-shadow 0.15s';
      icon.style.boxShadow = ratio > 0.3 ? `0 ${8 * ratio}px ${20 * ratio}px rgba(0,0,0,${0.3 * ratio})` : '';
    });
  });

  dock.addEventListener('mouseleave', () => {
    icons.forEach(icon => {
      icon.style.transform = '';
      icon.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s';
      icon.style.boxShadow = '';
    });
  });
}


function expandMobileSection(section) {
  const map = {
    'experience': 'mobile-experience-expanded',
    'prs': 'mobile-prs-expanded',
    'speaking': 'mobile-speaking-expanded',
    'oss': 'mobile-oss-expanded',
    'tech': 'mobile-tech-expanded',
    'articles': 'mobile-articles-expanded',
    'connect': 'mobile-connect-expanded',
    'snake': 'mobile-snake-expanded',
    'github': 'mobile-github-expanded',
    'linkedin': 'mobile-linkedin-expanded',
    'medium': 'mobile-medium-expanded'
  };
  const elem = document.getElementById(map[section]);
  if (elem) {
    elem.style.display = 'block';
    if (section === 'snake') initMobSnake();
  }
}

function closeMobileSection(section) {
  const map = {
    'experience': 'mobile-experience-expanded',
    'prs': 'mobile-prs-expanded',
    'speaking': 'mobile-speaking-expanded',
    'oss': 'mobile-oss-expanded',
    'tech': 'mobile-tech-expanded',
    'articles': 'mobile-articles-expanded',
    'connect': 'mobile-connect-expanded',
    'snake': 'mobile-snake-expanded',
    'github': 'mobile-github-expanded',
    'linkedin': 'mobile-linkedin-expanded',
    'medium': 'mobile-medium-expanded'
  };
  const elem = document.getElementById(map[section]);
  if (elem) {
    elem.classList.add('closing');
    setTimeout(() => { elem.style.display = 'none'; elem.classList.remove('closing'); }, 250);
  }
}

// Update time on mobile status bar
function updateMobileTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const elem = document.getElementById('mobile-time');
  if (elem) elem.textContent = hours + ':' + mins;
}
setInterval(updateMobileTime, 60000);
updateMobileTime();

// ===== CURSOR SPOTLIGHT (Desktop only) =====
if (window.innerWidth > 768) {
  const spotlight = document.getElementById('cursor-spotlight');
  if (spotlight) {
    let spotX = 0, spotY = 0, currentX = 0, currentY = 0;
    document.addEventListener('mousemove', (e) => {
      spotX = e.clientX;
      spotY = e.clientY;
      spotlight.classList.add('active');
    });
    document.addEventListener('mouseleave', () => spotlight.classList.remove('active'));

    function animateSpotlight() {
      currentX += (spotX - currentX) * 0.08;
      currentY += (spotY - currentY) * 0.08;
      spotlight.style.left = currentX + 'px';
      spotlight.style.top = currentY + 'px';
      requestAnimationFrame(animateSpotlight);
    }
    animateSpotlight();
  }
}

// ===== PARTICLE SYSTEM (Desktop only) =====
if (window.innerWidth > 768) {
  const canvas = document.getElementById('particle-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouseX = 0, mouseY = 0;
    let animFrame;

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.hue = Math.random() * 60 + 180; // cyan to purple range
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Mouse repulsion
        const dx = this.x - mouseX;
        const dy = this.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const force = (150 - dist) / 150;
          this.x += (dx / dist) * force * 2;
          this.y += (dy / dist) * force * 2;
        }

        // Wrap around
        if (this.x < -10) this.x = canvas.width + 10;
        if (this.x > canvas.width + 10) this.x = -10;
        if (this.y < -10) this.y = canvas.height + 10;
        if (this.y > canvas.height + 10) this.y = -10;
      }
      draw() {
        // Twinkle effect
        const twinkle = Math.sin(Date.now() * 0.003 + this.x * 0.1) * 0.3 + 0.7;
        const finalOpacity = this.opacity * twinkle;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 80%, 70%, ${finalOpacity})`;
        ctx.fill();
        // Add glow to larger particles
        if (this.size > 1.2) {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${this.hue}, 80%, 70%, ${finalOpacity * 0.08})`;
          ctx.fill();
        }
      }
    }

    // Create particles
    const particleCount = Math.min(80, Math.floor(window.innerWidth * window.innerHeight / 15000));
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const opacity = (1 - dist / 120) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 212, 255, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      drawConnections();
      animFrame = requestAnimationFrame(animateParticles);
    }
    animateParticles();
  }
}

// ===== BOOT SCREEN TEXT ANIMATION =====
(function() {
  const bootText = document.getElementById('boot-text');
  if (!bootText) return;
  const messages = [
    'initializing...',
    'loading modules...',
    'compiling experience...',
    'rendering portfolio...',
    'almost there...'
  ];
  let msgIdx = 0;
  const bootTextInterval = setInterval(() => {
    msgIdx++;
    if (msgIdx < messages.length) {
      bootText.textContent = messages[msgIdx];
    } else {
      clearInterval(bootTextInterval);
    }
  }, 400);
})();

// ===== MOBILE SCROLL REVEAL =====
if (window.innerWidth <= 768) {
  // Reveal section cards on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = Array.from(el.parentElement.children).indexOf(el) * 80;
        setTimeout(() => {
          el.classList.add('visible');
        }, delay);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.1 });

  // Observe after boot screen hides
  setTimeout(() => {
    document.querySelectorAll('.mobile-section-card').forEach(card => {
      observer.observe(card);
    });
  }, 2500);

  // Animate stat numbers on mobile
  function animateCounters() {
    const statEls = document.querySelectorAll('.mobile-hero [style*="font-size:22px"]');
    statEls.forEach(el => {
      const text = el.textContent;
      const num = parseInt(text);
      if (isNaN(num)) return;
      const suffix = text.replace(num.toString(), '');
      let current = 0;
      const increment = Math.ceil(num / 30);
      const timer = setInterval(() => {
        current += increment;
        if (current >= num) {
          current = num;
          clearInterval(timer);
        }
        el.textContent = current + suffix;
      }, 40);
    });
  }
  setTimeout(animateCounters, 2800);
}

// ===== 3D TILT EFFECT ON CARDS (Desktop) =====
if (window.innerWidth > 768) {
  document.querySelectorAll('.pr-card, .tech-item, .contact-card, .stat-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / centerY * -5;
      const rotateY = (x - centerX) / centerX * 5;
      card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      setTimeout(() => { card.style.transition = ''; }, 500);
    });
  });
}

// ===== WINDOW SNAPPING =====
let currentSnapZone = null;
const SNAP_EDGE = 50;

function getSnapZone(mx, my) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const menuH = 28;
  const dockH = 80;
  const corner = 80;

  const nearLeft = mx < SNAP_EDGE;
  const nearRight = mx > W - SNAP_EDGE;
  const nearTop = my < menuH + SNAP_EDGE;
  const nearBottom = my > H - dockH - SNAP_EDGE;

  if (nearLeft && nearTop) return 'topleft-quarter';
  if (nearRight && nearTop) return 'topright-quarter';
  if (nearLeft && nearBottom) return 'bottomleft-quarter';
  if (nearRight && nearBottom) return 'bottomright-quarter';
  if (nearLeft) return 'left-half';
  if (nearRight) return 'right-half';
  if (nearTop) return 'top-full';
  return null;
}

function snapGeometry(zone) {
  const W = window.innerWidth;
  const menuH = 28;
  const dockH = 80;
  const areaH = window.innerHeight - menuH - dockH;
  const p = 8;
  const g = { top: menuH + p, left: p, width: W - p * 2, height: areaH - p * 2 };

  switch (zone) {
    case 'left-half':
      g.width = W / 2 - p * 1.5;
      break;
    case 'right-half':
      g.left = W / 2 + p / 2;
      g.width = W / 2 - p * 1.5;
      break;
    case 'top-full':
      // full screen
      break;
    case 'topleft-quarter':
      g.width = W / 2 - p * 1.5;
      g.height = areaH / 2 - p * 1.5;
      break;
    case 'topright-quarter':
      g.left = W / 2 + p / 2;
      g.width = W / 2 - p * 1.5;
      g.height = areaH / 2 - p * 1.5;
      break;
    case 'bottomleft-quarter':
      g.width = W / 2 - p * 1.5;
      g.top = menuH + areaH / 2 + p / 2;
      g.height = areaH / 2 - p * 1.5;
      break;
    case 'bottomright-quarter':
      g.left = W / 2 + p / 2;
      g.width = W / 2 - p * 1.5;
      g.top = menuH + areaH / 2 + p / 2;
      g.height = areaH / 2 - p * 1.5;
      break;
  }
  return g;
}

function updateSnapPreview(mx, my) {
  const preview = document.getElementById('snap-preview');
  const zone = getSnapZone(mx, my);
  if (zone) {
    const g = snapGeometry(zone);
    preview.style.top = g.top + 'px';
    preview.style.left = g.left + 'px';
    preview.style.width = g.width + 'px';
    preview.style.height = g.height + 'px';
    preview.classList.add('active');
    currentSnapZone = zone;
  } else {
    preview.classList.remove('active');
    currentSnapZone = null;
  }
}

function snapWindow(winId, zone, event) {
  if (event) { event.stopPropagation(); event.preventDefault(); }
  const win = document.getElementById('win-' + winId);
  if (!win) return;
  const g = snapGeometry(zone);

  // Save pre-snap state
  if (!windowStates[winId + '_snap']) {
    windowStates[winId + '_snap'] = {
      top: win.style.top, left: win.style.left,
      width: win.style.width, height: win.style.height
    };
  }

  win.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
  win.style.top = g.top + 'px';
  win.style.left = g.left + 'px';
  win.style.width = g.width + 'px';
  win.style.height = g.height + 'px';
  win.dataset.snapped = zone;

  // Close snap menus
  document.querySelectorAll('.snap-menu').forEach(m => m.classList.remove('show'));

  setTimeout(() => { win.style.transition = ''; }, 350);
}

function toggleSnapMenu(event, winId) {
  event.stopPropagation();
  event.preventDefault();
  const win = document.getElementById('win-' + winId);
  if (win && (win.classList.contains('maximized') || win.dataset.snapped)) {
    if (win.classList.contains('maximized')) {
      maximizeWindow(winId);
    } else if (win.dataset.snapped) {
      const saved = windowStates[winId + '_snap'];
      if (saved) {
        win.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        Object.assign(win.style, saved);
        setTimeout(() => win.style.transition = '', 300);
        delete windowStates[winId + '_snap'];
      }
      delete win.dataset.snapped;
    }
    document.querySelectorAll('.snap-menu').forEach(m => m.classList.remove('show'));
    return;
  }
  const menu = document.getElementById('sm-' + winId);
  if (!menu) return;
  document.querySelectorAll('.snap-menu').forEach(m => { if (m !== menu) m.classList.remove('show'); });
  menu.classList.toggle('show');
}

// Close snap menus on outside click
document.addEventListener('mousedown', (e) => {
  if (!e.target.closest('.tl-maximize')) {
    document.querySelectorAll('.snap-menu').forEach(m => m.classList.remove('show'));
  }
});

// Double-click titlebar to maximize
document.querySelectorAll('.window-toolbar').forEach(toolbar => {
  toolbar.addEventListener('dblclick', (e) => {
    if (e.target.closest('.traffic-lights')) return;
    const win = toolbar.closest('.window');
    if (!win) return;
    const winId = win.id.replace('win-', '');
    maximizeWindow(winId);
  });
});

// ===== MULTIPLE DESKTOPS (SPACES) =====
// Each desktop saves/restores FULL window state independently.
// Same app can be open on multiple desktops. No cross-contamination.
const allWindowIds = ['about','flutter','speaking','experience','oss','tech','articles','contact','github','linkedin','snake'];
let desktops = [{ id: 0, name: 'Desktop 1' }];
let currentDesktopId = 0;
let nextDesktopId = 1;

// Per-desktop state: { desktopId: { windowId: { open, top, left, width, height, zIndex } } }
const desktopState = {};
desktopState[0] = {}; // Desktop 1 starts empty

// Save current desktop's window states into desktopState
function saveDesktopState() {
  const state = {};
  allWindowIds.forEach(id => {
    const win = document.getElementById('win-' + id);
    if (!win) return;
    if (openWindows[id]) {
      state[id] = {
        open: true,
        top: win.style.top,
        left: win.style.left,
        width: win.style.width,
        height: win.style.height,
        zIndex: win.style.zIndex
      };
    }
  });
  desktopState[currentDesktopId] = state;
}

// Restore a desktop's saved state: close everything, then open saved windows
function restoreDesktopState(dId) {
  const state = desktopState[dId] || {};

  // Close ALL windows instantly (no animation)
  allWindowIds.forEach(id => {
    const win = document.getElementById('win-' + id);
    if (!win) return;
    win.classList.remove('open','closing','minimizing','hidden-desktop');
    win.style.display = '';
    delete openWindows[id];
  });

  // Restore saved windows
  Object.keys(state).forEach(id => {
    const s = state[id];
    if (!s.open) return;
    const win = document.getElementById('win-' + id);
    if (!win) return;
    win.style.top = s.top;
    win.style.left = s.left;
    win.style.width = s.width;
    win.style.height = s.height;
    win.style.zIndex = s.zIndex;
    win.classList.add('open');
    openWindows[id] = true;
  });

  syncDockIndicators();
}

// Sync dock active dots with current open windows
function syncDockIndicators() {
  const dockItems = document.querySelectorAll('.dock-item');
  const names = ['about','flutter','speaking','experience','oss','tech','articles','contact','github','linkedin','snake'];
  names.forEach((id, idx) => {
    if (!dockItems[idx]) return;
    if (openWindows[id]) {
      dockItems[idx].classList.add('active');
    } else {
      dockItems[idx].classList.remove('active');
    }
  });
}

function createDesktop() {
  saveDesktopState();
  const d = { id: nextDesktopId++, name: 'Desktop ' + (desktops.length + 1) };
  desktops.push(d);
  desktopState[d.id] = {}; // empty desktop
  currentDesktopId = d.id;
  restoreDesktopState(d.id);
  if (inMissionControl) closeMissionControl();
}

function deleteDesktop(dId) {
  if (desktops.length <= 1) return;
  delete desktopState[dId];
  desktops = desktops.filter(x => x.id !== dId);
  if (currentDesktopId === dId) {
    currentDesktopId = desktops[0].id;
    restoreDesktopState(currentDesktopId);
  }
  if (inMissionControl) renderMissionControl();
}

function switchDesktop(dId, direction) {
  if (currentDesktopId === dId) return;
  const oldIdx = desktops.findIndex(x => x.id === currentDesktopId);
  const newIdx = desktops.findIndex(x => x.id === dId);
  const dir = direction || (newIdx > oldIdx ? 'left' : 'right');

  // Save current state
  saveDesktopState();

  // Switch
  currentDesktopId = dId;
  restoreDesktopState(dId);

  // Slide animation on restored windows
  allWindowIds.forEach(id => {
    if (!openWindows[id]) return;
    const win = document.getElementById('win-' + id);
    if (!win) return;
    win.classList.add(dir === 'left' ? 'desktop-slide-left' : 'desktop-slide-right');
    setTimeout(() => win.classList.remove('desktop-slide-left', 'desktop-slide-right'), 400);
  });

  if (inMissionControl) renderMissionControl();
}

// Helper: get open window list for a desktop (for MC previews)
function getDesktopOpenWindows(dId) {
  if (dId === currentDesktopId) {
    return allWindowIds.filter(id => openWindows[id]);
  }
  const state = desktopState[dId] || {};
  return Object.keys(state).filter(id => state[id] && state[id].open);
}

// Keyboard: Ctrl+Left/Right for desktops, F3/Ctrl+Up for Mission Control
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'ArrowLeft') {
    e.preventDefault();
    const idx = desktops.findIndex(d => d.id === currentDesktopId);
    if (idx > 0) switchDesktop(desktops[idx - 1].id, 'right');
  }
  if (e.ctrlKey && e.key === 'ArrowRight') {
    e.preventDefault();
    const idx = desktops.findIndex(d => d.id === currentDesktopId);
    if (idx < desktops.length - 1) switchDesktop(desktops[idx + 1].id, 'left');
  }
  if (e.key === 'F3' || (e.ctrlKey && e.key === 'ArrowUp')) {
    e.preventDefault();
    toggleMissionControl();
  }
  if (e.key === 'Escape' && inMissionControl) {
    closeMissionControl();
  }
});

// ===== MISSION CONTROL =====
let inMissionControl = false;

const winIcons = {
  about: '💻', flutter: '💙', speaking: '🎤', experience: '💼',
  oss: '🔓', tech: '⚙️', articles: '📝', contact: '✉️',
  github: '🐙', linkedin: '💼'
};

function toggleMissionControl() {
  if (inMissionControl) closeMissionControl();
  else openMissionControl();
}

function openMissionControl() {
  inMissionControl = true;
  renderMissionControl();
  const mc = document.getElementById('mission-control');
  mc.classList.add('active');
  mc.onclick = (e) => {
    if (e.target === mc || e.target.id === 'mc-window-grid') closeMissionControl();
  };
}

function closeMissionControl(focusWinId) {
  inMissionControl = false;
  document.getElementById('mission-control').classList.remove('active');
  if (focusWinId) {
    const win = document.getElementById('win-' + focusWinId);
    if (win) win.style.zIndex = ++activeZ;
  }
}

function renderMissionControl() {
  // Desktop strip inside MC with mini previews
  const mcStrip = document.getElementById('mc-desktop-strip');
  mcStrip.innerHTML = '';
  desktops.forEach(d => {
    const t = document.createElement('div');
    t.className = 'mc-thumb' + (d.id === currentDesktopId ? ' active' : '');
    t.onclick = (e) => { e.stopPropagation(); switchDesktop(d.id); renderMissionControl(); };
    t.style.overflow = 'hidden';
    t.style.position = 'relative';

    // Create mini desktop preview
    const dOpenWins = getDesktopOpenWindows(d.id);
    if (dOpenWins.length > 0) {
      const desktopW = window.innerWidth;
      const desktopH = window.innerHeight - 28 - 80;
      const thumbW = 140;
      const thumbH = 70;
      const dScale = Math.min(thumbW / desktopW, thumbH / desktopH) * 0.85;

      const thumbContent = document.createElement('div');
      thumbContent.style.cssText = 'position:absolute;top:0;left:0;width:' + desktopW + 'px;height:' + desktopH + 'px;transform:scale(' + dScale + ');transform-origin:top left;pointer-events:none;';

      if (d.id === currentDesktopId) {
        // Current desktop: clone live windows
        dOpenWins.forEach(wId => {
          const win = document.getElementById('win-' + wId);
          if (!win) return;
          const clone = win.cloneNode(true);
          clone.removeAttribute('id');
          clone.classList.remove('open','closing','minimizing','hidden-desktop');
          clone.style.display = 'block';
          clone.style.position = 'absolute';
          clone.style.left = (parseInt(win.style.left) || 0) + 'px';
          clone.style.top = ((parseInt(win.style.top) || 28) - 28) + 'px';
          clone.style.width = win.offsetWidth + 'px';
          clone.style.height = win.offsetHeight + 'px';
          clone.style.zIndex = win.style.zIndex || '100';
          clone.style.pointerEvents = 'none';
          clone.style.opacity = '1';
          clone.querySelectorAll('.snap-menu, .window-resize').forEach(el => el.remove());
          thumbContent.appendChild(clone);
        });
      } else {
        // Other desktop: use saved state to show positioned rectangles with titles
        const state = desktopState[d.id] || {};
        dOpenWins.forEach(wId => {
          const s = state[wId];
          if (!s) return;
          const win = document.getElementById('win-' + wId);
          if (!win) return;
          const clone = win.cloneNode(true);
          clone.removeAttribute('id');
          clone.classList.remove('open','closing','minimizing','hidden-desktop');
          clone.style.display = 'block';
          clone.style.position = 'absolute';
          clone.style.left = s.left;
          clone.style.top = ((parseInt(s.top) || 28) - 28) + 'px';
          clone.style.width = s.width;
          clone.style.height = s.height;
          clone.style.zIndex = s.zIndex || '100';
          clone.style.pointerEvents = 'none';
          clone.style.opacity = '1';
          clone.querySelectorAll('.snap-menu, .window-resize').forEach(el => el.remove());
          thumbContent.appendChild(clone);
        });
      }
      t.appendChild(thumbContent);
    }

    const label = document.createElement('div');
    label.className = 'mc-thumb-label';
    label.style.cssText = 'position:absolute;bottom:4px;left:0;right:0;text-align:center;z-index:2;text-shadow:0 1px 3px rgba(0,0,0,0.8);';
    label.textContent = d.name;
    t.appendChild(label);

    // Delete button for non-first desktops
    if (desktops.length > 1) {
      const del = document.createElement('div');
      del.style.cssText = 'position:absolute;top:2px;right:4px;font-size:10px;color:var(--text2);cursor:pointer;opacity:0;transition:opacity 0.15s;z-index:3;';
      del.textContent = '✕';
      del.onclick = (e) => { e.stopPropagation(); deleteDesktop(d.id); };
      t.onmouseenter = () => { del.style.opacity = '1'; };
      t.onmouseleave = () => { del.style.opacity = '0'; };
      t.appendChild(del);
    }

    mcStrip.appendChild(t);
  });
  const addBtn = document.createElement('div');
  addBtn.className = 'mc-add-btn';
  addBtn.textContent = '+';
  addBtn.onclick = (e) => { e.stopPropagation(); createDesktop(); renderMissionControl(); };
  mcStrip.appendChild(addBtn);

  // Window grid for current desktop - actual scaled previews
  const grid = document.getElementById('mc-window-grid');
  grid.innerHTML = '';
  const currentD = desktops.find(d => d.id === currentDesktopId);
  if (!currentD) return;

  const openWins = getDesktopOpenWindows(currentDesktopId);
  if (openWins.length === 0) {
    grid.innerHTML = '<div style="color:var(--text2);font-size:14px;">No windows open on this desktop</div>';
    return;
  }

  // Max preview height based on available space
  const availH = window.innerHeight - 28 - 140 - 80; // menubar, strip, dock
  const maxH = Math.min(availH * 0.7, 400);
  const maxW = Math.min(500, (window.innerWidth - 80) / Math.min(openWins.length, 3) - 28);

  openWins.forEach(wId => {
    const win = document.getElementById('win-' + wId);
    if (!win) return;

    // Dynamic size: scale window to fit within max bounds, keeping aspect ratio
    const winW = win.offsetWidth || 700;
    const winH = win.offsetHeight || 500;
    const scale = Math.min(maxW / winW, maxH / winH, 0.45);
    const pW = Math.round(winW * scale);
    const pH = Math.round(winH * scale);

    const wrapper = document.createElement('div');
    wrapper.className = 'mc-win-preview';
    wrapper.style.width = pW + 'px';
    wrapper.style.height = pH + 'px';
    wrapper.style.overflow = 'hidden';
    wrapper.style.position = 'relative';
    wrapper.onclick = (e) => { e.stopPropagation(); closeMissionControl(wId); };

    // Clone window content and scale it down
    const clone = win.cloneNode(true);
    clone.removeAttribute('id');
    clone.classList.remove('open', 'closing', 'minimizing', 'hidden-desktop');
    clone.style.cssText = 'position:absolute;top:0;left:0;display:block;pointer-events:none;opacity:1;';
    clone.style.width = winW + 'px';
    clone.style.height = winH + 'px';
    clone.style.transform = 'scale(' + scale + ')';
    clone.style.transformOrigin = 'top left';
    clone.querySelectorAll('.snap-menu, .window-resize').forEach(el => el.remove());
    wrapper.appendChild(clone);

    // Title label below
    const title = win.querySelector('.window-title')?.textContent || wId;
    const label = document.createElement('div');
    label.style.cssText = 'position:absolute;bottom:0;left:0;right:0;padding:6px 10px;font-size:11px;font-weight:600;color:#fff;background:linear-gradient(transparent,rgba(0,0,0,0.7));text-align:center;z-index:2;border-radius:0 0 12px 12px;';
    label.textContent = title;
    wrapper.appendChild(label);

    grid.appendChild(wrapper);
  });
}
