// Load configuation
import * as dotenv from 'dotenv';
dotenv.config()

import { twitch } from './twitch.js';
new twitch();

// exmaple call
setTimeout(() => {
    // it should return the rate limit as 799/800
    fetch(
        "https://api.twitch.tv/helix/users?login=barrycarlyon",
        {
            method: "GET",
            headers: {
                "Client-ID": process.env.client_id,
                "Authorization": "Bearer " + process.env.access_token
            }
        }
    )
    .then(r => r.json().then(data => ({ status: r.status, headers: r.headers, body: data })))
    .then(resp => {
        if (resp.status != 200) {
            console.log('Failed with', resp.status, resp.body);
            return;
        }
        console.log(resp.body, resp.headers.get('ratelimit-remaining'), '/', resp.headers.get('ratelimit-limit'));
    })
    .catch(err => {
        console.error(err);
    })
    .finally(() => {
        process.exit();
    });
}, 5000);
