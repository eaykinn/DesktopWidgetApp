const { ipcRenderer } = require('electron');

document.getElementById('close-btn').addEventListener('click', () => {
  ipcRenderer.send('close-widget', 'media');
});

const titleEl = document.getElementById('title');
const artistEl = document.getElementById('artist');
const thumbEl = document.getElementById('thumbnail-container');
const defaultIcon = document.getElementById('default-icon');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');
const progressBar = document.getElementById('progress-bar');
const progressThumb = document.getElementById('progress-thumb');
const progressContainer = document.getElementById('progress-container');
const progressBgWrapper = document.getElementById('progress-bg-wrapper');

const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnPlayPause = document.getElementById('btn-playpause');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');

btnPrev.addEventListener('click', () => ipcRenderer.send('media-control', 'prev'));
btnNext.addEventListener('click', () => ipcRenderer.send('media-control', 'next'));
btnPlayPause.addEventListener('click', () => ipcRenderer.send('media-control', 'playpause'));

progressContainer.addEventListener('click', (e) => {
  if (!currentSession || !currentSession.timeline || !currentSession.timeline.durationMs) return;
  const rect = progressBgWrapper.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  let percent = clickX / rect.width;
  if (percent < 0) percent = 0;
  if (percent > 1) percent = 1;
  const targetMs = Math.floor(percent * currentSession.timeline.durationMs);
  
  // Optimistically update UI
  localPositionMs = targetMs;
  lastUpdateTimestamp = Date.now();
  updateProgress();
  
  // Instruct main process to seek
  ipcRenderer.send('media-control', 'seek', { positionMs: targetMs });
});

let currentSession = null;
let playbackTimer = null;
let localPositionMs = 0;
let lastUpdateTimestamp = 0;

function formatTime(ms) {
  if (!ms || isNaN(ms)) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s < 10 ? '0' + s : s}`;
}

function updateProgress() {
  if (!currentSession || !currentSession.timeline || currentSession.playbackStatus !== 'playing') {
    return;
  }
  
  const now = Date.now();
  const elapsed = now - lastUpdateTimestamp;
  localPositionMs += elapsed;
  lastUpdateTimestamp = now;
  
  const durationMs = currentSession.timeline.durationMs || 1;
  if (localPositionMs > durationMs) localPositionMs = durationMs;
  
  const percent = (localPositionMs / durationMs) * 100;
  progressBar.style.width = `${percent}%`;
  progressThumb.style.left = `${percent}%`;
  currentTimeEl.textContent = formatTime(localPositionMs);
}

ipcRenderer.on('media-update', (event, { action, session }) => {
  currentSession = session;
  
  if (session) {
    titleEl.textContent = session.title || 'Unknown Title';
    artistEl.textContent = session.artist || 'Unknown Artist';
    
    if (session.thumbnail) {
      thumbEl.style.backgroundImage = `url('${session.thumbnail}')`;
      defaultIcon.classList.add('hidden');
    } else {
      thumbEl.style.backgroundImage = 'none';
      defaultIcon.classList.remove('hidden');
    }
    
    // Handle timeline
    if (session.timeline) {
      localPositionMs = session.timeline.positionMs || 0;
      lastUpdateTimestamp = Date.now();
      totalTimeEl.textContent = formatTime(session.timeline.durationMs);
      currentTimeEl.textContent = formatTime(localPositionMs);
      
      const durationMs = session.timeline.durationMs || 1;
      const percent = (localPositionMs / durationMs) * 100;
      progressBar.style.width = `${percent}%`;
      progressThumb.style.left = `${percent}%`;
    } else {
      totalTimeEl.textContent = "0:00";
      currentTimeEl.textContent = "0:00";
      progressBar.style.width = "0%";
      progressThumb.style.left = "0%";
    }
    
    // Interpolate progress locally
    if (session.playbackStatus === 'playing') {
      iconPlay.classList.add('hidden');
      iconPause.classList.remove('hidden');
      if (!playbackTimer) playbackTimer = setInterval(updateProgress, 1000);
      lastUpdateTimestamp = Date.now();
    } else {
      iconPause.classList.add('hidden');
      iconPlay.classList.remove('hidden');
      if (playbackTimer) {
        clearInterval(playbackTimer);
        playbackTimer = null;
      }
    }
  } else {
    titleEl.textContent = 'No Media';
    artistEl.textContent = 'Waiting for playback...';
    
    thumbEl.style.backgroundImage = 'none';
    defaultIcon.classList.remove('hidden');
    
    currentTimeEl.textContent = '0:00';
    totalTimeEl.textContent = '0:00';
    progressBar.style.width = '0%';
    progressThumb.style.left = '0%';
    iconPause.classList.add('hidden');
    iconPlay.classList.remove('hidden');
    if (playbackTimer) {
      clearInterval(playbackTimer);
      playbackTimer = null;
    }
  }
});

// Request initial state
ipcRenderer.send('get-media-state');
