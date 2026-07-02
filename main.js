const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { createSessionManager } = require('windows-media-sessions');

let dashboardWindow;
let widgets = {};

function createDashboard() {
  dashboardWindow = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true,
  });

  dashboardWindow.loadFile('index.html');
}

function createWidget(name, width, height) {
  if (widgets[name]) {
    widgets[name].focus();
    return;
  }

  const widgetWindow = new BrowserWindow({
    width: width,
    height: height,
    transparent: true,
    frame: false,
    resizable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    alwaysOnTop: true
  });

  widgetWindow.loadFile(`${name}.html`);
  
  widgetWindow.on('closed', () => {
    delete widgets[name];
  });

  widgets[name] = widgetWindow;
}

app.whenReady().then(() => {
  createDashboard();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createDashboard();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on('open-widget', (event, { name, width, height }) => {
  createWidget(name, width, height);
});

ipcMain.on('close-widget', (event, name) => {
  if (widgets[name]) {
    widgets[name].close();
  }
});

// Windows Media Sessions
try {
  const mediaSessionManager = createSessionManager();
  
  // Swallow errors to prevent console spam when the .NET backend crashes
  mediaSessionManager.on('error', () => {});

  mediaSessionManager.onSessionsChanged((sessions) => {
    if (widgets['media']) {
      const activeSession = sessions.find(s => s.playbackStatus === 'playing') || sessions[0];
      if (activeSession) {
        widgets['media'].webContents.send('media-update', { action: 'change', session: activeSession });
      } else {
        widgets['media'].webContents.send('media-update', { action: 'change', session: null });
      }
    }
  });

  ipcMain.on('get-media-state', async (event) => {
    if (widgets['media']) {
      try {
        const active = await mediaSessionManager.getActiveSessions();
        const activeSession = active && active.length > 0 ? active[0] : null;
        widgets['media'].webContents.send('media-update', { action: 'change', session: activeSession });
      } catch (err) {
        // Ignore errors
      }
    }
  });

  ipcMain.on('media-control', async (event, action, params) => {
    try {
      const smtcControl = await import('win-media-control-enhanced');
      if (action === 'playpause') {
        await smtcControl.togglePlayPause();
      } else if (action === 'next') {
        await smtcControl.next();
      } else if (action === 'prev') {
        await smtcControl.previous();
      } else if (action === 'seek') {
        await smtcControl.seek(params.positionMs);
      }
    } catch (err) {
      console.error("Media control error:", err);
    }
  });
} catch (err) {
  console.error("MediaSessions initialization error:", err);
}
