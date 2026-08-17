const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');
const log = require('electron-log');
const db = require('./database');
const { register: registerIPC } = require('./ipc-handlers');

log.transports.file.level = 'info';
log.info('[Main] Starting NefeshPOS (local mode)...');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800,
    minWidth: 1024, minHeight: 680,
    title: 'NefeshPOS',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
    },
  });

  const menu = Menu.buildFromTemplate([
    { label: 'Archivo', submenu: [
      { label: 'Salir', role: 'quit' },
    ]},
    { label: 'Ver', submenu: [
      { label: 'DevTools', role: 'toggleDevTools' },
      { label: 'Pantalla completa', role: 'togglefullscreen' },
    ]},
  ]);
  Menu.setApplicationMenu(menu);

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(async () => {
  await db.initDB();
  registerIPC();
  createWindow();
  log.info('[Main] Window ready');
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (mainWindow === null) createWindow(); });
