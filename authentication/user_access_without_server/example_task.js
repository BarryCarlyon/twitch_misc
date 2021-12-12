import fs from 'fs';
import path from 'path';
import { fileURLToPath, URL } from 'url';
import got from 'got';

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
    rl.question('Code> ', (code) => {
        got({
            "url": "https://id.twitch.tv/oauth2/token",
            "method": 'POST',
            "headers": {
                "Accept": "application/json"
            },
            "form": {
                "client_id": config.client_id,
                "client_secret": config.client_secret,
                code,
                "grant_type": "authorization_code",
                "redirect_uri": config.redirect_uri
            },
            "responseType": 'json'
        })
        .then(resp => {
            auth_data = resp.body;
            writeAuthFile();
            doMainThing();
        })
        .catch(err => {
            if (err.response) {
                console.error('Token Error', err.response.statusCode, err.response.body);
            } else {
                console.error('Bad Error', err);
            }
            process.exit();
        })
    });
}

function go() {
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
        got({
            url: 'https://id.twitch.tv/oauth2/validate',
            headers: {
                Authorization: `Bearer ${auth_data.access_token}`
            },
            responseType: 'json'
        })
        .then(resp => {
            // token is good
            doMainThing();
        })
        .catch(err => {
            if (err.response) {
                console.error('Token Error', err.response.statusCode, err.response.body);
                attemptRefresh();
            } else {
                console.error('Bad Error', err);
                requestAuth();
            }
            return;
        });
        return;
    }
    // there is no Auth File
    requestAuth();
}
go();

function attemptRefresh() {
    got({
        url: 'https://id.twitch.tv/oauth2/token',
        method: 'POST',
        searchParams: {
            grant_type:     'refresh',
            refresh_token:  auth_data.refresh_token,
            client_id:      config.client_id,
            client_secret:  config.client_secret
        },
        responseType: 'json'
    })
    .then(resp => {
        auth_data = resp.body;
        writeAuthFile();
        doMainThing();
    })
    .catch(err => {
        if (err.response) {
            console.error('Refresh Token Error', err.response.statusCode, err.response.body);
        } else {
            console.error('Bad Error', err);
        }
        requestAuth();
        return;
    });
}
function writeAuthFile() {
    fs.writeFileSync(
        auth_file,
        JSON.stringify(auth_data, null, 4),
        (e,r) => {
        }
    );
}



function doMainThing() {
    got({
        url: 'https://id.twitch.tv/oauth2/validate',
        headers: {
            'Client-ID': config.client_id,
            Authorization: `Bearer ${auth_data.access_token}`
        },
        responseType: 'json'
    })
    .then(resp => {
        console.log(resp.body);
    })
    .catch(err => {
        if (err.response) {
            console.error('doMainThing Error', err.response.statusCode, err.response.body);
        } else {
            console.error('doMainThing Bad Error', err);
        }
    })
}
