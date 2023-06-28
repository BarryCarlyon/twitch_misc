const fs = require('fs');
const path = require('path');

// Load configuation
const config = JSON.parse(fs.readFileSync(path.join(
    __dirname,
    'config.json'
)));

// Require depedancies
// Fetch is used for making HTTP/API Calls
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
// jsonwebtoken is used for creating an decoding JWT's
const jwt = require('jsonwebtoken');

// Prepare the Extension secret for use
// it's base64 encoded and we need to decode it first
const ext_secret = Buffer.from(config.extension_secret, 'base64');

// Lets prepare the signatures for saving config and sending to PubSub
// The EXP is being set to 4 seconds in the future
const sigChatPayload = {
    "exp": Math.floor(new Date().getTime() / 1000) + 4,
    "user_id": config.owner,
    "role": "external"
}
const sigChat = jwt.sign(sigChatPayload, ext_secret);

// We have now prepared the Signature and data

fetch(
    "https://api.twitch.tv/helix/extensions/chat",
    {
        method: "POST",
        headers: {
            "Client-ID": config.client_id,
            "Authorization": "Bearer " + sigChat,
            "Content-Type": 'application/json'
        },
        body: JSON.stringify({
            broadcaster_id: config.channel_id,
            text: "This is a Test Message Kappa",
            extension_id: config.client_id,
            extension_version: config.extension_version
        })
    }
)
.then(async resp => {
    // console log out the useful information
    // keeping track of rate limits is important
    // you can only set the config 12 times a minute per segment
    console.error('Send Chat OK', resp.status, resp.headers.get('ratelimit-remaining'), '/', resp.headers.get('ratelimit-limit'));

    // we don't care too much about the statusCode here
    // but you should test it for a 204
    if (resp.status != 204) {
        console.error('Send Chat Error', await resp.text());
    }
})
.catch(err => {
    console.error(err);
});
