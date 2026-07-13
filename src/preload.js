const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('butterDog', {
  filePathFor(file) {
    return webUtils.getPathForFile(file);
  },
  trashFiles(filePaths) {
    return ipcRenderer.invoke('trash-files', filePaths);
  },
  openTrash() {
    return ipcRenderer.invoke('open-trash');
  },
  getScale() {
    return ipcRenderer.invoke('get-pet-scale');
  },
  onScaleChanged(callback) {
    const listener = (_event, scale) => callback(scale);
    ipcRenderer.on('pet-scale-changed', listener);
    return () => ipcRenderer.removeListener('pet-scale-changed', listener);
  },
  moveWindow(bounds) {
    ipcRenderer.send('move-window', bounds);
  }
});
