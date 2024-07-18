const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("ipcRenderer", {
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, fn) => ipcRenderer.on(channel, (event, ...args) => fn(...args)),
  once: (channel, fn) =>
    ipcRenderer.once(channel, (event, ...args) => fn(...args)),
  getListeners: (channel) => ipcRenderer.listeners(channel), //! Debugging only
});
