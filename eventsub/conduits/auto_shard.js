import 'dotenv/config';

import { eventsubSocket } from './eventsub.js'

// begin start up
if (!process.env.TWITCH_CLIENT_ID) {
    console.error('No Twitch ClientID');
    process.exit();
}
if (!process.env.TWITCH_CLIENT_SECRET) {
    console.error('No Twitch ClientSecret');
    process.exit();
}

import { readFileSync, writeFileSync } from 'fs';

let storeToken = {};
if (process.env.TWITCH_STORAGE == 'redis') {
} else if (process.env.TWITCH_STORAGE == 'file') {
    process.env.TWITCH_ACCESS_TOKEN = '';
    try {
        let tokenString = readFileSync('./token.jsonl');
        let { access_token } = JSON.parse(tokenString);
        process.env.TWITCH_ACCESS_TOKEN = access_token;
    } catch (e) {
        console.warn(e);
    }
    storeToken = function(access_token) {
        writeFileSync('./token.jsonl', JSON.stringify({ access_token }));
        console.log('Wrote the token to disk');
    }
} else {
    console.error('No Storage Defined');
    process.exit();
}

async function obtainToken() {
    console.log('obtain token');
    let tokenReq = await fetch(
        'https://id.twitch.tv/oauth2/token',
        {
            method: 'POST',
            body: new URLSearchParams([
                [ 'client_id', process.env.TWITCH_CLIENT_ID ],
                [ 'client_secret', process.env.TWITCH_CLIENT_SECRET ],
                [ 'grant_type', 'client_credentials' ]
            ])
        }
    );
    if (tokenReq.status != 200) {
        console.error(`Failed to get a token: ${tokenReq.status}//${await tokenReq.text()}`);
        process.exit();
    }
    console.log('Obtained a token');
    let { access_token, expires_in } = await tokenReq.json();
    // store/write to storage
    process.env.TWITCH_ACCESS_TOKEN = access_token;
    storeToken(process.env.TWITCH_ACCESS_TOKEN);
}
async function validateToken() {
    console.log('validate token');
    if (process.env.TWITCH_ACCESS_TOKEN == '') {
        return obtainToken();
    }
    let validateReq = await fetch(
        'https://id.twitch.tv/oauth2/validate',
        {
            method: 'GET',
            headers: {
                'Authorization': `OAuth ${process.env.TWITCH_ACCESS_TOKEN}`
            }
        }
    );
    if (validateReq.status == 200) {
        // ok lets go
        return;
    }
    return obtainToken();
}

// validate the token
await validateToken();
console.log('All done token wise');

let twitchHeaders = {
    'Client-ID': process.env.TWITCH_CLIENT_ID,
    'Authorization': `Bearer ${process.env.TWITCH_ACCESS_TOKEN}`,
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip'
};

// Conduit time
if (!process.env.TWITCH_CONDUIT_ID || process.env.TWITCH_CONDUIT_ID == '') {
    console.error('Please Define a Conduit ID or method');
    process.exit();
}

let conduitsReq = await fetch(
    'https://api.twitch.tv/helix/eventsub/conduits',
    {
        method: 'GET',
        headers: {
            ...twitchHeaders
        }
    }
);
if (conduitsReq.status != 200) {
    console.error(`Failed to Get Conduits ${conduitsReq.status}//${await conduitsReq.text()}`);
    process.exit();
}
let { data } = await conduitsReq.json();
console.log(`Obtained Conduits we found ${data.length}`);

async function createConduit() {
    let createReq = await fetch(
        'https://api.twitch.tv/helix/eventsub/conduits',
        {
            method: 'POST',
            headers: {
                ...twitchHeaders,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ shard_count: 1 })
        }
    );
    if (createReq.status != 200) {
        console.error(`Failed to create Conduuit ${createReq.status}//${await createReq.text()}`);
        process.exit();
    }
    let { data } = await createReq.json();
    let { id } = data[0];
    //console.log('ass', id);
    return id;
}

if (data.length == 0) {
    // no conduits exist
    if (process.env.TWITCH_CONDUIT_ID != 'auto') {
        // we will create and use a conduit
        console.error('No Conduits Exist');
        process.exit();
    }
    // create and overwrite the conduit ID in memory
    console.log('Zero conduits and defined as auto');
    process.env.TWITCH_CONDUIT_ID = await createConduit();
    console.log(`Create a conduit: ${process.env.TWITCH_CONDUIT_ID}`);
} else if (data.length == 1 && process.env.TWITCH_CONDUIT_ID == 'auto') {
    process.env.TWITCH_CONDUIT_ID = data[0].id;
    console.log(`Conduit defined as auto and one conduit found: ${process.env.TWITCH_CONDUIT_ID}`);
} else {
    // find matching conduit
    let found = false;
    for (let x=0;x<data.length;x++) {
        let { id } = data[x];
        if (id == process.env.TWITCH_CONDUIT_ID) {
            found = true;
        }
    }
    if (!found) {
        console.error(`Conduit of ID ${process.env.TWITCH_CONDUIT_ID} not found in ${data.length}`);
        process.exit();
    }
    console.log(`The Target Conduit was found: ${process.env.TWITCH_CONDUIT_ID}`);
}

// The Conduit exists
// lets spawn a WebSocket and assign this socket to a shard
// if we are a ID of auto then the shard ID is forced to 0 if we created...
let mySocket = new eventsubSocket(true);
mySocket.on('connected', async (session_id) => {
    console.log(`Socket has conneted ${session_id} with assigned as ${process.env.TWITCH_SHARD_ID} for ${process.env.TWITCH_CONDUIT_ID}`);
    // connect the socket to the conduit on the stated shard ID
    let conduitUpdate = await fetch(
        'https://api.twitch.tv/helix/eventsub/conduits/shards',
        {
            method: 'PATCH',
            headers: {
                ...twitchHeaders,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conduit_id: process.env.TWITCH_CONDUIT_ID,
                shards: [
                    {
                        id: process.env.TWITCH_SHARD_ID,
                        transport: {
                            method: 'websocket',
                            session_id
                        }
                    }
                ]
            })
        }
    );
    if (conduitUpdate.status != 202) {
        console.error(`Failed to assign socket to shard ${conduitUpdate.status}//${await conduitUpdate.text()}`);
        process.exit();
    }
    // check topic count
    // theres no conduit ID filter soooooooooooooooooooooooooooo
    // if we autoed then this thing or another thing _really_ needs to do the topics....
});
