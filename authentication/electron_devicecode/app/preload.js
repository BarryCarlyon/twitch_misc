const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld('electron', {
    onTwitchLogin: (fn) => {
        ipcRenderer.on('twitch_login', (event, ...args) => fn(...args));
    },
    onTwitchLoginExpired: (fn) => {
        ipcRenderer.on('twitch_login_expired', (event, ...args) => fn(...args));
    },
    onTwitchUser: (fn) => {
        ipcRenderer.on('twitch_user', (event, ...args) => fn(...args));
    },

    logout: () => {
        ipcRenderer.send('logout');
    },
    login: () => {
        ipcRenderer.send('login');
    },
    openWeb: (url) => {
        ipcRenderer.send('openWeb', url);
    }
});