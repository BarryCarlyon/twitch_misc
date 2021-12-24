const { app, BrowserWindow, session } = require('electron')
const { URL, URLSearchParams } = require('url');
const path = require('path');

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

app.on('window-all-closed', () => {
    app.quit()
});
app.on('ready', () => {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
              ...details.responseHeaders,
              'Content-Security-Policy': ['default-src \'self\'']
          }
        })
    });

    const win = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        webPreferences: {
            preload: path.join(app.getAppPath(), '/preload.js')
        }
    });

    // and load the index.html of the app.
    win.loadFile('assets/index.html')

    win.once('ready-to-show', () => {
        win.show()
    });

    //win.webContents.openDevTools();

    win.webContents.on('new-window', (e,url,empty,tab,new_window) => {
        new_window.webContents.on('did-navigate', (e, frame_url, httpResponseCode, httpStatusText) => {
            console.log('child url', frame_url);
            let url = new URL(frame_url);
            let params = new URLSearchParams(url.hash.substr(1));
            console.log(params);
            if (params.get('access_token')) {
                // we got a token to use
                runToken(params.get('access_token'));
                new_window.webContents.destroy();
            }
        });
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
});
