import fs from 'fs';
import path from 'path';
import { fileURLToPath, URL } from 'url';
import fetch from 'node-fetch';

const config = JSON.parse(fs.readFileSync(path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    'config.json'
)));

const auth_file = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    'auth.json'
);
let auth_data = {};

import readline from 'readline';
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function requestAuth() {
    let url = new URL('https://id.twitch.tv/oauth2/authorize');
    url.search = new URLSearchParams([
        [ 'client_id', config.client_id ],
        [ 'redirect_uri', config.redirect_uri ],
        [ 'response_type', 'code' ],
        [ 'scope', 'user:read:email' ]
    ]).toString();

    console.log('Please copy and paste this URL into a browser');
    console.log(url.href);

    // readline time
    rl.question('Code> ', async (code) => {
        let resp = await fetch(
            "https://id.twitch.tv/oauth2/token",
            {
                "method": 'POST',
                "headers": {
                    "Accept": "application/json"
                },
                "body": new URLSearchParams([
                    [ "client_id", config.client_id ],
                    [ "client_secret", config.client_secret ],
                    [ "code", code ],
                    [ "grant_type", "authorization_code" ],
                    [ "redirect_uri", config.redirect_uri ]
                ])
            }
        );

        if (resp.status != 200) {
            console.error('An Error occured', await resp.text());
            process.exit();
        }

        auth_data = await resp.json();

        writeAuthFile();
        doMainThing();
    });
}

async function go() {
    // no auth file
    if (fs.existsSync(auth_file)) {
        console.log('Got Auth File');
        auth_data = fs.readFileSync(auth_file);

        try {
            auth_data = JSON.parse(auth_data);
        } catch (e) {
            console.log('failed to pase');
            // failed to parse liekly invalid
            requestAuth();
            return;
        }

        // validate
        let resp = await fetch(
            'https://id.twitch.tv/oauth2/validate',
            {
                headers: {
                    Authorization: `Bearer ${auth_data.access_token}`
                }
            }
        );
        if (resp.status != 200) {
            console.error('Token Error', resp.status, await resp.text());
            attemptRefresh();
            return;
        }

        // token is good
        doMainThing();
    }
    // there is no Auth File
    requestAuth();
}
go();

async function attemptRefresh() {
    let url = new URL('https://id.twitch.tv/oauth2/token');
    url.search = new URLSearchParams([
        [ 'grant_type', 'refresh_token' ],
        [ 'refresh_token', auth_data.refresh_token ],
        [ 'client_id', config.client_id ],
        [ 'client_secret', config.client_secret ]
    ]).toString();

    let resp = await fetch(
        url,
        {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            }
        }
    );

    if (resp.status != 200) {
        console.error('Refresh Token Error', resp.status, await resp.text());
        requestAuth();
        return;
    }
    auth_data = await resp.json();
    writeAuthFile();
    doMainThing();
}
function writeAuthFile() {
    fs.writeFileSync(
        auth_file,
        JSON.stringify(auth_data, null, 4),
        (e,r) => {
        }
    );
}



async function doMainThing() {
    // the main thing here
    // is an example that just calls get users
    // but normally it would be say,
    // connect to pubsub and do stuff
    // connect to the API and poll for data periodically auto refreshign the token
    // etc
    let resp = await fetch(
        'https://api.twitch.tv/helix/users',
        {
            headers: {
                'Client-ID': config.client_id,
                Authorization: `Bearer ${auth_data.access_token}`
            }
        }
    )
    console.log('user', resp.status, await resp.json());
    process.exit();
}
