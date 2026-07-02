const { ipcRenderer } = require('electron');

document.getElementById('close-btn').addEventListener('click', () => {
  ipcRenderer.send('close-widget', 'stopwatch');
});

let startTime;
let updatedTime;
let difference;
let tInterval;
let running = false;

const display = document.getElementById('display');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const resetBtn = document.getElementById('reset-btn');

function getShowTime() {
  updatedTime = new Date().getTime();
  difference = updatedTime - startTime;
  
  let hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  let minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  let seconds = Math.floor((difference % (1000 * 60)) / 1000);
  let milliseconds = Math.floor((difference % 1000) / 10);
  
  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;
  milliseconds = (milliseconds < 10) ? "0" + milliseconds : milliseconds;
  
  display.innerHTML = hours + ':' + minutes + ':' + seconds + '.' + milliseconds;
}

startBtn.addEventListener('click', () => {
  if (!running) {
    startTime = new Date().getTime() - (difference || 0);
    tInterval = setInterval(getShowTime, 10);
    running = true;
    startBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
  }
});

stopBtn.addEventListener('click', () => {
  if (running) {
    clearInterval(tInterval);
    running = false;
    stopBtn.classList.add('hidden');
    startBtn.classList.remove('hidden');
  }
});

resetBtn.addEventListener('click', () => {
  clearInterval(tInterval);
  running = false;
  difference = 0;
  display.innerHTML = "00:00:00.00";
  stopBtn.classList.add('hidden');
  startBtn.classList.remove('hidden');
});
