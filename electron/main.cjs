const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

const APP_ID = 'com.petgestor.desktop';

app.setAppUserModelId(APP_ID);
app.setAsDefaultProtocolClient('petgestor');

let mainWindow = null;
let pendingAuthUrl = process.argv.find((argument) => argument.startsWith('petgestor://')) || null;

const sendAuthUrl = (url) => {
  if (!url || !mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
  mainWindow.webContents.send('petgestor:auth-callback', url);
};

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) app.quit();

app.on('second-instance', (_event, commandLine) => {
  const authUrl = commandLine.find((argument) => argument.startsWith('petgestor://'));
  if (authUrl) sendAuthUrl(authUrl);
});

app.on('open-url', (event, url) => {
  event.preventDefault();
  if (mainWindow) sendAuthUrl(url);
  else pendingAuthUrl = url;
});

const createWindow = () => {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#f1f5f9',
    icon: path.join(__dirname, '..', 'public', 'icons', 'petgestor.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow = window;

  window.once('ready-to-show', () => {
    window.show();
    if (pendingAuthUrl) {
      sendAuthUrl(pendingAuthUrl);
      pendingAuthUrl = null;
    }
  });
  window.on('closed', () => { mainWindow = null; });
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event, url) => {
    if (url !== window.webContents.getURL() && url.startsWith('https://')) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });

  void window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
};

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
