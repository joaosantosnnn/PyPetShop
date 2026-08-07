const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petGestorDesktop', {
  onAuthCallback: (callback) => {
    const listener = (_event, url) => callback(url);
    ipcRenderer.on('petgestor:auth-callback', listener);
    return () => ipcRenderer.removeListener('petgestor:auth-callback', listener);
  },
  getUpdateStatus: () => ipcRenderer.invoke('petgestor:get-update-status'),
  checkForUpdates: () => ipcRenderer.invoke('petgestor:check-for-updates'),
  installUpdate: () => ipcRenderer.invoke('petgestor:install-update'),
  onUpdateStatus: (callback) => {
    const listener = (_event, status) => callback(status);
    ipcRenderer.on('petgestor:update-status', listener);
    return () => ipcRenderer.removeListener('petgestor:update-status', listener);
  },
});
