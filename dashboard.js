const { ipcRenderer } = require('electron');

let activeWidgets = {};

function toggleWidget(name, width, height) {
  if (activeWidgets[name]) {
    ipcRenderer.send('close-widget', name);
    activeWidgets[name] = false;
  } else {
    ipcRenderer.send('open-widget', { name, width, height });
    activeWidgets[name] = true;
  }
}
