const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("butterDog", {
  showContextMenu: () => ipcRenderer.invoke("show-context-menu"),
  moveWindowBy: (x, y) => ipcRenderer.send("move-window-by", { x, y })
});
