const { ipcRenderer } = require('electron');

document.getElementById('close-btn').addEventListener('click', () => {
  ipcRenderer.send('close-widget', 'countdown');
});

let tInterval;
let remainingTime = 0;
let running = false;

const display = document.getElementById('display');
const setupPanel = document.getElementById('setup-panel');
const controlPanel = document.getElementById('control-panel');

const inputH = document.getElementById('input-h');
const inputM = document.getElementById('input-m');
const inputS = document.getElementById('input-s');

const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const resetBtn = document.getElementById('reset-btn');

function updateDisplay() {
  let hours = Math.floor(remainingTime / 3600);
  let minutes = Math.floor((remainingTime % 3600) / 60);
  let seconds = remainingTime % 60;

  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  display.innerHTML = hours + ':' + minutes + ':' + seconds;
}

function tick() {
  if (remainingTime > 0) {
    remainingTime--;
    updateDisplay();
  } else {
    clearInterval(tInterval);
    running = false;
    display.innerHTML = "00:00:00";
    stopBtn.innerHTML = "Done";
    new Notification('Widget App', { body: 'Countdown finished!' });
  }
}

startBtn.addEventListener('click', () => {
  const h = parseInt(inputH.value) || 0;
  const m = parseInt(inputM.value) || 0;
  const s = parseInt(inputS.value) || 0;
  
  remainingTime = (h * 3600) + (m * 60) + s;
  
  if (remainingTime > 0) {
    setupPanel.classList.add('hidden');
    controlPanel.classList.remove('hidden');
    stopBtn.innerHTML = "Pause";
    running = true;
    updateDisplay();
    tInterval = setInterval(tick, 1000);
  }
});

stopBtn.addEventListener('click', () => {
  if (remainingTime === 0) {
    resetBtn.click();
    return;
  }
  
  if (running) {
    clearInterval(tInterval);
    running = false;
    stopBtn.innerHTML = "Resume";
  } else {
    running = true;
    stopBtn.innerHTML = "Pause";
    tInterval = setInterval(tick, 1000);
  }
});

resetBtn.addEventListener('click', () => {
  clearInterval(tInterval);
  running = false;
  remainingTime = 0;
  display.innerHTML = "00:00:00";
  controlPanel.classList.add('hidden');
  setupPanel.classList.remove('hidden');
});
