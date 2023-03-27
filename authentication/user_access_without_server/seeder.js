import * as dotenv from 'dotenv';
dotenv.config();

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

import { createClient } from 'redis';
const redisClient = createClient();
redisClient.on('error', err => console.log('Redis Client Error', err));
await redisClient.connect();

import readline from 'readline';
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function requestAuth() {
    let url = new URL('https://id.twitch.tv/oauth2/authorize');
    url.search = new URLSearchParams([
        [ 'client_id', process.env.TWITCH_CLIENT_ID ],
        [ 'redirect_uri', process.env.TWITCH_REDIRECT ],
        [ 'response_type', 'code' ],
        [ 'scope', process.env.TWITCH_SCOPES ]
    ]).toString();

    console.log('Please copy and paste this URL into a browser. Or click it if your terminal supports it');
    console.log(url.href);

    // readline time
    rl.question('Code> ', async (code) => {
        let resp = await fetch(
            'https://id.twitch.tv/oauth2/token',
            {
                method: 'POST',
                headers: {
                    "Accept": "application/json"
                },
                body: new URLSearchParams([
                    [ 'client_id', process.env.TWITCH_CLIENT_ID ],
                    [ 'client_secret', process.env.TWITCH_CLIENT_SECRET ],
                    [ 'code', code ],
                    [ 'grant_type', 'authorization_code' ],
                    [ 'redirect_uri', process.env.TWITCH_REDIRECT ]
                ])
            }
        );

        if (resp.status != 200) {
            console.log('Failed exchange', await resp.text());
            process.exit();
        }

        let tokenData = await resp.json();
        let { access_token, refresh_token } = tokenData;

        await redisClient.HSET(
            'twitch_token',
            [
                [ 'access_token', access_token ],
                [ 'refresh_token', refresh_token ]
            ]
        );

        console.log('All done');
        await redisClient.quit();
        rl.close();
    });
}

requestAuth();
