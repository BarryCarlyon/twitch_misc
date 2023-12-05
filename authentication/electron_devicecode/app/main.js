process.env.CLIENT_ID = '';
let scopes = [ 'user:read:email' ];

const { app, BrowserWindow, ipcMain, shell } = require('electron')

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    app.quit();
    return;
}

const path = require('path');

const Store = require('electron-store');
const { electron } = require('process');
const store = new Store();

const fetch = require('electron-fetch').default

let win;

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

    win.once('ready-to-show', async () => {
        win.show()

        //setTimeout(() => {
        //    win.webContents.openDevTools();
        //}, 500);

        // try for existing
        let access_token = store.get('twitch_access_token');
        console.log(access_token);
        // validate access
        if (access_token) {// && refresh) {
            // we have tokens
            let is_ok = await tokenCheck();
            if (is_ok) {
                // forward to front
                access_token = store.get('twitch_access_token');
                runToken(access_token);
            }
        }
    });
});

ipcMain.on('openWeb', (e,url) => {
    shell.openExternal(url);
});
ipcMain.on('logout', async (e) => {
    store.delete('twitch_access_token');
    store.delete('twitch_refresh_token');
    win.loadFile(path.join(app.getAppPath(), '/app/assets/index.html'));
});
ipcMain.on('login', async (e) => {
    let req = await fetch(
        `https://id.twitch.tv/oauth2/device`,
        {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams([
                [ 'client_id', process.env.CLIENT_ID ],
                [ 'scope', scopes.join('+') ]
            ])
        }
    );

    if (req.status != 200) {
        console.log('Abort due to non 200');
        return;
    }

    let data = await req.json();
    let { device_code, expires_in, interval, user_code, verification_uri } = data;
    if (device_code && verification_uri) {
        //shell.openExternal(verification_uri);
        win.webContents.send('twitch_login', {
            user_code,
            verification_uri
        });

        startPolling({ device_code, expires_in, interval });
    }
});

let poller = false;
function startPolling({ device_code, expires_in, interval }) {
    console.log('Starting to spool');
    // poll intil expires_in....

    let expires_at = new Date();
    expires_at.setSeconds(expires_at.getSeconds() + expires_in);

    // run
    clearInterval(poller);
    poller = setInterval(() => {
        console.log(new Date(), '>', expires_at);

        if (new Date() > expires_at) {
            console.log('its dead jim');
            win.webContents.send('twitch_login_expired', {});
            clearInterval(poller);
            return;
        }

        // see if it's ready
        fetch(
            `https://id.twitch.tv/oauth2/token`,
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams([
                    [ 'client_id', process.env.CLIENT_ID ],
                    [ 'device_code', device_code ],
                    [ 'grant_type', 'urn:ietf:params:oauth:grant-type:device_code' ]
                ])
            }
        )
        .then(async resp => {
            let data = await resp.json();
            console.log('Device', resp.status, data);

            if (resp.status != 200) {
                console.log('ERROR', data);
                return;
            }
            if (data.status == 400) {
                console.log('Not ready yet:', data.message);
                return;
            }

            let { access_token, refresh_token } = data;
            // store token
            store.set('twitch_access_token', access_token);
            store.set('twitch_refresh_token', refresh_token);
            // go
            runToken(access_token);
            // we good
            clearInterval(poller);
        })
    }, (interval * 1000));
}





async function tokenCheck() {
    console.log('perfrom token check');
    let access = store.get('twitch_access_token');
    //let refresh = store.get('twitch_refresh_token');

    let validateReq = await fetch(
        'https://id.twitch.tv/oauth2/validate',
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${access}`,
                'Accept': 'application/json'
            }
        }
    );
    if (validateReq.status == 200) {
        // yay, check time left
        let { expires_in } = await validateReq.json();
        console.log('Token Check OK', expires_in);
        if (expires_in < (10 * 60)) {
            // refresh
            return refreshToken();
        }
        return true;
    }

    console.log('Token DEAD');
    return refreshToken();
}
async function refreshToken() {
    console.log('Refreshing token');
    let refresh_token = store.get('twitch_refresh_token');

    let refreshReq = await fetch(
        'https://id.twitch.tv/oauth2/token',
        {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams([
                [ 'client_id', process.env.CLIENT_ID ],
                [ 'refresh_token', refresh_token ],
                [ 'grant_type', 'refresh_token' ]
            ])
        }
    );

    if (refreshReq.status == 200) {
        let { access_token, refresh_token } = await refreshReq.json();
        console.log('Refresh OK', access_token);

        store.set('twitch_access_token', access_token);
        store.set('twitch_refresh_token', refresh_token);

        return true;
    }

    console.log('Refresh dead jim', refreshReq.status, await refreshReq.text());
    // all methods failed
    return false;
}





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
                    'Client-ID': process.env.CLIENT_ID,
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
