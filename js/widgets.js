// ===== MUSIC PLAYER =====
const musicTracks = [
  { file: 'assets/music/chill1.mp3', name: 'Hanging Lanterns', artist: 'Kalaido' },
  { file: 'assets/music/chill2.mp3', name: 'Waves', artist: 'Matt Quentin' }
];
let musicIndex = 0;
let musicAudio = null;
let musicPlaying = false;

function initMusicPlayer() {
  musicAudio = new Audio(musicTracks[0].file);
  musicAudio.volume = 0.1;
  musicAudio.addEventListener('ended', () => nextTrack());
  musicAudio.addEventListener('timeupdate', updateMusicProgress);

  document.getElementById('music-play').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMusic();
  });
  document.getElementById('music-next').addEventListener('click', (e) => {
    e.stopPropagation();
    nextTrack();
  });
  document.getElementById('music-prev').addEventListener('click', (e) => {
    e.stopPropagation();
    prevTrack();
  });

  const progressBar = document.getElementById('music-progress');
  progressBar.addEventListener('click', (e) => {
    e.stopPropagation();
    const rect = progressBar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    if (musicAudio.duration) musicAudio.currentTime = pct * musicAudio.duration;
  });

  const volBar = document.getElementById('music-vol');
  volBar.addEventListener('click', (e) => {
    e.stopPropagation();
    const rect = volBar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    musicAudio.volume = pct;
    document.getElementById('music-vol-fill').style.width = (pct * 100) + '%';
  });

  // Try autoplay after user interaction (desktop only)
  if (window.innerWidth > 768) {
    document.addEventListener('click', function autoplayOnce() {
      if (!musicPlaying) {
        musicAudio.play().then(() => {
          musicPlaying = true;
          document.getElementById('music-play').textContent = '⏸';
        }).catch(() => {});
      }
      document.removeEventListener('click', autoplayOnce);
    }, { once: false });
  }
}

function toggleMusic() {
  if (musicPlaying) {
    musicAudio.pause();
    musicPlaying = false;
    document.getElementById('music-play').textContent = '▶';
  } else {
    musicAudio.play().then(() => {
      musicPlaying = true;
      document.getElementById('music-play').textContent = '⏸';
    }).catch(() => {});
  }
}

function loadTrack(index) {
  const wasPlaying = musicPlaying;
  if (musicAudio) musicAudio.pause();
  musicIndex = index;
  const track = musicTracks[musicIndex];
  musicAudio.src = track.file;
  document.getElementById('music-track').textContent = track.name;
  document.getElementById('music-artist').textContent = track.artist;
  document.getElementById('music-progress-fill').style.width = '0%';
  document.getElementById('music-time').textContent = '0:00';
  if (wasPlaying) {
    musicAudio.play().then(() => {
      musicPlaying = true;
      document.getElementById('music-play').textContent = '⏸';
    }).catch(() => {});
  }
}

function nextTrack() { loadTrack((musicIndex + 1) % musicTracks.length); }
function prevTrack() { loadTrack((musicIndex - 1 + musicTracks.length) % musicTracks.length); }

function updateMusicProgress() {
  if (!musicAudio.duration) return;
  const pct = (musicAudio.currentTime / musicAudio.duration) * 100;
  document.getElementById('music-progress-fill').style.width = pct + '%';
  const m = Math.floor(musicAudio.currentTime / 60);
  const s = Math.floor(musicAudio.currentTime % 60).toString().padStart(2, '0');
  document.getElementById('music-time').textContent = m + ':' + s;
}

// ===== WEATHER WIDGET =====
function requestWeatherLocation() {
  if (!navigator.geolocation) {
    fetchWeatherFallback();
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
    () => fetchWeatherFallback()
  );
}

function fetchWeatherFallback() {
  fetchWeather(24.86, 67.01, 'Karachi, PK');
}

function fetchWeather(lat, lon, fallbackCity) {
  document.getElementById('weather-permit').style.display = 'none';
  const wd = document.getElementById('weather-data');
  wd.classList.add('show');

  fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current_weather=true&hourly=relative_humidity_2m')
    .then(r => r.json())
    .then(data => {
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

// Mobile weather
// Auto-check if location already permitted
if (navigator.permissions) {
  navigator.permissions.query({name:'geolocation'}).then(p => {
    if (p.state === 'granted') { requestMobWeather(); requestWeatherLocation(); }
  });
}

function requestMobWeather() {
  if (!navigator.geolocation) { fetchMobWeather(24.86, 67.01, 'Karachi, PK'); return; }
  navigator.geolocation.getCurrentPosition(
    (pos) => fetchMobWeather(pos.coords.latitude, pos.coords.longitude),
    () => fetchMobWeather(24.86, 67.01, 'Karachi, PK')
  );
}
function fetchMobWeather(lat, lon, fallbackCity) {
  document.getElementById('mob-weather-permit').style.display = 'none';
  document.getElementById('mob-weather-data').style.display = 'block';
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
