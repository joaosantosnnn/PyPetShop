const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

const APP_ID = 'com.petgestor.desktop';

app.setAppUserModelId(APP_ID);
app.setAsDefaultProtocolClient('petgestor');

let mainWindow = null;
let pendingAuthUrl = process.argv.find((argument) => argument.startsWith('petgestor://')) || null;
let updateStatus = { state: 'idle', version: app.getVersion(), percent: 0 };

const publishUpdateStatus = (nextStatus) => {
  updateStatus = { ...updateStatus, ...nextStatus };
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('petgestor:update-status', updateStatus);
  }
};

const checkForUpdates = async () => {
  if (!app.isPackaged) {
    publishUpdateStatus({ state: 'development', message: 'Atualizações estão disponíveis somente no aplicativo instalado.' });
    return updateStatus;
  }
  publishUpdateStatus({ state: 'checking', message: 'Buscando atualizações...' });
  try {
    await autoUpdater.checkForUpdates();
  } catch (error) {
    publishUpdateStatus({ state: 'error', message: error instanceof Error ? error.message : 'Não foi possível buscar atualizações.' });
  }
  return updateStatus;
};

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

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.on('checking-for-update', () => publishUpdateStatus({ state: 'checking', message: 'Buscando atualizações...' }));
autoUpdater.on('update-available', (info) => publishUpdateStatus({ state: 'available', version: info.version, percent: 0, message: `Baixando a versão ${info.version}...` }));
autoUpdater.on('update-not-available', (info) => publishUpdateStatus({ state: 'current', version: info.version || app.getVersion(), percent: 100, message: 'O PetGestor está atualizado.' }));
autoUpdater.on('download-progress', (progress) => publishUpdateStatus({ state: 'downloading', percent: Math.round(progress.percent), message: `Baixando atualização: ${Math.round(progress.percent)}%` }));
autoUpdater.on('update-downloaded', (info) => publishUpdateStatus({ state: 'downloaded', version: info.version, percent: 100, message: 'Atualização pronta para instalar.' }));
autoUpdater.on('error', (error) => publishUpdateStatus({ state: 'error', message: error.message || 'Não foi possível atualizar o PetGestor.' }));

ipcMain.handle('petgestor:get-update-status', () => updateStatus);
ipcMain.handle('petgestor:check-for-updates', checkForUpdates);
ipcMain.handle('petgestor:install-update', () => {
  if (updateStatus.state === 'downloaded') autoUpdater.quitAndInstall(false, true);
});

app.whenReady().then(() => {
  createWindow();
  if (app.isPackaged) {
    setTimeout(() => void checkForUpdates(), 5000);
    setInterval(() => void checkForUpdates(), 4 * 60 * 60 * 1000);
  }
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
