// ===== SNAKE NEON GAME =====
const SNAKE_COLS = 25;
const SNAKE_ROWS = 25;
let snakeCellSize = 20;
let snakeBody = [{x:12,y:12}];
let snakePrevBody = [{x:12,y:12}];
let snakeDir = {x:1,y:0};
let snakeNextDir = {x:1,y:0};
let snakeFood = {x:18,y:12};
let snakeScore = 0;
let snakeHighScore = parseInt(localStorage.getItem('snakeHigh') || '0');
let snakeRunning = false;
let snakeGameOver = false;
let snakeInterval = null;
let snakeParticles = [];
let snakeBaseSpeed = 200;
let snakeEatCount = 0;
let snakeBonus = null; // {x, y, color}
let snakeBonusTimer = null;
let snakeColor = '#39d353'; // current snake color
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

function snakeGetSpeed() {
  const speedup = Math.floor(snakeScore / 3) * 10;
  return Math.max(70, snakeBaseSpeed - speedup);
}

function snakeGetSpeedLabel() {
  const speed = snakeGetSpeed();
  const level = Math.round((snakeBaseSpeed - speed) / ((snakeBaseSpeed - 70) / 10)) + 1;
  return Math.min(level, 10) + 'x';
}

function snakeResizeCanvas() {
  const canvas = document.getElementById('snake-canvas');
  if (!canvas) return;
  const w = canvas.parentElement.clientWidth;
  snakeCellSize = Math.floor(w / SNAKE_COLS);
  const pxW = snakeCellSize * SNAKE_COLS;
  const pxH = snakeCellSize * SNAKE_ROWS;
  canvas.width = pxW;
  canvas.height = pxH;
  canvas.style.width = pxW + 'px';
  canvas.style.height = pxH + 'px';
  snakeDraw(1);
}

function snakeSetDir(dx, dy) {
  if (snakeGameOver) { snakeReset(); return; }
  if (!snakeRunning) { snakeStart(); }
  if (snakeDir.x === -dx && snakeDir.y === -dy) return;
  if (dx !== 0 || dy !== 0) snakeNextDir = {x:dx, y:dy};
}

function snakeTogglePause() {
  if (snakeGameOver || !snakeRunning) return;
  snakePaused = !snakePaused;
  const overlay = document.getElementById('snake-overlay');
  if (snakePaused) {
    clearTimeout(snakeInterval);
    cancelAnimationFrame(snakeAnimFrame);
    if (overlay) { overlay.style.display = 'block'; overlay.innerHTML = '<div style="font-size:28px;font-weight:700;color:#FEBC2E;text-shadow:0 0 20px rgba(254,188,46,0.4);">PAUSED</div><div style="font-size:13px;color:rgba(255,255,255,0.4);margin-top:8px;">Press Esc to resume</div>'; }
  } else {
    if (overlay) overlay.style.display = 'none';
    snakeLastTick = performance.now();
    snakeScheduleNext();
    snakeRenderLoop();
  }
}

document.addEventListener('keydown', (e) => {
  const win = document.getElementById('win-snake');
  if (!win || !win.classList.contains('open')) return;
  if (e.key === 'Escape') { e.preventDefault(); snakeTogglePause(); return; }
  if (snakePaused) return;
  if (e.key === 'ArrowUp') { e.preventDefault(); snakeSetDir(0,-1); }
  if (e.key === 'ArrowDown') { e.preventDefault(); snakeSetDir(0,1); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); snakeSetDir(-1,0); }
  if (e.key === 'ArrowRight') { e.preventDefault(); snakeSetDir(1,0); }
});

function snakeStart() {
  snakeRunning = true;
  snakeResizeCanvas();
  const overlay = document.getElementById('snake-overlay');
  if (overlay) overlay.style.display = 'none';
  snakeLastTick = performance.now();
  snakePrevBody = JSON.parse(JSON.stringify(snakeBody));
  snakeScheduleNext();
  snakeRenderLoop();
}

function snakeRenderLoop() {
  if (!snakeRunning || snakePaused) return;
  const now = performance.now();
  const elapsed = now - snakeLastTick;
  const t = Math.min(elapsed / snakeGetSpeed(), 1);
  snakeDraw(t);
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
  snakeBody = [{x:12,y:12}];
  snakePrevBody = [{x:12,y:12}];
  snakeDir = {x:1,y:0};
  snakeNextDir = {x:1,y:0};
  snakeScore = 0;
  snakeGameOver = false;
  snakeRunning = false;
  snakePaused = false;
  snakeParticles = [];
  snakeEatCount = 0;
  snakeBonus = null;
  snakeColor = '#39d353';
  snakeColorSecondary = '#26a641';
  clearTimeout(snakeBonusTimer);
  snakePlaceFood();
  document.getElementById('snake-score').textContent = '0';
  document.getElementById('snake-speed-label').textContent = 'Speed: 1x';
  const overlay = document.getElementById('snake-overlay');
  if (overlay) { overlay.style.display = 'block'; overlay.innerHTML = '<div style="font-size:28px;font-weight:700;color:#39d353;text-shadow:0 0 20px rgba(57,211,83,0.5);">SNAKE NEON</div><div style="font-size:13px;color:rgba(255,255,255,0.4);margin-top:8px;">Press any arrow key or tap to start</div>'; }
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
  snakePrevBody = JSON.parse(JSON.stringify(snakeBody));
  snakeDir = snakeNextDir;
  const head = { x: snakeBody[0].x + snakeDir.x, y: snakeBody[0].y + snakeDir.y };

  if (head.x < 0 || head.x >= SNAKE_COLS || head.y < 0 || head.y >= SNAKE_ROWS || snakeBody.some(s => s.x === head.x && s.y === head.y)) {
    clearTimeout(snakeInterval);
    cancelAnimationFrame(snakeAnimFrame);
    snakeGameOver = true;
    snakeRunning = false;
    if (snakeScore > snakeHighScore) {
      snakeHighScore = snakeScore;
      localStorage.setItem('snakeHigh', snakeHighScore);
      document.getElementById('snake-high').textContent = snakeHighScore;
    }
    localStorage.setItem('snakeLastScore', snakeScore);
    // Instant: close snake, open LinkedIn, show notification
    closeWindow('snake');
    openWindow('linkedin');
    showNotif('Done playing? Now back to work 😂', 'Snake Neon');
    snakeDraw(1);
    return;
  }

  snakeBody.unshift(head);
  let ate = false;

  // Check bonus food
  if (snakeBonus && head.x === snakeBonus.x && head.y === snakeBonus.y) {
    snakeScore += 5;
    clearTimeout(snakeBonusTimer);
    const bc = bonusColors[snakeBonus.colorIdx || 0];
    snakeColor = bc.main;
    snakeColorSecondary = bc.secondary;
    for (let i = 0; i < 16; i++) {
      snakeParticles.push({ x: snakeBonus.x * snakeCellSize + snakeCellSize/2, y: snakeBonus.y * snakeCellSize + snakeCellSize/2, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, life: 20, color: bc.main });
    }
    snakeBonus = null;
    ate = true;
    playSfx(sfxClick);
  }

  // Check regular food
  if (head.x === snakeFood.x && head.y === snakeFood.y) {
    snakeScore++;
    snakeEatCount++;
    for (let i = 0; i < 8; i++) {
      snakeParticles.push({ x: snakeFood.x * snakeCellSize + snakeCellSize/2, y: snakeFood.y * snakeCellSize + snakeCellSize/2, vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6, life: 15 });
    }
    snakePlaceFood();
    playSfx(sfxClick);
    ate = true;
    // Spawn bonus every 3 eats
    if (snakeEatCount % 3 === 0 && !snakeBonus) {
      let bp; do { bp = {x: Math.floor(Math.random()*SNAKE_COLS), y: Math.floor(Math.random()*SNAKE_ROWS)}; } while (snakeBody.some(s=>s.x===bp.x&&s.y===bp.y) || (bp.x===snakeFood.x&&bp.y===snakeFood.y));
      bp.colorIdx = Math.floor(Math.random() * bonusColors.length);
      snakeBonus = bp;
      // Bonus disappears after 5 seconds
      snakeBonusTimer = setTimeout(() => { snakeBonus = null; }, 5000);
    }
  }

  if (ate) {
    localStorage.setItem('snakeLastScore', snakeScore);
    const scoreEl = document.getElementById('snake-score');
    scoreEl.textContent = snakeScore;
    scoreEl.style.transform = 'scale(1.4)';
    setTimeout(() => scoreEl.style.transform = '', 200);
    document.getElementById('snake-speed-label').textContent = 'Speed: ' + snakeGetSpeedLabel();
    // Streak indicator
    const streakEl = document.getElementById('snake-streak');
    if (snakeEatCount > 1 && snakeEatCount % 3 === 0) {
      streakEl.textContent = '🔥 x' + (snakeEatCount / 3);
      streakEl.style.opacity = '1';
      setTimeout(() => streakEl.style.opacity = '0', 1500);
    }
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

  // Smooth easing
  const ease = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2;

  // Dotted grid background
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  for (let gx = 0; gx < SNAKE_COLS; gx++) {
    for (let gy = 0; gy < SNAKE_ROWS; gy++) {
      ctx.beginPath();
      ctx.arc(gx * S + S/2, gy * S + S/2, 1.5, 0, Math.PI*2);
      ctx.fill();
    }
  }

  // Food pulsing glow
  const pulse = 0.85 + Math.sin(Date.now() / 200) * 0.15;
  ctx.shadowColor = '#FF5F57';
  ctx.shadowBlur = 16 * pulse;
  ctx.fillStyle = '#FF5F57';
  ctx.beginPath();
  ctx.arc(snakeFood.x * S + S/2, snakeFood.y * S + S/2, S * 0.3 * pulse, 0, Math.PI*2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(snakeFood.x * S + S/2, snakeFood.y * S + S/2, S * 0.08, 0, Math.PI*2);
  ctx.fill();

  // Bonus food (colored ball with breathing)
  if (snakeBonus) {
    const bCol = bonusColors[snakeBonus.colorIdx || 0];
    const bp = 0.92 + Math.sin(Date.now() / 300) * 0.08;
    const bx = snakeBonus.x * S + S/2;
    const by = snakeBonus.y * S + S/2;
    const bRadius = S * 0.75 * bp;
    // Outer glow ring
    ctx.shadowColor = bCol.glow;
    ctx.shadowBlur = 28 * bp;
    ctx.fillStyle = bCol.main + '26';
    ctx.beginPath();
    ctx.arc(bx, by, S * 0.95 * bp, 0, Math.PI*2);
    ctx.fill();
    // Main ball
    ctx.shadowBlur = 20;
    ctx.fillStyle = bCol.main;
    ctx.beginPath();
    ctx.arc(bx, by, bRadius, 0, Math.PI*2);
    ctx.fill();
    // Inner highlight
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(bx - bRadius*0.2, by - bRadius*0.2, bRadius*0.3, 0, Math.PI*2);
    ctx.fill();
    // +5 text
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.font = 'bold ' + Math.floor(S*0.55) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+5', snakeBonus.x * S + S/2, snakeBonus.y * S + S/2 + 1);
  }

  // Interpolated positions
  const positions = snakeBody.map((seg, i) => {
    const prev = snakePrevBody[i] || seg;
    return { x: snakeLerp(prev.x, seg.x, ease), y: snakeLerp(prev.y, seg.y, ease) };
  });

  // Draw smooth connected body (lines between segments)
  if (positions.length > 1) {
    ctx.strokeStyle = snakeColorSecondary;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = S * 0.65;
    ctx.shadowColor = snakeColor;
    ctx.shadowBlur = 6;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(positions[0].x * S + S/2, positions[0].y * S + S/2);
    for (let i = 1; i < positions.length; i++) {
      ctx.lineTo(positions[i].x * S + S/2, positions[i].y * S + S/2);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Draw segments as circles
  positions.forEach((pos, i) => {
    const alpha = 1 - (i / positions.length) * 0.6;
    ctx.shadowColor = snakeColor;
    ctx.shadowBlur = i === 0 ? 14 : 3;
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

  // Particles
  snakeParticles = snakeParticles.filter(p => p.life > 0);
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
}

document.getElementById('snake-high').textContent = snakeHighScore;
snakeResizeCanvas();

// ===== MOBILE SNAKE =====
let MOB_SNAKE_COLS = 25;
let MOB_SNAKE_ROWS = 25;
let mobSnake = { body: [{x:12,y:12}], prevBody: [{x:12,y:12}], dir: {x:1,y:0}, nextDir: {x:1,y:0}, food: {x:18,y:12}, score: 0, running: false, over: false, interval: null, particles: [], cellSize: 14, lastTick: 0, animFrame: null, eatCount: 0, bonus: null, bonusTimer: null };

function initMobSnake() {
  const canvas = document.getElementById('mob-snake-canvas');
  if (!canvas) return;
  // Calculate cell size from screen width, then fill height with more rows
  const availW = window.innerWidth;
  const availH = window.innerHeight - 56 - 36 - 10;
  mobSnake.cellSize = Math.floor(availW / MOB_SNAKE_COLS);
  MOB_SNAKE_ROWS = Math.floor(availH / mobSnake.cellSize);
  const pxW = mobSnake.cellSize * MOB_SNAKE_COLS;
  const pxH = mobSnake.cellSize * MOB_SNAKE_ROWS;
  canvas.width = pxW;
  canvas.height = pxH;
  canvas.style.width = pxW + 'px';
  canvas.style.height = pxH + 'px';
  mobSnakeReset();

  // Tap direction: tap relative to snake head
  canvas.ontouchstart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const tapX = (touch.clientX - rect.left) / rect.width * canvas.width;
    const tapY = (touch.clientY - rect.top) / rect.height * canvas.height;
    const head = mobSnake.body[0];
    const C = mobSnake.cellSize;
    const hx = head.x * C + C/2;
    const hy = head.y * C + C/2;
    const dx = tapX - hx;
    const dy = tapY - hy;
    if (Math.abs(dx) > Math.abs(dy)) mobSnakeDir(dx > 0 ? 1 : -1, 0);
    else mobSnakeDir(0, dy > 0 ? 1 : -1);
  };
  document.getElementById('mob-snake-high').textContent = snakeHighScore;
}

function mobSnakeDir(dx, dy) {
  if (mobSnake.over) { mobSnakeReset(); return; }
  if (!mobSnake.running) mobSnakeStart();
  if (mobSnake.dir.x === -dx && mobSnake.dir.y === -dy) return;
  mobSnake.nextDir = {x:dx, y:dy};
}

function mobSnakeStart() {
  mobSnake.running = true;
  mobSnake.prevBody = JSON.parse(JSON.stringify(mobSnake.body));
  mobSnake.lastTick = performance.now();
  document.getElementById('mob-snake-overlay').style.display = 'none';
  mobSnakeSchedule();
  mobSnakeRenderLoop();
}

function mobSnakeRenderLoop() {
  if (!mobSnake.running || mobSnake.over) return;
  const t = Math.min((performance.now() - mobSnake.lastTick) / snakeGetSpeed(), 1);
  const ease = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2;
  mobSnakeDraw(ease);
  mobSnake.animFrame = requestAnimationFrame(mobSnakeRenderLoop);
}

function mobSnakeSchedule() {
  clearTimeout(mobSnake.interval);
  const speedup = Math.floor(mobSnake.score / 3) * 8;
  const speed = Math.max(55, snakeBaseSpeed - speedup);
  mobSnake.interval = setTimeout(() => { mobSnakeTick(); if (mobSnake.running) mobSnakeSchedule(); }, speed);
}

function mobSnakeReset() {
  clearTimeout(mobSnake.interval);
  cancelAnimationFrame(mobSnake.animFrame);
  mobSnake.body = [{x:12,y:12}]; mobSnake.prevBody = [{x:12,y:12}]; mobSnake.dir = {x:1,y:0}; mobSnake.nextDir = {x:1,y:0};
  mobSnake.score = 0; mobSnake.over = false; mobSnake.running = false; mobSnake.particles = []; mobSnake.eatCount = 0; mobSnake.bonus = null; clearTimeout(mobSnake.bonusTimer); snakeColor = '#39d353'; snakeColorSecondary = '#26a641';
  mobSnake.food = {x: Math.floor(Math.random()*MOB_SNAKE_COLS), y: Math.floor(Math.random()*MOB_SNAKE_ROWS)};
  document.getElementById('mob-snake-score').textContent = '0';
  document.getElementById('mob-snake-speed').textContent = 'Speed: 1x';
  const ov = document.getElementById('mob-snake-overlay');
  if (ov) { ov.style.display = 'block'; ov.innerHTML = '<div style="font-size:22px;font-weight:700;color:#39d353;text-shadow:0 0 20px rgba(57,211,83,0.5);">SNAKE NEON</div><div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:6px;">Swipe or tap arrows to play</div>'; }
  mobSnakeDraw();
}

function mobSnakeTick() {
  const S = mobSnake;
  S.prevBody = JSON.parse(JSON.stringify(S.body));
  S.dir = S.nextDir;
  S.lastTick = performance.now();
  const head = { x: S.body[0].x + S.dir.x, y: S.body[0].y + S.dir.y };
  if (head.x < 0 || head.x >= MOB_SNAKE_COLS || head.y < 0 || head.y >= MOB_SNAKE_ROWS || S.body.some(s => s.x === head.x && s.y === head.y)) {
    clearTimeout(S.interval); cancelAnimationFrame(S.animFrame); S.over = true; S.running = false;
    if (S.score > snakeHighScore) { snakeHighScore = S.score; localStorage.setItem('snakeHigh', snakeHighScore); document.getElementById('mob-snake-high').textContent = snakeHighScore; document.getElementById('snake-high').textContent = snakeHighScore; }
    localStorage.setItem('snakeLastScore', S.score);
    closeMobileSection('snake');
    mobSnakeReset();
    showNotif('Done playing? Now back to work 😂', 'Snake Neon');
    setTimeout(() => expandMobileSection('experience'), 300);
    return;
  }
  S.body.unshift(head);
  let mobAte = false;

  // Check bonus
  if (S.bonus && head.x === S.bonus.x && head.y === S.bonus.y) {
    S.score += 5; clearTimeout(S.bonusTimer);
    const mbc = bonusColors[S.bonus.colorIdx || 0];
    snakeColor = mbc.main; snakeColorSecondary = mbc.secondary;
    for(let i=0;i<16;i++) S.particles.push({x:S.bonus.x*S.cellSize+S.cellSize/2,y:S.bonus.y*S.cellSize+S.cellSize/2,vx:(Math.random()-0.5)*8,vy:(Math.random()-0.5)*8,life:20,color:mbc.main});
    S.bonus = null; mobAte = true; playSfx(sfxClick);
  }

  // Check regular food
  if (head.x === S.food.x && head.y === S.food.y) {
    S.score++; S.eatCount++;
    for(let i=0;i<6;i++) S.particles.push({x:S.food.x*S.cellSize+S.cellSize/2,y:S.food.y*S.cellSize+S.cellSize/2,vx:(Math.random()-0.5)*5,vy:(Math.random()-0.5)*5,life:12});
    let np; do{np={x:Math.floor(Math.random()*MOB_SNAKE_COLS),y:Math.floor(Math.random()*MOB_SNAKE_ROWS)};}while(S.body.some(s=>s.x===np.x&&s.y===np.y)); S.food=np;
    playSfx(sfxClick); mobAte = true;
    if(S.eatCount%3===0&&!S.bonus){let bp;do{bp={x:Math.floor(Math.random()*MOB_SNAKE_COLS),y:Math.floor(Math.random()*MOB_SNAKE_ROWS)};}while(S.body.some(s=>s.x===bp.x&&s.y===bp.y)||(bp.x===S.food.x&&bp.y===S.food.y));bp.colorIdx=Math.floor(Math.random()*bonusColors.length);S.bonus=bp;S.bonusTimer=setTimeout(()=>{S.bonus=null;},5000);}
  }

  if (mobAte) {
    localStorage.setItem('snakeLastScore', S.score);
    const mScEl = document.getElementById('mob-snake-score');
    mScEl.textContent = S.score; mScEl.style.transform='scale(1.3)'; setTimeout(()=>mScEl.style.transform='',150);
    const lvl=Math.min(Math.round(Math.floor(S.score/3)*8/((snakeBaseSpeed-55)/10))+1,10);
    document.getElementById('mob-snake-speed').textContent='Speed: '+lvl+'x';
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
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Dotted grid
  ctx.fillStyle='rgba(255,255,255,0.12)';
  for(let gx=0;gx<MOB_SNAKE_COLS;gx++)for(let gy=0;gy<MOB_SNAKE_ROWS;gy++){ctx.beginPath();ctx.arc(gx*C+C/2,gy*C+C/2,1.5,0,Math.PI*2);ctx.fill();}

  const pulse = 0.85+Math.sin(Date.now()/200)*0.15;
  ctx.shadowColor='#FF5F57';ctx.shadowBlur=14*pulse;ctx.fillStyle='#FF5F57';
  ctx.beginPath();ctx.arc(MS.food.x*C+C/2,MS.food.y*C+C/2,C*0.3*pulse,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;ctx.fillStyle='rgba(255,255,255,0.5)';ctx.beginPath();ctx.arc(MS.food.x*C+C/2,MS.food.y*C+C/2,C*0.08,0,Math.PI*2);ctx.fill();

  // Bonus food (colored ball with breathing)
  if(MS.bonus){const bCol=bonusColors[MS.bonus.colorIdx||0];const bp=0.92+Math.sin(Date.now()/300)*0.08;const bx=MS.bonus.x*C+C/2,by=MS.bonus.y*C+C/2,bR=C*0.75*bp;ctx.shadowColor=bCol.glow;ctx.shadowBlur=24*bp;ctx.fillStyle=bCol.main+'26';ctx.beginPath();ctx.arc(bx,by,C*0.95*bp,0,Math.PI*2);ctx.fill();ctx.shadowBlur=18;ctx.fillStyle=bCol.main;ctx.beginPath();ctx.arc(bx,by,bR,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='rgba(255,255,255,0.3)';ctx.beginPath();ctx.arc(bx-bR*0.2,by-bR*0.2,bR*0.3,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(0,0,0,0.7)';ctx.font='bold '+Math.floor(C*0.55)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('+5',bx,by+1);}

  const positions=MS.body.map((seg,i)=>{const prev=MS.prevBody[i]||seg;return{x:snakeLerp(prev.x,seg.x,t),y:snakeLerp(prev.y,seg.y,t)};});

  if(positions.length>1){ctx.strokeStyle=snakeColorSecondary;ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=C*0.6;ctx.shadowColor=snakeColor;ctx.shadowBlur=5;ctx.globalAlpha=0.8;ctx.beginPath();ctx.moveTo(positions[0].x*C+C/2,positions[0].y*C+C/2);for(let i=1;i<positions.length;i++)ctx.lineTo(positions[i].x*C+C/2,positions[i].y*C+C/2);ctx.stroke();ctx.shadowBlur=0;}

  positions.forEach((pos,i)=>{const alpha=1-(i/positions.length)*0.6;ctx.shadowColor=snakeColor;ctx.shadowBlur=i===0?12:3;ctx.fillStyle=i===0?snakeColor:snakeColorSecondary;ctx.globalAlpha=alpha;const radius=i===0?C*0.45:C*0.3*(1-i/positions.length*0.3);ctx.beginPath();ctx.arc(pos.x*C+C/2,pos.y*C+C/2,radius,0,Math.PI*2);ctx.fill();
  if(i===0){ctx.shadowBlur=0;ctx.globalAlpha=1;const r=C*0.1,pr=C*0.05;const px=pos.x*C,py=pos.y*C;let e1x,e1y,e2x,e2y;if(MS.dir.x===1){e1x=C*0.62;e1y=C*0.28;e2x=C*0.62;e2y=C*0.72;}else if(MS.dir.x===-1){e1x=C*0.38;e1y=C*0.28;e2x=C*0.38;e2y=C*0.72;}else if(MS.dir.y===1){e1x=C*0.28;e1y=C*0.62;e2x=C*0.72;e2y=C*0.62;}else{e1x=C*0.28;e1y=C*0.38;e2x=C*0.72;e2y=C*0.38;}ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(px+e1x,py+e1y,r,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(px+e2x,py+e2y,r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#111';ctx.beginPath();ctx.arc(px+e1x,py+e1y,pr,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(px+e2x,py+e2y,pr,0,Math.PI*2);ctx.fill();}});
  ctx.globalAlpha=1;ctx.shadowBlur=0;

  MS.particles=MS.particles.filter(p=>p.life>0);MS.particles.forEach(p=>{ctx.fillStyle=p.color||snakeColor;ctx.globalAlpha=p.life/12;ctx.beginPath();ctx.arc(p.x,p.y,2.5,0,Math.PI*2);ctx.fill();p.x+=p.vx*0.93;p.y+=p.vy*0.93;p.life--;});ctx.globalAlpha=1;
}
