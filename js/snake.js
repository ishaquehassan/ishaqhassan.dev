// ===== SNAKE NEON GAME =====
const SNAKE_COLS = 25;
const SNAKE_ROWS = 25;
let snakeCellSize = 20;
let snakeBody = [{x:12,y:12}];
let snakePrevBody = [{x:12,y:12}];
let snakeDir = {x:1,y:0};
let snakeNextDir = {x:1,y:0};
let snakeDirQueue = [];
let snakeFood = {x:18,y:12};
let snakeScore = 0;
let snakeHighScore = parseInt(localStorage.getItem('snakeHigh') || '0');
let snakeRunning = false;
let snakeGameOver = false;
let snakeInterval = null;
let snakeParticles = [];
let snakeBaseSpeed = 150;
let snakeEatCount = 0;
let snakeBonus = null; // {x, y, colorIdx, spawnTime}
let snakeBonusTimer = null;
const BONUS_DURATION = 9000; // 9 seconds
const BONUS_MAX_SCORE = 9;
const BONUS_MIN_SCORE = 1;
let snakeColor = '#39d353';
let snakeColorSecondary = '#26a641';
const bonusColors = [
  { main: '#FFD60A', secondary: '#b8960a', glow: '#FFD60A' },
  { main: '#FF5F97', secondary: '#b8436d', glow: '#FF5F97' },
  { main: '#00D4FF', secondary: '#009bb8', glow: '#00D4FF' },
  { main: '#BF5AF2', secondary: '#8a3fb0', glow: '#BF5AF2' },
  { main: '#FF9F0A', secondary: '#b87008', glow: '#FF9F0A' },
  { main: '#30D158', secondary: '#229640', glow: '#30D158' },
];
let snakeLastTick = 0;
let snakeAnimFrame = null;
let snakePaused = false;
let snakeLocked = false; // true after game over, prevents restart until relaunched

// Offscreen grid caches (pre-rendered once, blit each frame)
let snakeGridCache = null;
let mobSnakeGridCache = null;

// Combo system
let snakeCombo = 0;
let snakeComboTimer = null;
let snakeComboDecay = 2000;
let snakeLastEatTime = 0;
let snakeStartTime = 0;

// Floating score popups (canvas-rendered)
let snakePopups = [];

// Combo banner (canvas-rendered cinematic)
let snakeComboBanner = null; // { combo, mult, life, maxLife }

function snakeGetSpeed() {
  const speedup = Math.floor(snakeScore / 3) * 2.65;
  return Math.max(20, snakeBaseSpeed - speedup);
}

function snakeGetSpeedLevel() {
  const speed = snakeGetSpeed();
  return Math.min(Math.round((snakeBaseSpeed - speed) / ((snakeBaseSpeed - 20) / 50)) + 1, 50);
}

function snakeGetSpeedLabel() {
  return snakeGetSpeedLevel() + 'x';
}

function snakeGetComboMultiplier() {
  if (snakeCombo < 2) return 1;
  if (snakeCombo < 4) return 1.5;
  if (snakeCombo < 6) return 2;
  return 3;
}

var _hudScoreEl, _hudSpeedLabel, _hudSpeedFill;
var _lastHudScore = -1, _lastHudLevel = -1;
function snakeUpdateHUD() {
  if (!_hudScoreEl) {
    _hudScoreEl = document.getElementById('snake-score');
    _hudSpeedLabel = document.getElementById('snake-speed-label');
    _hudSpeedFill = document.getElementById('snake-speed-fill');
  }
  if (snakeScore !== _lastHudScore) {
    _hudScoreEl.textContent = snakeScore;
    _lastHudScore = snakeScore;
  }
  const level = snakeGetSpeedLevel();
  if (level !== _lastHudLevel) {
    _lastHudLevel = level;
    _hudSpeedLabel.textContent = level + 'x';
    const pct = ((level - 1) / 49) * 100;
    _hudSpeedFill.style.width = pct + '%';
    if (pct < 30) _hudSpeedFill.style.background = '#39d353';
    else if (pct < 55) _hudSpeedFill.style.background = '#FFD60A';
    else if (pct < 80) _hudSpeedFill.style.background = '#FF9F0A';
    else _hudSpeedFill.style.background = '#FF453A';
  }
}

// Speed HUD power-up glow (called every frame from render loop)
function snakeUpdateSpeedGlow() {
  const card = document.getElementById('snake-speed-card');
  if (!card) return;
  if (snakeBonus) {
    const bCol = bonusColors[snakeBonus.colorIdx || 0];
    const elapsed = performance.now() - snakeBonus.spawnTime;
    const timeRatio = Math.max(0, 1 - elapsed / BONUS_DURATION);
    card.classList.add('bonus-active');
    card.style.setProperty('--bonus-color', bCol.main);
    card.style.setProperty('--bonus-glow', bCol.glow + '40');
    // Urgency: last 33% of bonus time, pulse faster as it runs out
    if (timeRatio < 0.33) {
      card.classList.add('bonus-urgent');
      // Speed up pulse: 0.8s at 33% down to 0.15s at 0%
      const urgencySpeed = (0.15 + (timeRatio / 0.33) * 0.65).toFixed(2) + 's';
      card.style.setProperty('--urgency-speed', urgencySpeed);
    } else {
      card.classList.remove('bonus-urgent');
    }
  } else {
    card.classList.remove('bonus-active', 'bonus-urgent');
    card.style.removeProperty('--bonus-color');
    card.style.removeProperty('--bonus-glow');
    card.style.removeProperty('--urgency-speed');
  }
}

// Mobile speed HUD power-up glow
function mobSnakeUpdateSpeedGlow() {
  const card = document.getElementById('mob-snake-speed-card');
  if (!card) return;
  const S = mobSnake;
  if (S.bonus) {
    const bCol = bonusColors[S.bonus.colorIdx || 0];
    const elapsed = performance.now() - S.bonus.spawnTime;
    const timeRatio = Math.max(0, 1 - elapsed / BONUS_DURATION);
    card.classList.add('bonus-active');
    card.style.setProperty('--bonus-color', bCol.main);
    card.style.setProperty('--bonus-glow', bCol.glow + '40');
    if (timeRatio < 0.33) {
      card.classList.add('bonus-urgent');
      const urgencySpeed = (0.15 + (timeRatio / 0.33) * 0.65).toFixed(2) + 's';
      card.style.setProperty('--urgency-speed', urgencySpeed);
    } else {
      card.classList.remove('bonus-urgent');
    }
  } else {
    card.classList.remove('bonus-active', 'bonus-urgent');
    card.style.removeProperty('--bonus-color');
    card.style.removeProperty('--bonus-glow');
    card.style.removeProperty('--urgency-speed');
  }
}

function snakePulseScore() {
  const card = document.querySelector('.snake-hud-score');
  card.classList.add('pulse');
  setTimeout(() => card.classList.remove('pulse'), 300);
}

function snakeShowComboBanner() {
  if (snakeCombo < 2) return;
  const mult = snakeGetComboMultiplier();
  snakeComboBanner = { combo: snakeCombo, mult: mult, life: 60, maxLife: 60 };
}

function snakeStartComboDecay() {
  clearInterval(snakeComboTimer);
  snakeComboTimer = setInterval(() => {
    const elapsed = performance.now() - snakeLastEatTime;
    if (elapsed >= snakeComboDecay) {
      snakeCombo = 0;
      clearInterval(snakeComboTimer);
    }
  }, 50);
}

// Shared AudioContext for all snake SFX (prevents memory leak)
let snakeAudioCtx = null;
function getSnakeAudioCtx() {
  if (!snakeAudioCtx || snakeAudioCtx.state === 'closed') {
    snakeAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (snakeAudioCtx.state === 'suspended') snakeAudioCtx.resume();
  return snakeAudioCtx;
}

// Sound effects (Web Audio, no files needed)
function snakeEatSfx() {
  try {
    const ctx = getSnakeAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
  } catch(e) {}
}

function snakeBonusEatSfx() {
  try {
    const ctx = getSnakeAudioCtx();
    [0, 0.08, 0.16].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 + i * 400, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.12);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.12);
    });
  } catch(e) {}
}

function snakeDeathSfx() {
  try {
    const ctx = getSnakeAudioCtx();
    const hit = ctx.createOscillator();
    const hitG = ctx.createGain();
    hit.type = 'sawtooth';
    hit.frequency.setValueAtTime(250, ctx.currentTime);
    hit.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
    hitG.gain.setValueAtTime(0.18, ctx.currentTime);
    hitG.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    hit.connect(hitG); hitG.connect(ctx.destination);
    hit.start(ctx.currentTime); hit.stop(ctx.currentTime + 0.3);
    [0.25, 0.45, 0.65, 0.9].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const freq = [400, 320, 240, 140][i];
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.65, ctx.currentTime + delay + 0.25);
      gain.gain.setValueAtTime(0.11 - i * 0.02, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.28);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.28);
    });
    const rumble = ctx.createOscillator();
    const rumbleG = ctx.createGain();
    rumble.type = 'triangle';
    rumble.frequency.setValueAtTime(60, ctx.currentTime + 0.2);
    rumble.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 1.2);
    rumbleG.gain.setValueAtTime(0.08, ctx.currentTime + 0.2);
    rumbleG.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
    rumble.connect(rumbleG); rumbleG.connect(ctx.destination);
    rumble.start(ctx.currentTime + 0.2); rumble.stop(ctx.currentTime + 1.2);
  } catch(e) {}
}

function snakeBonusMissSfx() {
  try {
    const ctx = getSnakeAudioCtx();
    const noise = ctx.createOscillator();
    const noiseGain = ctx.createGain();
    noise.type = 'sawtooth';
    noise.frequency.setValueAtTime(180, ctx.currentTime);
    noise.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.12);
    noiseGain.gain.setValueAtTime(0.15, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    noise.connect(noiseGain); noiseGain.connect(ctx.destination);
    noise.start(ctx.currentTime); noise.stop(ctx.currentTime + 0.15);
    [0, 0.15, 0.35].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const freq = [350, 260, 150][i];
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.6, ctx.currentTime + delay + 0.2);
      gain.gain.setValueAtTime(0.13 - i * 0.03, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.22);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.22);
    });
  } catch(e) {}
}

function snakeBonusSfx() {
  try {
    const ctx = getSnakeAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch(e) {}
}

function snakeAddPopup(x, y, text, color, big) {
  snakePopups.push({
    x: x * snakeCellSize + snakeCellSize / 2,
    y: y * snakeCellSize + snakeCellSize / 2,
    text: text,
    color: color || '#39d353',
    life: 40,
    maxLife: 40,
    big: big || false
  });
}

function snakeResizeCanvas() {
  const canvas = document.getElementById('snake-canvas');
  if (!canvas) return;
  const wrap = canvas.parentElement;
  const win = wrap.closest('.window');
  const w = wrap.clientWidth;
  // Calculate available height: window height minus toolbar, HUD, combo bar
  let availH = w; // default square
  if (win) {
    const toolbar = win.querySelector('.window-toolbar');
    const hud = win.querySelector('.snake-hud');
    const combo = win.querySelector('.snake-combo-bar');
    const toolbarH = toolbar ? toolbar.offsetHeight : 40;
    const hudH = hud ? hud.offsetHeight : 0;
    const comboH = combo ? combo.offsetHeight : 0;
    availH = win.offsetHeight - toolbarH - hudH - comboH - 4;
  }
  // Cell size: fit both width and height
  const cellByW = Math.floor(w / SNAKE_COLS);
  const cellByH = Math.floor(availH / SNAKE_ROWS);
  snakeCellSize = Math.max(8, Math.min(cellByW, cellByH));
  const pxW = snakeCellSize * SNAKE_COLS;
  const pxH = snakeCellSize * SNAKE_ROWS;
  canvas.width = pxW;
  canvas.height = pxH;
  canvas.style.width = pxW + 'px';
  canvas.style.height = pxH + 'px';
  snakeGridCache = null; // invalidate grid cache on resize
  snakeDraw(1);
}

function snakeSetDir(dx, dy) {
  if (snakeLocked) return;
  if (snakeGameOver) { snakeReset(); return; }
  if (!snakeRunning) { snakeStart(); return; }
  // Use queue to buffer up to 2 moves for quick turns
  const ref = snakeDirQueue.length > 0 ? snakeDirQueue[snakeDirQueue.length - 1] : snakeDir;
  if (ref.x === -dx && ref.y === -dy) return;
  if (ref.x === dx && ref.y === dy) return;
  if (dx !== 0 || dy !== 0) {
    snakeDirQueue.push({x:dx, y:dy});
    if (snakeDirQueue.length > 2) snakeDirQueue.shift();
    // Instant tick if 25%+ of interval passed, snappy response
    const elapsed = performance.now() - snakeLastTick;
    if (elapsed > snakeGetSpeed() * 0.25) {
      clearTimeout(snakeInterval);
      snakeLastTick = performance.now();
      snakeTick();
      if (snakeRunning && !snakePaused) snakeScheduleNext();
    }
  }
}

var _deskPauseFrame = null;

function snakeDrawPause() {
  var canvas = document.getElementById('snake-canvas');
  if (!canvas || !snakePaused) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  var now = performance.now();

  snakeDraw(1);

  var vg = ctx.createRadialGradient(W/2, H/2, W*0.15, W/2, H/2, W*0.7);
  vg.addColorStop(0, 'rgba(0,0,0,0.5)');
  vg.addColorStop(1, 'rgba(0,0,0,0.8)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  var breath = Math.sin(now * 0.003) * 0.5 + 0.5;
  var iconSize = 36 + breath * 5;

  ctx.beginPath();
  ctx.arc(W/2, H/2 - 12, 52 + breath * 7, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(254,188,46,' + (0.12 + breath * 0.1).toFixed(2) + ')';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(W/2, H/2 - 12, 42 + breath * 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(254,188,46,' + (0.05 + breath * 0.04).toFixed(2) + ')';
  ctx.fill();

  ctx.shadowColor = '#FEBC2E';
  ctx.shadowBlur = 18 + breath * 10;
  ctx.fillStyle = '#FEBC2E';
  var barW = iconSize * 0.28, barH = iconSize * 0.75, gap = iconSize * 0.2;
  var bx = W/2 - gap/2 - barW, by = H/2 - 12 - barH/2;
  ctx.beginPath(); ctx.roundRect(bx, by, barW, barH, 4); ctx.fill();
  ctx.beginPath(); ctx.roundRect(W/2 + gap/2, by, barW, barH, 4); ctx.fill();
  ctx.shadowBlur = 0;

  ctx.font = 'bold 18px -apple-system, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FEBC2E'; ctx.globalAlpha = 0.9;
  ctx.fillText('PAUSED', W/2, H/2 + 46);
  ctx.globalAlpha = 1;

  ctx.font = '12px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,' + (0.2 + breath * 0.12).toFixed(2) + ')';
  ctx.fillText('Press Esc to resume', W/2, H/2 + 68);

  var elapsed = snakeStartTime > 0 ? Math.round((now - snakeStartTime) / 1000) : 0;
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.font = '11px -apple-system, sans-serif';
  ctx.fillText('Score ' + snakeScore + '  ·  Length ' + snakeBody.length + '  ·  ' + elapsed + 's', W/2, H/2 + 90);

  _deskPauseFrame = requestAnimationFrame(snakeDrawPause);
}

function snakeTogglePause() {
  if (snakeGameOver || !snakeRunning) return;
  snakePaused = !snakePaused;
  var overlay = document.getElementById('snake-overlay');
  if (snakePaused) {
    clearTimeout(snakeInterval);
    cancelAnimationFrame(snakeAnimFrame);
    if (overlay) overlay.style.display = 'none';
    snakeDrawPause();
  } else {
    cancelAnimationFrame(_deskPauseFrame);
    if (overlay) overlay.style.display = 'none';
    snakeLastTick = performance.now();
    snakeScheduleNext();
    snakeRenderLoop();
  }
}

document.addEventListener('keydown', (e) => {
  const win = document.getElementById('win-snake');
  if (!win || !win.classList.contains('open')) return;
  // Only when snake window is topmost (focused)
  var topZ = 0;
  document.querySelectorAll('.window.open').forEach(function(w) {
    var z = parseInt(w.style.zIndex) || 0;
    if (z > topZ) topZ = z;
  });
  if ((parseInt(win.style.zIndex) || 0) < topZ) return;
  if (e.key === 'Escape') { e.preventDefault(); snakeTogglePause(); return; }
  if (snakePaused) return;
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { e.preventDefault(); snakeSetDir(0,-1); }
  if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { e.preventDefault(); snakeSetDir(0,1); }
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); snakeSetDir(-1,0); }
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); snakeSetDir(1,0); }
});

function snakeStartSfx(note) {
  try {
    const ctx = getSnakeAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(note, ctx.currentTime);
    gain.gain.setValueAtTime(0.13, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
  } catch(e) {}
}

function snakeGoSfx() {
  try {
    const ctx = getSnakeAudioCtx();
    [0, 0.06, 0.12].forEach((d, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660 + i * 220, ctx.currentTime + d);
      gain.gain.setValueAtTime(0.14, ctx.currentTime + d);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + d + 0.15);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(ctx.currentTime + d); osc.stop(ctx.currentTime + d + 0.15);
    });
  } catch(e) {}
}

function snakeCountdown(canvas, callback) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const steps = [{t:'3',color:'#FF453A',note:440},{t:'2',color:'#FF9F0A',note:523},{t:'1',color:'#FFD60A',note:659},{t:'GO!',color:'#39d353',note:0}];
  let i = 0;
  function show() {
    if (i >= steps.length) { callback(); return; }
    const s = steps[i];
    // Draw over existing canvas
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.font = 'bold ' + (s.t === 'GO!' ? '42' : '56') + 'px -apple-system, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = s.color; ctx.shadowBlur = 30;
    ctx.fillStyle = s.color;
    ctx.fillText(s.t, W/2, H/2);
    ctx.shadowBlur = 0;
    if (s.note) snakeStartSfx(s.note); else snakeGoSfx();
    i++;
    setTimeout(show, i < steps.length ? 500 : 0);
  }
  show();
}

function snakeStart() {
  const overlay = document.getElementById('snake-overlay');
  if (overlay) overlay.style.display = 'none';
  snakeResizeCanvas();
  const canvas = document.getElementById('snake-canvas');
  snakeCountdown(canvas, () => {
    snakeRunning = true;
    snakeStartTime = performance.now();
    snakeLastTick = performance.now();
    snakePrevBody = snakeBody.map(s => ({x:s.x,y:s.y}));
    snakeScheduleNext();
    snakeRenderLoop();
  });
}

function snakeRenderLoop() {
  if (!snakeRunning || snakePaused) return;
  const now = performance.now();
  const elapsed = now - snakeLastTick;
  const t = Math.min(elapsed / snakeGetSpeed(), 1);
  snakeDraw(t);
  snakeUpdateSpeedGlow();
  snakeAnimFrame = requestAnimationFrame(snakeRenderLoop);
}

function snakeScheduleNext() {
  clearTimeout(snakeInterval);
  snakeInterval = setTimeout(() => {
    snakeTick();
    if (snakeRunning && !snakePaused) snakeScheduleNext();
  }, snakeGetSpeed());
}

function snakeReset() {
  clearTimeout(snakeInterval);
  cancelAnimationFrame(snakeAnimFrame);
  clearInterval(snakeComboTimer);
  snakeBody = [{x:12,y:12}];
  snakePrevBody = [{x:12,y:12}];
  snakeDir = {x:1,y:0};
  snakeNextDir = {x:1,y:0};
  snakeDirQueue = [];
  snakeScore = 0;
  snakeGameOver = false;
  snakeRunning = false;
  snakePaused = false;
  snakeParticles = [];
  snakePopups = [];
  snakeEatCount = 0;
  snakeBonus = null;
  snakeCombo = 0;
  snakeLastEatTime = 0;
  snakeComboBanner = null;
  snakeColor = '#39d353';
  snakeColorSecondary = '#26a641';
  clearTimeout(snakeBonusTimer);
  snakePlaceFood();
  document.getElementById('snake-score').textContent = '0';
  document.getElementById('snake-speed-label').textContent = '1x';
  document.getElementById('snake-speed-fill').style.width = '0%';
  document.querySelector('.snake-hud-best').classList.remove('new-record');
  const speedCard = document.getElementById('snake-speed-card');
  if (speedCard) { speedCard.classList.remove('bonus-active', 'bonus-urgent'); speedCard.style.removeProperty('--bonus-color'); speedCard.style.removeProperty('--bonus-glow'); speedCard.style.removeProperty('--urgency-speed'); }
  const wrap = document.getElementById('snake-canvas-wrap');
  wrap.classList.remove('death-flash', 'shake');
  const overlay = document.getElementById('snake-overlay');
  if (overlay) { overlay.style.display = 'block'; overlay.innerHTML = '<div style="font-size:28px;font-weight:700;color:#39d353;text-shadow:0 0 20px rgba(57,211,83,0.5);">SNAKE NEON</div><div style="margin-top:14px;display:flex;align-items:center;gap:20px;justify-content:center;"><div style="display:flex;flex-direction:column;align-items:center;gap:4px;"><div><kbd class="snake-key">▲</kbd></div><div style="display:flex;gap:4px;"><kbd class="snake-key">◀</kbd><kbd class="snake-key">▼</kbd><kbd class="snake-key">▶</kbd></div></div><div style="font-size:11px;color:rgba(255,255,255,0.2);">or</div><div style="display:flex;flex-direction:column;align-items:center;gap:4px;"><div><kbd class="snake-key">W</kbd></div><div style="display:flex;gap:4px;"><kbd class="snake-key">A</kbd><kbd class="snake-key">S</kbd><kbd class="snake-key">D</kbd></div></div></div>'; }
  snakeResizeCanvas();
}

function snakePlaceFood() {
  let pos;
  do {
    pos = { x: Math.floor(Math.random() * SNAKE_COLS), y: Math.floor(Math.random() * SNAKE_ROWS) };
  } while (snakeBody.some(s => s.x === pos.x && s.y === pos.y));
  snakeFood = pos;
}

function snakeTick() {
  snakeLastTick = performance.now();
  snakePrevBody = snakeBody.map(s => ({x:s.x,y:s.y}));
  if (snakeDirQueue.length > 0) { snakeDir = snakeDirQueue.shift(); snakeNextDir = snakeDir; }
  else snakeDir = snakeNextDir;
  const head = { x: snakeBody[0].x + snakeDir.x, y: snakeBody[0].y + snakeDir.y };

  // Wrap around edges
  if (head.x < 0) head.x = SNAKE_COLS - 1;
  else if (head.x >= SNAKE_COLS) head.x = 0;
  if (head.y < 0) head.y = SNAKE_ROWS - 1;
  else if (head.y >= SNAKE_ROWS) head.y = 0;

  // Game over only on self collision
  if (snakeBody.some(s => s.x === head.x && s.y === head.y)) {
    clearTimeout(snakeInterval);
    cancelAnimationFrame(snakeAnimFrame);
    clearInterval(snakeComboTimer);
    snakeGameOver = true;
    snakeRunning = false;
    snakeLocked = true;
    snakeDeathSfx();
    const isNewHigh = snakeScore > snakeHighScore;
    if (isNewHigh) {
      snakeHighScore = snakeScore;
      localStorage.setItem('snakeHigh', snakeHighScore);
      document.getElementById('snake-high').textContent = snakeHighScore;
      document.querySelector('.snake-hud-best').classList.add('new-record');
    }
    localStorage.setItem('snakeLastScore', snakeScore);
    // Death effects
    const wrap = document.getElementById('snake-canvas-wrap');
    wrap.classList.add('death-flash', 'shake');
    // Draw game over on canvas
    snakeDraw(1);
    snakeDrawGameOver(isNewHigh);
    // After 3 seconds, close and open GitHub at snake's position
    const snakeWin = document.getElementById('win-snake');
    const snakeTop = snakeWin ? snakeWin.style.top : '';
    const snakeLeft = snakeWin ? snakeWin.style.left : '';
    setTimeout(() => {
      wrap.classList.remove('death-flash', 'shake');
      closeWindow('snake');
      openWindow('github');
      if (snakeTop && snakeLeft) {
        const ghWin = document.getElementById('win-github');
        if (ghWin) { ghWin.style.top = snakeTop; ghWin.style.left = snakeLeft; }
      }
      showNotif('Done playing? Now back to work 😂', 'Snake Neon');
    }, 3000);
    return;
  }

  snakeBody.unshift(head);
  let ate = false;

  // Check bonus food (bigger catch area: 1 cell radius)
  if (snakeBonus && Math.abs(head.x - snakeBonus.x) <= 1 && Math.abs(head.y - snakeBonus.y) <= 1) {
    // Score decays over time: 5 at spawn, 1 at expiry
    const elapsed = performance.now() - snakeBonus.spawnTime;
    const timeRatio = Math.max(0, 1 - elapsed / BONUS_DURATION);
    const baseScore = Math.round(BONUS_MIN_SCORE + (BONUS_MAX_SCORE - BONUS_MIN_SCORE) * timeRatio);
    const mult = snakeGetComboMultiplier();
    const pts = Math.round(baseScore * mult);
    snakeScore += pts;
    snakeAddPopup(snakeBonus.x, snakeBonus.y, '+' + pts, '#FFD60A', true);
    clearTimeout(snakeBonusTimer);
    const bc = bonusColors[snakeBonus.colorIdx || 0];
    snakeColor = bc.main;
    snakeColorSecondary = bc.secondary;
    for (let i = 0; i < 20; i++) {
      snakeParticles.push({ x: snakeBonus.x * snakeCellSize + snakeCellSize/2, y: snakeBonus.y * snakeCellSize + snakeCellSize/2, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, life: 25, color: bc.main });
    }
    snakeBonus = null;
    ate = true;
    snakeBonusEatSfx();
  }

  // Check regular food
  if (head.x === snakeFood.x && head.y === snakeFood.y) {
    // Combo check
    const now = performance.now();
    if (snakeLastEatTime > 0 && (now - snakeLastEatTime) < snakeComboDecay) {
      snakeCombo++;
    } else {
      snakeCombo = 1;
    }
    snakeLastEatTime = now;
    snakeStartComboDecay();
    const mult = snakeGetComboMultiplier();
    const pts = Math.round(1 * mult);
    snakeScore += pts;
    snakeAddPopup(snakeFood.x, snakeFood.y, '+' + pts, snakeCombo >= 3 ? '#FFD60A' : '#39d353', false);
    snakeEatCount++;
    for (let i = 0; i < 8; i++) {
      snakeParticles.push({ x: snakeFood.x * snakeCellSize + snakeCellSize/2, y: snakeFood.y * snakeCellSize + snakeCellSize/2, vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6, life: 15 });
    }
    snakePlaceFood();
    snakeEatSfx();
    ate = true;
    // Spawn bonus every 3 eats
    if (snakeEatCount % 3 === 0 && !snakeBonus) {
      let bp; do { bp = {x: 2+Math.floor(Math.random()*(SNAKE_COLS-4)), y: 2+Math.floor(Math.random()*(SNAKE_ROWS-4))}; } while (snakeBody.some(s=>s.x===bp.x&&s.y===bp.y) || (bp.x===snakeFood.x&&bp.y===snakeFood.y));
      bp.colorIdx = Math.floor(Math.random() * bonusColors.length);
      bp.spawnTime = performance.now();
      snakeBonus = bp;
      snakeBonusTimer = setTimeout(() => { snakeBonus = null; snakeBonusMissSfx(); }, BONUS_DURATION);
      // Bell sound for bonus spawn
      snakeBonusSfx();
    }
  }

  if (ate) {
    localStorage.setItem('snakeLastScore', snakeScore);
    snakeUpdateHUD();
    snakePulseScore();
    snakeShowComboBanner();
    snakePrevBody.unshift(snakePrevBody[0]);
  } else {
    snakeBody.pop();
  }
  snakeLastTick = performance.now();
}

function snakeLerp(a, b, t) { return a + (b - a) * t; }

function snakeDraw(t) {
  if (t === undefined) t = 1;
  const canvas = document.getElementById('snake-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const S = snakeCellSize;
  const W = S * SNAKE_COLS;
  const H = S * SNAKE_ROWS;
  ctx.clearRect(0, 0, W, H);

  // Linear interpolation (no easing, instant grid feel)
  const ease = t;

  // Dotted grid background (pre-rendered offscreen canvas)
  if (!snakeGridCache || snakeGridCache.width !== W || snakeGridCache.height !== H) {
    snakeGridCache = document.createElement('canvas');
    snakeGridCache.width = W; snakeGridCache.height = H;
    const gctx = snakeGridCache.getContext('2d');
    gctx.fillStyle = 'rgba(255,255,255,0.18)';
    for (let gx = 0; gx < SNAKE_COLS; gx++) {
      for (let gy = 0; gy < SNAKE_ROWS; gy++) {
        gctx.beginPath();
        gctx.arc(gx * S + S/2, gy * S + S/2, 1.5, 0, Math.PI*2);
        gctx.fill();
      }
    }
  }
  ctx.drawImage(snakeGridCache, 0, 0);

  // Cache timestamp for all animations this frame
  const frameNow = Date.now();

  // Food pulsing glow
  const pulse = 0.85 + Math.sin(frameNow / 200) * 0.15;
  ctx.shadowColor = '#FF5F57';
  ctx.shadowBlur = 12 * pulse;
  ctx.fillStyle = '#FF5F57';
  ctx.beginPath();
  ctx.arc(snakeFood.x * S + S/2, snakeFood.y * S + S/2, S * 0.3 * pulse, 0, Math.PI*2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(snakeFood.x * S + S/2, snakeFood.y * S + S/2, S * 0.08, 0, Math.PI*2);
  ctx.fill();

  // Bonus food (flashy neon ball with countdown timer ring)
  if (snakeBonus) {
    const bCol = bonusColors[snakeBonus.colorIdx || 0];
    const elapsed = performance.now() - snakeBonus.spawnTime;
    const timeRatio = Math.max(0, 1 - elapsed / BONUS_DURATION);
    const currentScore = Math.round(BONUS_MIN_SCORE + (BONUS_MAX_SCORE - BONUS_MIN_SCORE) * timeRatio);

    // Smooth breathing (fixed frequency, no phase jumps)
    const breathe = Math.sin(frameNow * 0.004) * 0.5 + 0.5; // 0 to 1, smooth
    const bp = 0.92 + breathe * 0.08;
    const bx = snakeBonus.x * S + S/2;
    const by = snakeBonus.y * S + S/2;
    const bRadius = S * 0.75 * bp;

    // Timer ring (countdown arc)
    ctx.strokeStyle = bCol.main;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = bCol.glow;
    ctx.shadowBlur = 10;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(bx, by, S * 1.1, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * timeRatio), false);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // Urgency glow when < 3 seconds left (smooth sine, fixed freq)
    if (timeRatio < 0.33) {
      const urgency = (0.33 - timeRatio) / 0.33;
      const glow = (Math.sin(frameNow * 0.008) * 0.5 + 0.5) * (0.08 + urgency * 0.14);
      ctx.fillStyle = bCol.main;
      ctx.globalAlpha = glow;
      ctx.beginPath();
      ctx.arc(bx, by, S * (1.2 + breathe * 0.2), 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Outer glow
    ctx.shadowColor = bCol.glow;
    ctx.shadowBlur = 10;
    ctx.fillStyle = bCol.main + '18';
    ctx.beginPath();
    ctx.arc(bx, by, S * (0.95 + breathe * 0.1), 0, Math.PI*2);
    ctx.fill();

    // Main ball
    ctx.shadowBlur = 8;
    ctx.fillStyle = bCol.main;
    ctx.beginPath();
    ctx.arc(bx, by, bRadius, 0, Math.PI*2);
    ctx.fill();

    // Inner shine
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(bx - bRadius*0.2, by - bRadius*0.25, bRadius*0.3, 0, Math.PI*2);
    ctx.fill();

    // Score text (shows current decaying value)
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.font = 'bold ' + Math.floor(S*0.55) + 'px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+' + currentScore, bx, by + 1);
  }

  // Interpolated positions (smooth wrap: adjust prev so lerp goes off-edge, canvas clips naturally)
  const positions = snakeBody.map((seg, i) => {
    const prev = snakePrevBody[i] || seg;
    let px = prev.x, py = prev.y;
    // Adjust previous position for wrap continuity
    if (seg.x - px > SNAKE_COLS / 2) px += SNAKE_COLS;
    else if (px - seg.x > SNAKE_COLS / 2) px -= SNAKE_COLS;
    if (seg.y - py > SNAKE_ROWS / 2) py += SNAKE_ROWS;
    else if (py - seg.y > SNAKE_ROWS / 2) py -= SNAKE_ROWS;
    return { x: snakeLerp(px, seg.x, ease), y: snakeLerp(py, seg.y, ease) };
  });

  // Draw smooth connected body (portal-style wrap: extend lines to edges)
  if (positions.length > 1) {
    ctx.strokeStyle = snakeColorSecondary;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = S * 0.65;
    ctx.shadowColor = snakeColor;
    ctx.shadowBlur = 3;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(positions[0].x * S + S/2, positions[0].y * S + S/2);
    for (let i = 1; i < positions.length; i++) {
      const dx = positions[i].x - positions[i-1].x;
      const dy = positions[i].y - positions[i-1].y;
      if (Math.abs(dx) > SNAKE_COLS / 2 || Math.abs(dy) > SNAKE_ROWS / 2) {
        // Extend current line TO the edge before breaking
        const prev = positions[i-1];
        const next = positions[i];
        if (Math.abs(dx) > SNAKE_COLS / 2) {
          if (prev.x < next.x) { ctx.lineTo(-0.6 * S, prev.y * S + S/2); }
          else { ctx.lineTo((SNAKE_COLS + 0.6) * S, prev.y * S + S/2); }
        }
        if (Math.abs(dy) > SNAKE_ROWS / 2) {
          if (prev.y < next.y) { ctx.lineTo(prev.x * S + S/2, -0.6 * S); }
          else { ctx.lineTo(prev.x * S + S/2, (SNAKE_ROWS + 0.6) * S); }
        }
        ctx.stroke();
        // Start new line FROM the opposite edge
        ctx.beginPath();
        if (Math.abs(dx) > SNAKE_COLS / 2) {
          if (next.x < prev.x) { ctx.moveTo(-0.6 * S, next.y * S + S/2); }
          else { ctx.moveTo((SNAKE_COLS + 0.6) * S, next.y * S + S/2); }
        } else if (Math.abs(dy) > SNAKE_ROWS / 2) {
          if (next.y < prev.y) { ctx.moveTo(next.x * S + S/2, -0.6 * S); }
          else { ctx.moveTo(next.x * S + S/2, (SNAKE_ROWS + 0.6) * S); }
        }
        ctx.lineTo(next.x * S + S/2, next.y * S + S/2);
      } else {
        // Insert corner vertex at turn points to prevent diagonal interpolation
        if (ease < 1 && snakePrevBody[i-1] && snakePrevBody[i]) {
          const d1x = snakeBody[i-1].x - snakePrevBody[i-1].x;
          const d1y = snakeBody[i-1].y - snakePrevBody[i-1].y;
          const d2x = snakeBody[i].x - snakePrevBody[i].x;
          const d2y = snakeBody[i].y - snakePrevBody[i].y;
          if (d1x !== d2x || d1y !== d2y) {
            ctx.lineTo(snakeBody[i].x * S + S/2, snakeBody[i].y * S + S/2);
          }
        }
        ctx.lineTo(positions[i].x * S + S/2, positions[i].y * S + S/2);
      }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Draw segments as circles
  positions.forEach((pos, i) => {
    const alpha = 1 - (i / positions.length) * 0.6;
    ctx.shadowColor = snakeColor;
    ctx.shadowBlur = i === 0 ? 6 : 0;
    ctx.fillStyle = i === 0 ? snakeColor : snakeColorSecondary;
    ctx.globalAlpha = alpha;
    const radius = i === 0 ? S * 0.45 : S * 0.32 * (1 - i/positions.length * 0.3);
    ctx.beginPath();
    ctx.arc(pos.x * S + S/2, pos.y * S + S/2, radius, 0, Math.PI*2);
    ctx.fill();

    if (i === 0) {
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      const r = S * 0.11, pr = S * 0.05;
      const px = pos.x * S, py = pos.y * S;
      let e1x,e1y,e2x,e2y;
      if(snakeDir.x===1){e1x=S*0.62;e1y=S*0.28;e2x=S*0.62;e2y=S*0.72;}
      else if(snakeDir.x===-1){e1x=S*0.38;e1y=S*0.28;e2x=S*0.38;e2y=S*0.72;}
      else if(snakeDir.y===1){e1x=S*0.28;e1y=S*0.62;e2x=S*0.72;e2y=S*0.62;}
      else{e1x=S*0.28;e1y=S*0.38;e2x=S*0.72;e2y=S*0.38;}
      ctx.fillStyle='#fff';
      ctx.beginPath();ctx.arc(px+e1x,py+e1y,r,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(px+e2x,py+e2y,r,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#111';
      ctx.beginPath();ctx.arc(px+e1x,py+e1y,pr,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(px+e2x,py+e2y,pr,0,Math.PI*2);ctx.fill();
    }
  });
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  // Particles (capped at 30 for performance)
  snakeParticles = snakeParticles.filter(p => p.life > 0);
  if (snakeParticles.length > 30) snakeParticles.splice(0, snakeParticles.length - 30);
  snakeParticles.forEach(p => {
    ctx.fillStyle = p.color || snakeColor;
    ctx.globalAlpha = p.life / 15;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.5, 0, Math.PI*2);
    ctx.fill();
    p.x += p.vx * 0.93;
    p.y += p.vy * 0.93;
    p.life--;
  });
  ctx.globalAlpha = 1;

  // Floating score popups
  snakePopups = snakePopups.filter(p => p.life > 0);
  snakePopups.forEach(p => {
    const progress = 1 - (p.life / p.maxLife);
    const alpha = 1 - progress;
    const yOff = progress * 40;
    const size = p.big ? Math.floor(S * 0.9) : Math.floor(S * 0.65);
    ctx.globalAlpha = alpha;
    ctx.font = 'bold ' + size + 'px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x, p.y - yOff);

    p.life--;
  });
  ctx.globalAlpha = 1;

  // Combo banner (cinematic slide-in from top)
  if (snakeComboBanner && snakeComboBanner.life > 0) {
    const b = snakeComboBanner;
    const progress = 1 - (b.life / b.maxLife);
    // Slide in for first 20%, hold, then fade out last 30%
    let alpha, yPos;
    if (progress < 0.15) {
      // Slide in
      const t = progress / 0.15;
      alpha = t;
      yPos = -20 + t * 20;
    } else if (progress < 0.7) {
      // Hold
      alpha = 1;
      yPos = 0;
    } else {
      // Fade out + slide up
      const t = (progress - 0.7) / 0.3;
      alpha = 1 - t;
      yPos = -t * 15;
    }
    const bannerY = 28 + yPos;
    const fires = b.combo >= 6 ? '🔥🔥🔥' : b.combo >= 4 ? '🔥🔥' : '🔥';
    const color = b.combo >= 6 ? '#FF453A' : b.combo >= 4 ? '#FF9F0A' : '#FFD60A';
    // Background stripe
    ctx.globalAlpha = alpha * 0.6;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, bannerY - 16, W, 34);
    // Colored accent line
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha * 0.8;
    ctx.fillRect(0, bannerY + 17, W, 2);
    // Text
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 15px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(fires + '  x' + b.combo + ' COMBO  +' + b.mult + 'x  ' + fires, W / 2, bannerY);
    b.life--;
  }
  ctx.globalAlpha = 1;
}

function snakeDrawGameOver(isNewHigh) {
  const canvas = document.getElementById('snake-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  // Dark overlay
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, W, H);

  // Card dimensions
  const cardW = Math.min(280, W * 0.7);
  const cardH = isNewHigh ? 240 : 210;
  const cx = (W - cardW) / 2;
  const cy = (H - cardH) / 2;

  // Glass card
  ctx.fillStyle = 'rgba(30,30,30,0.9)';
  ctx.beginPath();
  ctx.roundRect(cx, cy, cardW, cardH, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // GAME OVER title
  ctx.fillStyle = '#FF453A';
  ctx.font = 'bold 24px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', W/2, cy + 36);

  // Stats
  const elapsed = snakeStartTime > 0 ? Math.round((performance.now() - snakeStartTime) / 1000) : 0;
  const stats = [
    ['Score', snakeScore],
    ['Best', snakeHighScore],
    ['Speed', snakeGetSpeedLabel()],
    ['Length', snakeBody.length],
    ['Time', elapsed + 's']
  ];

  ctx.font = '13px -apple-system, sans-serif';
  const startY = cy + 65;
  stats.forEach((s, i) => {
    const y = startY + i * 26;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'left';
    ctx.fillText(s[0], cx + 30, y);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(String(s[1]), cx + cardW - 30, y);
    ctx.font = '13px -apple-system, sans-serif';
  });

  // NEW HIGH SCORE
  if (isNewHigh) {
    const nhY = startY + stats.length * 26 + 10;
    ctx.font = 'bold 14px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFD60A';
    ctx.fillText('🏆 NEW HIGH SCORE!', W/2, nhY);
  }

  // Play again hint
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.font = '11px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Reopen Snake to play again', W/2, cy + cardH - 14);
}

document.getElementById('snake-high').textContent = snakeHighScore;
// Snake canvas init deferred until window opens (see openWindow in app.js)

// ===== MOBILE SNAKE =====
let MOB_SNAKE_COLS = 25;
let MOB_SNAKE_ROWS = 25;
let mobSnake = { body: [{x:12,y:12}], prevBody: [{x:12,y:12}], dir: {x:1,y:0}, nextDir: {x:1,y:0}, dirQueue: [], food: {x:18,y:12}, score: 0, running: false, starting: false, over: false, paused: false, locked: false, interval: null, particles: [], cellSize: 14, lastTick: 0, animFrame: null, eatCount: 0, bonus: null, bonusTimer: null, combo: 0, lastEatTime: 0, comboTimer: null, popups: [], comboBanner: null, startTime: 0, controlMode: localStorage.getItem('snakeControlType') || 'wheel' };

// Virtual Joystick
function initJoystick() {
  const base = document.getElementById('joystick-base');
  const knob = document.getElementById('joystick-knob');
  const ring = base.querySelector('.joystick-ring');
  if (!base || !knob) return;

  const maxDist = 38; // max knob travel from center
  let touching = false;
  let lastDir = null;
  const arrows = {
    up: base.querySelector('.ja-up'),
    down: base.querySelector('.ja-down'),
    left: base.querySelector('.ja-left'),
    right: base.querySelector('.ja-right')
  };

  function getDir(dx, dy) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return null; // dead zone
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
    return dy > 0 ? 'down' : 'up';
  }

  function updateKnob(tx, ty) {
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = tx - cx;
    let dy = ty - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxDist) { dx = dx / dist * maxDist; dy = dy / dist * maxDist; }
    knob.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';

    // Direction
    const dir = getDir(dx, dy);
    if (dir && dir !== lastDir) {
      lastDir = dir;
      if (dir === 'up') mobSnakeDir(0, -1);
      else if (dir === 'down') mobSnakeDir(0, 1);
      else if (dir === 'left') mobSnakeDir(-1, 0);
      else if (dir === 'right') mobSnakeDir(1, 0);
    }

    // Light up arrow
    Object.values(arrows).forEach(a => a && a.classList.remove('lit'));
    if (dir && arrows[dir]) arrows[dir].classList.add('lit');

    // Sync ring color with snake color
    ring.style.borderColor = snakeColor + '44';
    ring.style.boxShadow = '0 0 20px ' + snakeColor + '20, 0 0 50px ' + snakeColor + '08, inset 0 0 20px ' + snakeColor + '0a';
    knob.style.borderColor = snakeColor + '55';
  }

  base.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touching = true;
    lastDir = null;
    base.classList.add('active');
    updateKnob(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });

  base.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!touching) return;
    updateKnob(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });

  const resetKnob = () => {
    touching = false;
    lastDir = null;
    base.classList.remove('active');
    knob.style.transform = 'translate(-50%, -50%)';
    Object.values(arrows).forEach(a => a && a.classList.remove('lit'));
  };
  base.addEventListener('touchend', resetKnob);
  base.addEventListener('touchcancel', resetKnob);
}

function initMobSnake() {
  const canvas = document.getElementById('mob-snake-canvas');
  if (!canvas) return;
  // Use actual rendered container size (flex layout calculates it for us)
  const canvasArea = canvas.parentElement;
  // Force a layout reflow so clientHeight is accurate
  canvasArea.offsetHeight;
  const availW = canvasArea.clientWidth;
  const availH = canvasArea.clientHeight;
  const cellByW = Math.floor(availW / MOB_SNAKE_COLS);
  const cellByH = Math.floor(availH / MOB_SNAKE_COLS);
  mobSnake.cellSize = Math.max(6, Math.min(cellByW, cellByH));
  MOB_SNAKE_ROWS = Math.max(10, Math.floor(availH / mobSnake.cellSize));
  const pxW = mobSnake.cellSize * MOB_SNAKE_COLS;
  const pxH = mobSnake.cellSize * MOB_SNAKE_ROWS;
  canvas.width = pxW;
  canvas.height = pxH;
  canvas.style.width = pxW + 'px';
  canvas.style.height = pxH + 'px';
  mobSnakeGridCache = null; // invalidate grid cache on resize
  mobSnakeReset();

  // Canvas tap to start game (blocked when locked)
  canvas.ontouchstart = (e) => {
    e.preventDefault();
    if (mobSnake.locked) return;
    if (mobSnake.controlMode === 'swipe') return; // swipe handler manages this
    if (!mobSnake.running && !mobSnake.starting) mobSnakeDir(1, 0);
  };
  document.getElementById('mob-snake-best').textContent = snakeHighScore;
  initControlSelector();
}

var _pauseAnimFrame = null;

function mobSnakeDrawPause() {
  var canvas = document.getElementById('mob-snake-canvas');
  if (!canvas || !mobSnake.paused) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  var now = performance.now();

  // Redraw game state underneath
  mobSnakeDraw(1);

  // Dark overlay with vignette
  var vg = ctx.createRadialGradient(W/2, H/2, W*0.15, W/2, H/2, W*0.7);
  vg.addColorStop(0, 'rgba(0,0,0,0.55)');
  vg.addColorStop(1, 'rgba(0,0,0,0.82)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  // Breathing pulse for pause icon
  var breath = Math.sin(now * 0.003) * 0.5 + 0.5;
  var iconSize = 28 + breath * 4;

  // Outer glow ring
  var ringR = 44 + breath * 6;
  ctx.beginPath();
  ctx.arc(W/2, H/2 - 10, ringR, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(254,188,46,' + (0.15 + breath * 0.1).toFixed(2) + ')';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner glow circle
  ctx.beginPath();
  ctx.arc(W/2, H/2 - 10, 36 + breath * 3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(254,188,46,' + (0.06 + breath * 0.04).toFixed(2) + ')';
  ctx.fill();

  // Pause bars icon
  ctx.shadowColor = '#FEBC2E';
  ctx.shadowBlur = 16 + breath * 8;
  ctx.fillStyle = '#FEBC2E';
  var barW = iconSize * 0.28, barH = iconSize * 0.75, gap = iconSize * 0.18;
  var bx = W/2 - gap/2 - barW, by = H/2 - 10 - barH/2;
  ctx.beginPath(); ctx.roundRect(bx, by, barW, barH, 3); ctx.fill();
  ctx.beginPath(); ctx.roundRect(W/2 + gap/2, by, barW, barH, 3); ctx.fill();
  ctx.shadowBlur = 0;

  // "PAUSED" text
  ctx.font = 'bold 15px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FEBC2E';
  ctx.globalAlpha = 0.9;
  ctx.fillText('PAUSED', W/2, H/2 + 40);
  ctx.globalAlpha = 1;

  // Subtitle
  ctx.font = '10px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,' + (0.2 + breath * 0.1).toFixed(2) + ')';
  ctx.fillText('tap play to resume', W/2, H/2 + 58);

  // Stats while paused
  var elapsed = mobSnake.startTime > 0 ? Math.round((now - mobSnake.startTime) / 1000) : 0;
  ctx.font = '10px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillText('Score ' + mobSnake.score + '  ·  Length ' + mobSnake.body.length + '  ·  ' + elapsed + 's', W/2, H/2 + 78);

  _pauseAnimFrame = requestAnimationFrame(mobSnakeDrawPause);
}

function mobSnakeTogglePause() {
  var S = mobSnake;
  if (!S.running || S.over) return;
  S.paused = !S.paused;
  var ov = document.getElementById('mob-snake-overlay');
  var icon = document.getElementById('mob-pause-icon');
  var pauseBtn = document.getElementById('mob-snake-pause');
  if (S.paused) {
    clearTimeout(S.interval); cancelAnimationFrame(S.animFrame);
    if (ov) ov.style.display = 'none';
    if (icon) icon.innerHTML = '<polygon points="5,3 19,12 5,21" fill="currentColor"/>';
    if (pauseBtn) pauseBtn.classList.add('paused-active');
    // Start pause animation loop on canvas
    mobSnakeDrawPause();
  } else {
    cancelAnimationFrame(_pauseAnimFrame);
    if (ov) ov.style.display = 'none';
    if (icon) icon.innerHTML = '<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>';
    if (pauseBtn) pauseBtn.classList.remove('paused-active');
    S.lastTick = performance.now();
    mobSnakeSchedule();
    mobSnakeRenderLoop();
  }
}

function mobSnakeDir(dx, dy) {
  var S = mobSnake;
  if (S.locked) return;
  if (S.over) { mobSnakeReset(); return; }
  if (!S.running && !S.starting) { mobSnakeStart(); return; }
  if (!S.running) return;
  // Queue-based direction with 2-move buffer (matches desktop responsiveness)
  var ref = S.dirQueue.length > 0 ? S.dirQueue[S.dirQueue.length - 1] : S.dir;
  if (ref.x === -dx && ref.y === -dy) return;
  if (ref.x === dx && ref.y === dy) return;
  if (dx !== 0 || dy !== 0) {
    S.dirQueue.push({x:dx, y:dy});
    if (S.dirQueue.length > 2) S.dirQueue.shift();
    // Instant tick if 25%+ of interval elapsed for snappy response
    var speed = Math.max(20, snakeBaseSpeed - Math.floor(S.score / 3) * 2.65);
    var elapsed = performance.now() - S.lastTick;
    if (elapsed > speed * 0.25) {
      clearTimeout(S.interval);
      S.lastTick = performance.now();
      mobSnakeTick();
      if (S.running && !S.paused) mobSnakeSchedule();
    }
  }
}

function mobSnakeStart() {
  if (mobSnake.starting || mobSnake.running) return;
  mobSnake.starting = true;
  document.getElementById('mob-snake-overlay').style.display = 'none';
  const canvas = document.getElementById('mob-snake-canvas');
  snakeCountdown(canvas, () => {
    mobSnake.starting = false;
    mobSnake.running = true;
    mobSnake.startTime = performance.now();
    mobSnake.prevBody = mobSnake.body.map(s => ({x:s.x,y:s.y}));
    mobSnake.lastTick = performance.now();
    mobSnakeSchedule();
    mobSnakeRenderLoop();
  });
}

function mobSnakeRenderLoop() {
  if (!mobSnake.running || mobSnake.over || mobSnake.paused) return;
  const t = Math.min((performance.now() - mobSnake.lastTick) / snakeGetSpeed(), 1);
  mobSnakeDraw(t);
  mobSnakeUpdateSpeedGlow();
  mobSnake.animFrame = requestAnimationFrame(mobSnakeRenderLoop);
}

function mobSnakeSchedule() {
  clearTimeout(mobSnake.interval);
  const speedup = Math.floor(mobSnake.score / 3) * 2.65;
  const speed = Math.max(20, snakeBaseSpeed - speedup);
  mobSnake.interval = setTimeout(() => { mobSnakeTick(); if (mobSnake.running) mobSnakeSchedule(); }, speed);
}

function mobSnakeReset() {
  clearTimeout(mobSnake.interval);
  cancelAnimationFrame(mobSnake.animFrame);
  clearInterval(mobSnake.comboTimer);
  mobSnake.body = [{x:12,y:12}]; mobSnake.prevBody = [{x:12,y:12}]; mobSnake.dir = {x:1,y:0}; mobSnake.nextDir = {x:1,y:0}; mobSnake.dirQueue = [];
  mobSnake.score = 0; mobSnake.over = false; mobSnake.running = false; mobSnake.starting = false; mobSnake.paused = false; mobSnake.locked = false; mobSnake.particles = []; mobSnake.popups = [];
  mobSnake.eatCount = 0; mobSnake.bonus = null; mobSnake.combo = 0; mobSnake.lastEatTime = 0; mobSnake.comboBanner = null;
  clearTimeout(mobSnake.bonusTimer); snakeColor = '#39d353'; snakeColorSecondary = '#26a641';
  mobSnake.food = {x: Math.floor(Math.random()*MOB_SNAKE_COLS), y: Math.floor(Math.random()*MOB_SNAKE_ROWS)};
  document.getElementById('mob-snake-score').textContent = '0';
  document.getElementById('mob-snake-speed').textContent = '1x';
  const mobSpeedCard = document.getElementById('mob-snake-speed-card');
  if (mobSpeedCard) { mobSpeedCard.classList.remove('bonus-active', 'bonus-urgent'); mobSpeedCard.style.removeProperty('--bonus-color'); mobSpeedCard.style.removeProperty('--bonus-glow'); mobSpeedCard.style.removeProperty('--urgency-speed'); }
  const ov = document.getElementById('mob-snake-overlay');
  if (ov) { ov.style.display = 'block'; ov.innerHTML = '<div style="font-size:22px;font-weight:700;color:#39d353;text-shadow:0 0 20px rgba(57,211,83,0.5);">SNAKE NEON</div><div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:6px;">Tap anywhere to play</div>'; }
  mobSnakeDraw();
}

function mobSnakeTick() {
  const S = mobSnake;
  S.prevBody = S.body.map(s => ({x:s.x,y:s.y}));
  if (S.dirQueue.length > 0) { S.dir = S.dirQueue.shift(); S.nextDir = S.dir; }
  else S.dir = S.nextDir;
  S.lastTick = performance.now();
  const head = { x: S.body[0].x + S.dir.x, y: S.body[0].y + S.dir.y };
  // Wrap around edges
  if (head.x < 0) head.x = MOB_SNAKE_COLS - 1;
  else if (head.x >= MOB_SNAKE_COLS) head.x = 0;
  if (head.y < 0) head.y = MOB_SNAKE_ROWS - 1;
  else if (head.y >= MOB_SNAKE_ROWS) head.y = 0;
  // Game over only on self collision
  if (S.body.some(s => s.x === head.x && s.y === head.y)) {
    clearTimeout(S.interval); cancelAnimationFrame(S.animFrame); clearInterval(S.comboTimer);
    S.over = true; S.running = false; S.locked = true;
    snakeDeathSfx();
    const isNewHigh = S.score > snakeHighScore;
    if (isNewHigh) { snakeHighScore = S.score; localStorage.setItem('snakeHigh', snakeHighScore); document.getElementById('mob-snake-best').textContent = snakeHighScore; document.getElementById('snake-high').textContent = snakeHighScore; }
    localStorage.setItem('snakeLastScore', S.score);
    // Death effects
    const mobWrap = document.querySelector('.mob-snake-canvas-area');
    if (mobWrap) mobWrap.classList.add('death-flash', 'shake');
    // Draw game over on canvas
    mobSnakeDraw(1);
    mobSnakeDrawGameOver(isNewHigh);
    // After 3 seconds, close and go to experience
    setTimeout(() => {
      if (mobWrap) mobWrap.classList.remove('death-flash', 'shake');
      closeMobileSection('snake');
      mobSnakeReset();
      showNotif('Done playing? Now back to work 😂', 'Snake Neon');
      setTimeout(() => expandMobileSection(null, 'github'), 300);
    }, 3000);
    return;
  }
  S.body.unshift(head);
  let mobAte = false;

  // Check bonus (bigger catch area: 1 cell radius + decaying score)
  if (S.bonus && Math.abs(head.x - S.bonus.x) <= 1 && Math.abs(head.y - S.bonus.y) <= 1) {
    const elapsed = performance.now() - S.bonus.spawnTime;
    const timeRatio = Math.max(0, 1 - elapsed / BONUS_DURATION);
    const baseScore = Math.round(BONUS_MIN_SCORE + (BONUS_MAX_SCORE - BONUS_MIN_SCORE) * timeRatio);
    const mult = S.combo >= 6 ? 3 : S.combo >= 4 ? 2 : S.combo >= 2 ? 1.5 : 1;
    const pts = Math.round(baseScore * mult);
    S.score += pts; clearTimeout(S.bonusTimer);
    S.popups.push({ x: S.bonus.x * S.cellSize + S.cellSize/2, y: S.bonus.y * S.cellSize + S.cellSize/2, text: '+' + pts, color: '#FFD60A', life: 40, maxLife: 40, big: true });
    const mbc = bonusColors[S.bonus.colorIdx || 0];
    snakeColor = mbc.main; snakeColorSecondary = mbc.secondary;
    for(let i=0;i<20;i++) S.particles.push({x:S.bonus.x*S.cellSize+S.cellSize/2,y:S.bonus.y*S.cellSize+S.cellSize/2,vx:(Math.random()-0.5)*10,vy:(Math.random()-0.5)*10,life:25,color:mbc.main});
    S.bonus = null; mobAte = true; snakeBonusEatSfx();
  }

  // Check regular food
  if (head.x === S.food.x && head.y === S.food.y) {
    // Combo
    const now = performance.now();
    if (S.lastEatTime > 0 && (now - S.lastEatTime) < snakeComboDecay) S.combo++;
    else S.combo = 1;
    S.lastEatTime = now;
    clearInterval(S.comboTimer);
    S.comboTimer = setInterval(() => { if (performance.now() - S.lastEatTime >= snakeComboDecay) { S.combo = 0; clearInterval(S.comboTimer); } }, 50);
    const mult = S.combo >= 6 ? 3 : S.combo >= 4 ? 2 : S.combo >= 2 ? 1.5 : 1;
    const pts = Math.round(1 * mult);
    S.score += pts; S.eatCount++;
    S.popups.push({ x: S.food.x * S.cellSize + S.cellSize/2, y: S.food.y * S.cellSize + S.cellSize/2, text: '+' + pts, color: S.combo >= 3 ? '#FFD60A' : '#39d353', life: 40, maxLife: 40, big: false });
    if (S.combo >= 2) S.comboBanner = { combo: S.combo, mult: mult, life: 60, maxLife: 60 };
    for(let i=0;i<6;i++) S.particles.push({x:S.food.x*S.cellSize+S.cellSize/2,y:S.food.y*S.cellSize+S.cellSize/2,vx:(Math.random()-0.5)*5,vy:(Math.random()-0.5)*5,life:12});
    let np; do{np={x:Math.floor(Math.random()*MOB_SNAKE_COLS),y:Math.floor(Math.random()*MOB_SNAKE_ROWS)};}while(S.body.some(s=>s.x===np.x&&s.y===np.y)); S.food=np;
    snakeEatSfx(); mobAte = true;
    if(S.eatCount%3===0&&!S.bonus){let bp;do{bp={x:2+Math.floor(Math.random()*(MOB_SNAKE_COLS-4)),y:2+Math.floor(Math.random()*(MOB_SNAKE_ROWS-4))};}while(S.body.some(s=>s.x===bp.x&&s.y===bp.y)||(bp.x===S.food.x&&bp.y===S.food.y));bp.colorIdx=Math.floor(Math.random()*bonusColors.length);bp.spawnTime=performance.now();S.bonus=bp;S.bonusTimer=setTimeout(()=>{S.bonus=null;snakeBonusMissSfx();},BONUS_DURATION);snakeBonusSfx();}
  }

  if (mobAte) {
    localStorage.setItem('snakeLastScore', S.score);
    const mScEl = document.getElementById('mob-snake-score');
    mScEl.textContent = S.score; mScEl.style.transform='scale(1.3)'; setTimeout(()=>mScEl.style.transform='',150);
    const lvl=Math.min(Math.round(Math.floor(S.score/3)*2.65/((snakeBaseSpeed-20)/50))+1,50);
    document.getElementById('mob-snake-speed').textContent=lvl+'x';
    S.prevBody.unshift(S.prevBody[0]);
  } else { S.body.pop(); }
}

function mobSnakeDraw(t) {
  if(t===undefined)t=1;
  const canvas = document.getElementById('mob-snake-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const MS = mobSnake;
  const C = MS.cellSize;
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);

  // Dotted grid (pre-rendered offscreen canvas)
  if (!mobSnakeGridCache || mobSnakeGridCache.width !== W || mobSnakeGridCache.height !== H) {
    mobSnakeGridCache = document.createElement('canvas');
    mobSnakeGridCache.width = W; mobSnakeGridCache.height = H;
    const gctx = mobSnakeGridCache.getContext('2d');
    gctx.fillStyle = 'rgba(255,255,255,0.12)';
    for(let gx=0;gx<MOB_SNAKE_COLS;gx++)for(let gy=0;gy<MOB_SNAKE_ROWS;gy++){gctx.beginPath();gctx.arc(gx*C+C/2,gy*C+C/2,1.5,0,Math.PI*2);gctx.fill();}
  }
  ctx.drawImage(mobSnakeGridCache, 0, 0);

  // Cache timestamp for all animations this frame
  const frameNow = Date.now();

  // Regular food
  const pulse = 0.85+Math.sin(frameNow/200)*0.15;
  ctx.shadowColor='#FF5F57';ctx.shadowBlur=10*pulse;ctx.fillStyle='#FF5F57';
  ctx.beginPath();ctx.arc(MS.food.x*C+C/2,MS.food.y*C+C/2,C*0.3*pulse,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;ctx.fillStyle='rgba(255,255,255,0.5)';ctx.beginPath();ctx.arc(MS.food.x*C+C/2,MS.food.y*C+C/2,C*0.08,0,Math.PI*2);ctx.fill();

  // Bonus food (flashy with timer ring + decaying score)
  if(MS.bonus){
    const bCol=bonusColors[MS.bonus.colorIdx||0];
    const elapsed=performance.now()-MS.bonus.spawnTime;
    const timeRatio=Math.max(0,1-elapsed/BONUS_DURATION);
    const currentScore=Math.round(BONUS_MIN_SCORE+(BONUS_MAX_SCORE-BONUS_MIN_SCORE)*timeRatio);
    const breathe=Math.sin(frameNow*0.004)*0.5+0.5;
    const bp=0.92+breathe*0.08;
    const bx=MS.bonus.x*C+C/2,by=MS.bonus.y*C+C/2,bR=C*0.75*bp;
    // Timer ring
    ctx.strokeStyle=bCol.main;ctx.lineWidth=2.5;ctx.shadowColor=bCol.glow;ctx.shadowBlur=10;ctx.globalAlpha=0.7;
    ctx.beginPath();ctx.arc(bx,by,C*1.1,-Math.PI/2,-Math.PI/2+(Math.PI*2*timeRatio),false);ctx.stroke();
    ctx.shadowBlur=0;ctx.globalAlpha=1;
    // Urgency glow (smooth sine, fixed freq)
    if(timeRatio<0.33){const urgency=(0.33-timeRatio)/0.33;const glow=(Math.sin(frameNow*0.008)*0.5+0.5)*(0.08+urgency*0.14);ctx.fillStyle=bCol.main;ctx.globalAlpha=glow;ctx.beginPath();ctx.arc(bx,by,C*(1.2+breathe*0.2),0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
    // Glow + ball
    ctx.shadowColor=bCol.glow;ctx.shadowBlur=10;ctx.fillStyle=bCol.main+'18';ctx.beginPath();ctx.arc(bx,by,C*(0.95+breathe*0.1),0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=8;ctx.fillStyle=bCol.main;ctx.beginPath();ctx.arc(bx,by,bR,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;ctx.fillStyle='rgba(255,255,255,0.35)';ctx.beginPath();ctx.arc(bx-bR*0.2,by-bR*0.25,bR*0.3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(0,0,0,0.8)';ctx.font='bold '+Math.floor(C*0.55)+'px -apple-system,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('+'+currentScore,bx,by+1);
  }

  // Snake body
  const positions=MS.body.map((seg,i)=>{const prev=MS.prevBody[i]||seg;let px=prev.x,py=prev.y;if(seg.x-px>MOB_SNAKE_COLS/2)px+=MOB_SNAKE_COLS;else if(px-seg.x>MOB_SNAKE_COLS/2)px-=MOB_SNAKE_COLS;if(seg.y-py>MOB_SNAKE_ROWS/2)py+=MOB_SNAKE_ROWS;else if(py-seg.y>MOB_SNAKE_ROWS/2)py-=MOB_SNAKE_ROWS;return{x:snakeLerp(px,seg.x,t),y:snakeLerp(py,seg.y,t)};});

  if(positions.length>1){ctx.strokeStyle=snakeColorSecondary;ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=C*0.6;ctx.shadowColor=snakeColor;ctx.shadowBlur=2;ctx.globalAlpha=0.8;ctx.beginPath();ctx.moveTo(positions[0].x*C+C/2,positions[0].y*C+C/2);for(let i=1;i<positions.length;i++){const ddx=positions[i].x-positions[i-1].x,ddy=positions[i].y-positions[i-1].y;if(Math.abs(ddx)>MOB_SNAKE_COLS/2||Math.abs(ddy)>MOB_SNAKE_ROWS/2){const prev=positions[i-1],next=positions[i];if(Math.abs(ddx)>MOB_SNAKE_COLS/2){if(prev.x<next.x)ctx.lineTo(-0.6*C,prev.y*C+C/2);else ctx.lineTo((MOB_SNAKE_COLS+0.6)*C,prev.y*C+C/2);}if(Math.abs(ddy)>MOB_SNAKE_ROWS/2){if(prev.y<next.y)ctx.lineTo(prev.x*C+C/2,-0.6*C);else ctx.lineTo(prev.x*C+C/2,(MOB_SNAKE_ROWS+0.6)*C);}ctx.stroke();ctx.beginPath();if(Math.abs(ddx)>MOB_SNAKE_COLS/2){if(next.x<prev.x)ctx.moveTo(-0.6*C,next.y*C+C/2);else ctx.moveTo((MOB_SNAKE_COLS+0.6)*C,next.y*C+C/2);}else if(Math.abs(ddy)>MOB_SNAKE_ROWS/2){if(next.y<prev.y)ctx.moveTo(next.x*C+C/2,-0.6*C);else ctx.moveTo(next.x*C+C/2,(MOB_SNAKE_ROWS+0.6)*C);}ctx.lineTo(next.x*C+C/2,next.y*C+C/2);}else{if(t<1&&MS.prevBody[i-1]&&MS.prevBody[i]){const d1x=MS.body[i-1].x-MS.prevBody[i-1].x,d1y=MS.body[i-1].y-MS.prevBody[i-1].y,d2x=MS.body[i].x-MS.prevBody[i].x,d2y=MS.body[i].y-MS.prevBody[i].y;if(d1x!==d2x||d1y!==d2y){ctx.lineTo(MS.body[i].x*C+C/2,MS.body[i].y*C+C/2);}}ctx.lineTo(positions[i].x*C+C/2,positions[i].y*C+C/2);}}ctx.stroke();ctx.shadowBlur=0;}

  positions.forEach((pos,i)=>{const alpha=1-(i/positions.length)*0.6;ctx.shadowColor=snakeColor;ctx.shadowBlur=i===0?4:0;ctx.fillStyle=i===0?snakeColor:snakeColorSecondary;ctx.globalAlpha=alpha;const radius=i===0?C*0.45:C*0.3*(1-i/positions.length*0.3);ctx.beginPath();ctx.arc(pos.x*C+C/2,pos.y*C+C/2,radius,0,Math.PI*2);ctx.fill();
  if(i===0){ctx.shadowBlur=0;ctx.globalAlpha=1;const r=C*0.1,pr=C*0.05;const px=pos.x*C,py=pos.y*C;let e1x,e1y,e2x,e2y;if(MS.dir.x===1){e1x=C*0.62;e1y=C*0.28;e2x=C*0.62;e2y=C*0.72;}else if(MS.dir.x===-1){e1x=C*0.38;e1y=C*0.28;e2x=C*0.38;e2y=C*0.72;}else if(MS.dir.y===1){e1x=C*0.28;e1y=C*0.62;e2x=C*0.72;e2y=C*0.62;}else{e1x=C*0.28;e1y=C*0.38;e2x=C*0.72;e2y=C*0.38;}ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(px+e1x,py+e1y,r,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(px+e2x,py+e2y,r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#111';ctx.beginPath();ctx.arc(px+e1x,py+e1y,pr,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(px+e2x,py+e2y,pr,0,Math.PI*2);ctx.fill();}});
  ctx.globalAlpha=1;ctx.shadowBlur=0;

  // Particles
  MS.particles=MS.particles.filter(p=>p.life>0);if(MS.particles.length>30)MS.particles.splice(0,MS.particles.length-30);MS.particles.forEach(p=>{ctx.fillStyle=p.color||snakeColor;ctx.globalAlpha=p.life/12;ctx.beginPath();ctx.arc(p.x,p.y,2.5,0,Math.PI*2);ctx.fill();p.x+=p.vx*0.93;p.y+=p.vy*0.93;p.life--;});ctx.globalAlpha=1;

  // Floating score popups
  MS.popups=MS.popups.filter(p=>p.life>0);
  MS.popups.forEach(p=>{
    const progress=1-(p.life/p.maxLife);const alpha=1-progress;const yOff=progress*35;
    const size=p.big?Math.floor(C*0.85):Math.floor(C*0.6);
    ctx.globalAlpha=alpha;ctx.font='bold '+size+'px -apple-system,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle=p.color;
    ctx.fillText(p.text,p.x,p.y-yOff);p.life--;
  });ctx.globalAlpha=1;

  // Combo banner
  if(MS.comboBanner&&MS.comboBanner.life>0){
    const b=MS.comboBanner;const progress=1-(b.life/b.maxLife);
    let alpha,yPos;
    if(progress<0.15){const tt=progress/0.15;alpha=tt;yPos=-20+tt*20;}
    else if(progress<0.7){alpha=1;yPos=0;}
    else{const tt=(progress-0.7)/0.3;alpha=1-tt;yPos=-tt*15;}
    const bannerY=24+yPos;
    const fires=b.combo>=6?'🔥🔥🔥':b.combo>=4?'🔥🔥':'🔥';
    const color=b.combo>=6?'#FF453A':b.combo>=4?'#FF9F0A':'#FFD60A';
    ctx.globalAlpha=alpha*0.6;ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,bannerY-14,W,30);
    ctx.fillStyle=color;ctx.globalAlpha=alpha*0.8;ctx.fillRect(0,bannerY+15,W,2);
    ctx.globalAlpha=alpha;ctx.font='bold 13px -apple-system,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle=color;
    ctx.fillText(fires+' x'+b.combo+' COMBO +'+b.mult+'x '+fires,W/2,bannerY);b.life--;
  }
  ctx.globalAlpha=1;
}

function mobSnakeDrawGameOver(isNewHigh) {
  const canvas = document.getElementById('mob-snake-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const S = mobSnake;
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, W, H);
  const cardW = Math.min(240, W * 0.75);
  const cardH = isNewHigh ? 220 : 195;
  const cx = (W - cardW) / 2;
  const cy = (H - cardH) / 2;
  ctx.fillStyle = 'rgba(30,30,30,0.9)';
  ctx.beginPath(); ctx.roundRect(cx, cy, cardW, cardH, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#FF453A'; ctx.font = 'bold 20px -apple-system,sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', W/2, cy + 32);
  const elapsed = S.startTime > 0 ? Math.round((performance.now() - S.startTime) / 1000) : 0;
  const stats = [['Score', S.score], ['Best', snakeHighScore], ['Length', S.body.length], ['Time', elapsed + 's']];
  ctx.font = '12px -apple-system,sans-serif';
  const startY = cy + 58;
  stats.forEach((st, i) => {
    const y = startY + i * 24;
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.textAlign = 'left'; ctx.fillText(st[0], cx + 24, y);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px -apple-system,sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(String(st[1]), cx + cardW - 24, y); ctx.font = '12px -apple-system,sans-serif';
  });
  if (isNewHigh) {
    ctx.font = 'bold 13px -apple-system,sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = '#FFD60A';
    ctx.fillText('🏆 NEW HIGH SCORE!', W/2, startY + stats.length * 24 + 8);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = '10px -apple-system,sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Reopen Snake to play again', W/2, cy + cardH - 12);
}

// ===== MOBILE CONTROL SYSTEM =====
var _swipeCleanup = null; // stores swipe listener removal function
var _dpadCleanup = null;  // stores dpad listener removal function

function initControlSelector() {
  var selector = document.getElementById('mob-control-selector');
  if (!selector) return;
  var btns = selector.querySelectorAll('.ctrl-mode-btn');
  var saved = mobSnake.controlMode;
  btns.forEach(function(btn) {
    var mode = btn.dataset.mode;
    btn.classList.toggle('active', mode === saved);
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      if (mode === mobSnake.controlMode) return;
      btns.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      switchControlMode(mode);
    });
  });
  switchControlMode(saved);
}

function switchControlMode(mode) {
  mobSnake.controlMode = mode;
  localStorage.setItem('snakeControlType', mode);
  // Cleanup previous control listeners
  if (_swipeCleanup) { _swipeCleanup(); _swipeCleanup = null; }
  if (_dpadCleanup) { _dpadCleanup(); _dpadCleanup = null; }
  // Hide all control containers
  var joystick = document.getElementById('joystick-base');
  var dpad = document.getElementById('mob-dpad');
  var swipeHint = document.getElementById('mob-swipe-hint');
  if (joystick) joystick.style.display = 'none';
  if (dpad) dpad.style.display = 'none';
  if (swipeHint) swipeHint.style.display = 'none';
  // Show + init selected control
  if (mode === 'wheel') {
    if (joystick) joystick.style.display = '';
    initJoystick();
  } else if (mode === 'dpad') {
    if (dpad) dpad.style.display = 'grid';
    _dpadCleanup = initDPad();
  } else if (mode === 'swipe') {
    if (swipeHint) swipeHint.style.display = 'flex';
    _swipeCleanup = initSwipeGestures();
  }
}

function initDPad() {
  var dpad = document.getElementById('mob-dpad');
  if (!dpad) return null;
  var dirMap = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] };
  var btns = dpad.querySelectorAll('.dpad-btn');
  var handlers = [];
  btns.forEach(function(btn) {
    var dir = btn.dataset.dir;
    if (!dir || !dirMap[dir]) return;
    var onStart = function(e) {
      e.preventDefault();
      btn.classList.add('pressed');
      mobSnakeDir(dirMap[dir][0], dirMap[dir][1]);
    };
    var onEnd = function(e) {
      e.preventDefault();
      btn.classList.remove('pressed');
    };
    btn.addEventListener('touchstart', onStart, { passive: false });
    btn.addEventListener('touchend', onEnd, { passive: false });
    btn.addEventListener('touchcancel', onEnd, { passive: false });
    handlers.push(function() {
      btn.removeEventListener('touchstart', onStart);
      btn.removeEventListener('touchend', onEnd);
      btn.removeEventListener('touchcancel', onEnd);
      btn.classList.remove('pressed');
    });
  });
  return function() { handlers.forEach(function(h) { h(); }); };
}

function initSwipeGestures() {
  var canvas = document.getElementById('mob-snake-canvas');
  if (!canvas) return null;
  var startX = 0, startY = 0, tracking = false;
  var deadZone = 25;
  var onStart = function(e) {
    e.preventDefault();
    if (mobSnake.locked) return;
    var t = e.touches[0];
    startX = t.clientX; startY = t.clientY; tracking = true;
    if (!mobSnake.running && !mobSnake.starting) mobSnakeStart();
  };
  var onMove = function(e) {
    e.preventDefault();
    if (!tracking || !mobSnake.running) return;
    var t = e.touches[0];
    var dx = t.clientX - startX;
    var dy = t.clientY - startY;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > deadZone) {
      if (Math.abs(dx) > Math.abs(dy)) {
        mobSnakeDir(dx > 0 ? 1 : -1, 0);
      } else {
        mobSnakeDir(0, dy > 0 ? 1 : -1);
      }
      // Reset origin for continuous swiping
      startX = t.clientX; startY = t.clientY;
    }
  };
  var onEnd = function(e) {
    e.preventDefault();
    tracking = false;
  };
  canvas.addEventListener('touchstart', onStart, { passive: false });
  canvas.addEventListener('touchmove', onMove, { passive: false });
  canvas.addEventListener('touchend', onEnd, { passive: false });
  canvas.addEventListener('touchcancel', onEnd, { passive: false });
  return function() {
    canvas.removeEventListener('touchstart', onStart);
    canvas.removeEventListener('touchmove', onMove);
    canvas.removeEventListener('touchend', onEnd);
    canvas.removeEventListener('touchcancel', onEnd);
  };
}
