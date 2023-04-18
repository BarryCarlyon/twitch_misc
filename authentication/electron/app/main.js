const { app, BrowserWindow, ipcMain, shell } = require('electron')
//const { URL, URLSearchParams } = require('url');
const path = require('path');

const fetch = require('electron-fetch').default

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    app.quit();
    return;
}

let win;

app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (win) {
        if (win.isMinimized()) {
            win.restore();
        }
        win.focus();
    }

    let input = commandLine.pop();
    let url = new URL(input);
    if (url.host == 'twitchauth') {
        let pathparts = url.pathname.split('/');
        runToken(pathparts[1]);
    }
});

/*
Custom URI Handler
*/
if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('twitch-misc-example', process.execPath, [path.resolve(process.argv[1])]);
    }
} else {
    app.setAsDefaultProtocolClient('twitch-misc-example');
}

/*
on to the app
*/
app.on('window-all-closed', () => {
    app.quit()
});
app.on('ready', () => {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        webPreferences: {
            preload: path.join(app.getAppPath(), '/app/preload.js')
        }
    });

    // and load the index.html of the app.
    win.loadFile(path.join(app.getAppPath(), '/app/assets/index.html'));

    win.once('ready-to-show', () => {
        win.show()

        setTimeout(() => {
            win.webContents.openDevTools();
        }, 500);
    });
});

ipcMain.on('openWeb', (e,url) => {
    shell.openExternal(url);
});

function runToken(token) {
    let client_id = '';
    fetch(
        'https://id.twitch.tv/oauth2/validate',
        {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }
    )
    .then(resp => resp.json())
    .then(resp => {
        client_id = resp.client_id;
        return fetch(
            'https://api.twitch.tv/helix/users',
            {
                headers: {
                    'Accept': 'application/json',
                    'Client-ID': client_id,
                    'Authorization': `Bearer ${token}`
                }
            }
        )
    })
    .then(resp => resp.json())
    .then(resp => {
        console.log('Got user', resp);

        // ipc
        win.webContents.send('twitch_user', resp.data[0]);
    })
    .catch(err => {
        console.log('An Error Occurred', err);
    });
}
