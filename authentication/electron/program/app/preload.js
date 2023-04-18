const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld('electron', {
    onTwitchUser: (fn) => {
        ipcRenderer.on('twitch_user', (event, ...args) => fn(...args));
    },

    openWeb: (url) => {
        ipcRenderer.send('openWeb', url);
    }
});