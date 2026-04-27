// ===== MUSIC PLAYER =====
const musicTracks = [
  { file: '/assets/music/chill1.mp3', name: 'Hanging Lanterns', artist: 'Kalaido', art: 'linear-gradient(135deg, #f97316 0%, #fbbf24 50%, #ec4899 100%)' },
  { file: '/assets/music/chill2.mp3', name: 'Waves', artist: 'Matt Quentin', art: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #2dd4bf 100%)' }
];
let musicIndex = 0;
let musicAudio = null;
let musicPlaying = false;

function initMusicPlayer() {
  // Bail if neither old widget nor new popover present
  if (!document.getElementById('music-pop-play') && !document.getElementById('music-play')) return;
  if (musicAudio) return;
  musicAudio = new Audio();
  musicAudio.preload = 'none';
  musicAudio.volume = 0.1;
  musicAudio.addEventListener('ended', () => nextTrack());
  var lastMusicUpdate = 0;
  musicAudio.addEventListener('timeupdate', function() {
    var now = Date.now();
    if (now - lastMusicUpdate < 250) return;
    lastMusicUpdate = now;
    updateMusicProgress();
  });

  musicAudio.addEventListener('play', () => {
    musicPlaying = true;
    syncPlayButtons('⏸');
    updateMediaSession();
  });
  musicAudio.addEventListener('pause', () => {
    musicPlaying = false;
    syncPlayButtons('▶');
  });

  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => toggleMusic());
    navigator.mediaSession.setActionHandler('pause', () => toggleMusic());
    navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
    navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
  }

  bindMusicControls();
}

function syncPlayButtons(state) {
  var oldBtn = document.getElementById('music-play');
  if (oldBtn) oldBtn.textContent = state;
  var mobBtn = document.getElementById('mob-music-play');
  if (mobBtn) mobBtn.textContent = state;
  var popBtn = document.getElementById('music-pop-play');
  if (popBtn) {
    popBtn.innerHTML = state === '⏸'
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>'
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>';
  }
}

function bindMusicControls() {
  // Old desktop widget (only if present)
  var oldPlay = document.getElementById('music-play');
  if (oldPlay) {
    oldPlay.addEventListener('click', (e) => { e.stopPropagation(); toggleMusic(); });
    document.getElementById('music-next').addEventListener('click', (e) => { e.stopPropagation(); nextTrack(); });
    document.getElementById('music-prev').addEventListener('click', (e) => { e.stopPropagation(); prevTrack(); });
    var progressBar = document.getElementById('music-progress');
    if (progressBar) progressBar.addEventListener('click', (e) => {
      e.stopPropagation();
      var rect = progressBar.getBoundingClientRect();
      var pct = (e.clientX - rect.left) / rect.width;
      if (musicAudio.duration) musicAudio.currentTime = pct * musicAudio.duration;
    });
    var volBar = document.getElementById('music-vol');
    if (volBar) volBar.addEventListener('click', (e) => {
      e.stopPropagation();
      var rect = volBar.getBoundingClientRect();
      var pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      musicAudio.volume = pct;
      document.getElementById('music-vol-fill').style.width = (pct * 100) + '%';
    });
  }

  // New menu bar popover
  var popPlay = document.getElementById('music-pop-play');
  if (popPlay) {
    popPlay.addEventListener('click', (e) => { e.stopPropagation(); toggleMusic(); });
    document.getElementById('music-pop-prev').addEventListener('click', (e) => { e.stopPropagation(); prevTrack(); });
    document.getElementById('music-pop-next').addEventListener('click', (e) => { e.stopPropagation(); nextTrack(); });
    var popProg = document.getElementById('music-pop-progress');
    if (popProg) popProg.addEventListener('click', (e) => {
      e.stopPropagation();
      var rect = popProg.getBoundingClientRect();
      var pct = (e.clientX - rect.left) / rect.width;
      if (musicAudio.duration) musicAudio.currentTime = pct * musicAudio.duration;
    });
  }
}

function toggleMusicPopover(e) {
  if (e) e.stopPropagation();
  if (!musicAudio) initMusicPlayer();
  var pop = document.getElementById('music-popover');
  var trigger = document.getElementById('menubar-music');
  if (!pop || !trigger) return;
  var open = pop.classList.toggle('is-open');
  if (trigger) trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) {
    setMusicMeta();
    if (!document.__musicPopHandler) {
      document.__musicPopHandler = function (ev) {
        if (!ev.target.closest('#music-popover') && !ev.target.closest('#menubar-music')) {
          pop.classList.remove('is-open');
          trigger.setAttribute('aria-expanded', 'false');
          document.removeEventListener('mousedown', document.__musicPopHandler);
          document.__musicPopHandler = null;
        }
      };
      setTimeout(() => document.addEventListener('mousedown', document.__musicPopHandler), 0);
    }
  }
}
window.toggleMusicPopover = toggleMusicPopover;

function setMusicMeta() {
  var t = musicTracks[musicIndex];
  if (!t) return;
  var trk = document.getElementById('music-pop-track');
  var art = document.getElementById('music-pop-artist');
  var artBox = document.getElementById('music-pop-art');
  if (trk) trk.textContent = t.name;
  if (art) art.textContent = t.artist;
  if (artBox && t.art) {
    artBox.style.background = t.art;
    artBox.innerHTML = '';
  }
}

function toggleMusic() {
  if (!musicAudio) initMusicPlayer();
  if (!musicAudio) return;
  if (musicPlaying) {
    musicAudio.pause();
  } else {
    if (!musicAudio.src || musicAudio.src === location.href) {
      musicAudio.src = musicTracks[musicIndex].file;
      var t = document.getElementById('music-track');
      var a = document.getElementById('music-artist');
      if (t) t.textContent = musicTracks[musicIndex].name;
      if (a) a.textContent = musicTracks[musicIndex].artist;
      setMusicMeta();
    }
    musicAudio.play().catch(() => {});
  }
}

function updateMediaSession() {
  if (!('mediaSession' in navigator)) return;
  const track = musicTracks[musicIndex];
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.name,
    artist: track.artist,
    album: 'ishaqhassan.dev'
  });
}

function loadTrack(index) {
  if (!musicAudio) initMusicPlayer();
  if (!musicAudio) return;
  const wasPlaying = musicPlaying;
  musicAudio.pause();
  musicIndex = index;
  const track = musicTracks[musicIndex];
  musicAudio.src = track.file;
  var t = document.getElementById('music-track');
  var a = document.getElementById('music-artist');
  if (t) t.textContent = track.name;
  if (a) a.textContent = track.artist;
  var fill = document.getElementById('music-progress-fill');
  if (fill) fill.style.width = '0%';
  var time = document.getElementById('music-time');
  if (time) time.textContent = '0:00';
  var popFill = document.getElementById('music-pop-progress-fill');
  if (popFill) popFill.style.width = '0%';
  setMusicMeta();
  updateMediaSession();
  if (wasPlaying) {
    musicAudio.play().catch(() => {});
  }
}

function nextTrack() { loadTrack((musicIndex + 1) % musicTracks.length); }
function prevTrack() { loadTrack((musicIndex - 1 + musicTracks.length) % musicTracks.length); }

function updateMusicProgress() {
  if (!musicAudio || !musicAudio.duration) return;
  const pct = (musicAudio.currentTime / musicAudio.duration) * 100;
  var fill = document.getElementById('music-progress-fill');
  if (fill) fill.style.width = pct + '%';
  var popFill = document.getElementById('music-pop-progress-fill');
  if (popFill) popFill.style.width = pct + '%';
  var time = document.getElementById('music-time');
  if (time) {
    const m = Math.floor(musicAudio.currentTime / 60);
    const s = Math.floor(musicAudio.currentTime % 60).toString().padStart(2, '0');
    time.textContent = m + ':' + s;
  }
}

// ===== WEATHER WIDGET =====
// Fast geolocation options: network-based first (quick), 5s timeout, 10min cache OK
const GEO_OPTS = { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 };
const LOC_CACHE_KEY = 'weather_loc_cache';
const LOC_CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

function getCachedLoc() {
  try {
    const raw = localStorage.getItem(LOC_CACHE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (Date.now() - obj.t > LOC_CACHE_TTL) return null;
    return { lat: obj.lat, lon: obj.lon };
  } catch(e) { return null; }
}
function saveCachedLoc(lat, lon) {
  try { localStorage.setItem(LOC_CACHE_KEY, JSON.stringify({ lat, lon, t: Date.now() })); } catch(e) {}
}

function requestWeatherLocation() {
  // Instant loading state so user sees feedback on tap
  const wp = document.getElementById('weather-permit');
  const wd = document.getElementById('weather-data');
  if (wp) wp.style.display = 'none';
  if (wd) wd.classList.add('show');
  const tempEl = document.getElementById('weather-temp');
  const cityEl = document.getElementById('weather-city');
  if (tempEl && !tempEl.textContent.match(/\d/)) tempEl.textContent = '…';
  if (cityEl && !cityEl.textContent) cityEl.textContent = 'Locating…';

  // Try cached location first (instant render)
  const cached = getCachedLoc();
  if (cached) fetchWeather(cached.lat, cached.lon);

  if (!navigator.geolocation) { fetchWeatherFallback(); return; }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      saveCachedLoc(pos.coords.latitude, pos.coords.longitude);
      fetchWeather(pos.coords.latitude, pos.coords.longitude);
    },
    () => { if (!cached) fetchWeatherFallback(); },
    GEO_OPTS
  );
}

function renderWeatherData(data, fallbackCity, lat, lon) {
  const cw = data.current_weather;
  document.getElementById('weather-temp').textContent = Math.round(cw.temperature);
  document.getElementById('weather-wind').textContent = '💨 ' + Math.round(cw.windspeed) + ' km/h';
  document.getElementById('weather-icon').textContent = getWeatherIcon(cw.weathercode);
  const hIdx = data.hourly.time.findIndex(t => t >= cw.time.substring(0, 13));
  if (hIdx >= 0) document.getElementById('weather-humidity').textContent = '💧 ' + data.hourly.relative_humidity_2m[hIdx] + '%';
  if (fallbackCity) {
    document.getElementById('weather-city').textContent = fallbackCity;
  } else {
    fetch('https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lon + '&format=json')
      .then(r => r.json())
      .then(geo => {
        const city = geo.address.city || geo.address.town || geo.address.state || 'Unknown';
        const country = geo.address.country_code ? geo.address.country_code.toUpperCase() : '';
        document.getElementById('weather-city').textContent = city + (country ? ', ' + country : '');
      })
      .catch(() => document.getElementById('weather-city').textContent = 'Your Location');
  }
}

function fetchWeatherFallback() {
  fetchWeather(24.86, 67.01, 'Karachi, PK');
}

function fetchWeather(lat, lon, fallbackCity) {
  const wp = document.getElementById('weather-permit');
  if (wp) wp.style.display = 'none';
  const wd = document.getElementById('weather-data');
  if (wd) wd.classList.add('show');

  var cacheKey = 'weather_cache', cacheTimeKey = 'weather_time';
  try {
    var cached = localStorage.getItem(cacheKey);
    var cacheTime = localStorage.getItem(cacheTimeKey);
    if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < 30 * 60 * 1000) {
      renderWeatherData(JSON.parse(cached), fallbackCity, lat, lon);
      return;
    }
  } catch(e) {}

  fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current_weather=true&hourly=relative_humidity_2m')
    .then(r => r.json())
    .then(data => {
      try { localStorage.setItem(cacheKey, JSON.stringify(data)); localStorage.setItem(cacheTimeKey, Date.now().toString()); } catch(e) {}
      renderWeatherData(data, fallbackCity, lat, lon);
    })
    .catch(() => {
      document.getElementById('weather-temp').textContent = '--';
      document.getElementById('weather-city').textContent = 'Failed to load';
    });
}

function getWeatherIcon(code) {
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫️';
  if (code <= 57) return '🌧️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌧️';
  if (code <= 86) return '🌨️';
  if (code >= 95) return '⛈️';
  return '🌤️';
}

// Mobile music controls
function mobMusicCtrl(action) {
  if (!musicAudio) initMusicPlayer();
  if (action === 'toggle') toggleMusic();
  else if (action === 'next') nextTrack();
  else if (action === 'prev') prevTrack();
  // Sync mobile UI
  setTimeout(() => {
    const btn = document.getElementById('mob-music-play');
    if (btn) btn.textContent = musicPlaying ? '⏸' : '▶';
    const t = document.getElementById('mob-music-track');
    const a = document.getElementById('mob-music-artist');
    if (t && musicTracks[musicIndex]) t.textContent = musicTracks[musicIndex].name;
    if (a && musicTracks[musicIndex]) a.textContent = musicTracks[musicIndex].artist;
  }, 100);
}

// Mobile + desktop weather auto-load
// 1. If cached location exists, render immediately (no API wait) - fires during splash screen
// 2. If geolocation permission already granted, silently refresh in background
// 3. On permission change (grant), auto-load without user re-tap
(function autoWeather() {
  const cached = getCachedLoc();
  if (cached) {
    // Instant render with cached coords - runs even before permission UI is touched
    if (document.getElementById('mob-weather-permit')) {
      const permit = document.getElementById('mob-weather-permit');
      const dataEl = document.getElementById('mob-weather-data');
      if (permit) permit.style.display = 'none';
      if (dataEl) dataEl.style.display = 'block';
      fetchMobWeather(cached.lat, cached.lon);
    }
    if (document.getElementById('weather-city')) {
      const wp = document.getElementById('weather-permit');
      const wd = document.getElementById('weather-data');
      if (wp) wp.style.display = 'none';
      if (wd) wd.classList.add('show');
      fetchWeather(cached.lat, cached.lon);
    }
  }

  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({name:'geolocation'}).then(p => {
      if (p.state === 'granted') {
        if (document.getElementById('mob-weather-permit')) requestMobWeather();
        if (document.getElementById('weather-city')) requestWeatherLocation();
      }
      p.onchange = () => {
        if (p.state === 'granted') {
          if (document.getElementById('mob-weather-permit')) requestMobWeather();
          if (document.getElementById('weather-city')) requestWeatherLocation();
        }
      };
    }).catch(() => {});
  }
})();

function requestMobWeather() {
  // Instant UX: hide permit prompt, show loading state before geolocation call
  const permit = document.getElementById('mob-weather-permit');
  const dataEl = document.getElementById('mob-weather-data');
  if (permit) permit.style.display = 'none';
  if (dataEl) dataEl.style.display = 'block';
  const tempEl = document.getElementById('mob-weather-temp');
  const cityEl = document.getElementById('mob-weather-city');
  if (tempEl && !tempEl.textContent.match(/\d/)) tempEl.textContent = '…';
  if (cityEl && !cityEl.textContent) cityEl.textContent = 'Locating…';

  // Render cached location instantly while fresh lookup happens
  const cached = getCachedLoc();
  if (cached) fetchMobWeather(cached.lat, cached.lon);

  if (!navigator.geolocation) { fetchMobWeather(24.86, 67.01, 'Karachi, PK'); return; }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      saveCachedLoc(pos.coords.latitude, pos.coords.longitude);
      fetchMobWeather(pos.coords.latitude, pos.coords.longitude);
    },
    () => { if (!cached) fetchMobWeather(24.86, 67.01, 'Karachi, PK'); },
    GEO_OPTS
  );
}
function fetchMobWeather(lat, lon, fallbackCity) {
  const permit = document.getElementById('mob-weather-permit');
  const dataEl = document.getElementById('mob-weather-data');
  if (permit) permit.style.display = 'none';
  if (dataEl) dataEl.style.display = 'block';
  const mobWD = document.getElementById('mob-weather-details');
  if (mobWD) mobWD.style.display = 'block';
  fetch('https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon+'&current_weather=true&hourly=relative_humidity_2m')
    .then(r => r.json())
    .then(data => {
      const cw = data.current_weather;
      document.getElementById('mob-weather-temp').textContent = Math.round(cw.temperature);
      document.getElementById('mob-weather-wind').textContent = '💨 '+Math.round(cw.windspeed)+' km/h';
      document.getElementById('mob-weather-icon').textContent = getWeatherIcon(cw.weathercode);
      const hIdx = data.hourly.time.findIndex(t => t >= cw.time.substring(0,13));
      if (hIdx >= 0) document.getElementById('mob-weather-humidity').textContent = '💧 '+data.hourly.relative_humidity_2m[hIdx]+'%';
      if (fallbackCity) { document.getElementById('mob-weather-city').textContent = fallbackCity; }
      else { fetch('https://nominatim.openstreetmap.org/reverse?lat='+lat+'&lon='+lon+'&format=json').then(r=>r.json()).then(geo=>{const city=geo.address.city||geo.address.town||geo.address.state||'Unknown';document.getElementById('mob-weather-city').textContent=city+', '+(geo.address.country_code||'').toUpperCase();}).catch(()=>document.getElementById('mob-weather-city').textContent='Your Location'); }
    }).catch(() => { document.getElementById('mob-weather-temp').textContent = '--'; });
}

// ===== WALLPAPER WIDGET =====
const WALLPAPERS = [
  { id: 'default',  name: 'Dark Matter',   value: '/assets/wallpaper.webp',   preview: '/assets/wallpaper.webp' },
  { id: 'space',    name: 'Deep Space',    value: '/assets/wp-space.webp',    preview: '/assets/wp-space.webp' },
  { id: 'aurora',   name: 'Aurora',        value: '/assets/wp-aurora.webp',   preview: '/assets/wp-aurora.webp' },
  { id: 'mountain', name: 'Mountain',      value: '/assets/wp-mountain.webp', preview: '/assets/wp-mountain.webp' },
  { id: 'nebula',   name: 'Nebula',        value: '/assets/wp-nebula.webp',   preview: '/assets/wp-nebula.webp' },
  { id: 'night',    name: 'Night Sky',     value: '/assets/wp-night.webp',    preview: '/assets/wp-night.webp' }
];

let wpIndex = 0;

function setWallpaper(idx, save) {
  if (save === undefined) save = true;
  wpIndex = idx;
  var wp = WALLPAPERS[idx];
  var el = document.getElementById('wallpaper');
  el.style.opacity = '0.6';
  setTimeout(function() {
    el.style.backgroundImage = 'url(' + wp.value + ')';
    el.style.opacity = '1';
  }, 180);
  document.querySelectorAll('.wp-swatch').forEach(function(s, i) {
    s.classList.toggle('active', i === idx);
  });
  var nameEl = document.getElementById('wp-name');
  if (nameEl) nameEl.textContent = wp.name;
  if (save) {
    try { localStorage.setItem('ishaq_wallpaper', wp.id); } catch(e) {}
  }
}

function initWallpaperWidget() {
  var container = document.getElementById('wp-swatches');
  if (!container) return;
  WALLPAPERS.forEach(function(wp, i) {
    var swatch = document.createElement('div');
    swatch.className = 'wp-swatch' + (i === 0 ? ' active' : '');
    swatch.style.backgroundImage = 'url(' + wp.preview + ')';
    swatch.style.backgroundSize = 'cover';
    swatch.style.backgroundPosition = 'center';
    swatch.title = wp.name;
    swatch.addEventListener('click', function(e) {
      e.stopPropagation();
      setWallpaper(i);
    });
    container.appendChild(swatch);
  });
  try {
    var saved = localStorage.getItem('ishaq_wallpaper');
    if (saved) {
      var idx = WALLPAPERS.findIndex(function(w) { return w.id === saved; });
      if (idx !== -1) setWallpaper(idx, false);
    }
  } catch(e) {}
}
