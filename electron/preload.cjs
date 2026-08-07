const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petGestorDesktop', {
  onAuthCallback: (callback) => {
    const listener = (_event, url) => callback(url);
    ipcRenderer.on('petgestor:auth-callback', listener);
    return () => ipcRenderer.removeListener('petgestor:auth-callback', listener);
  },
});
