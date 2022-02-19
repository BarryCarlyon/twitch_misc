const fs = require('fs');
const path = require('path');

// Load configuation
const config = JSON.parse(fs.readFileSync(path.join(
    __dirname,
    'config.json'
)));

// Require depedancies
// Got is used for making HTTP/API Calls
const got = require('got');
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

got({
    url: "https://api.twitch.tv/helix/extensions/chat",
    method: "POST",
    headers: {
        "Client-ID": config.client_id,
        "Authorization": "Bearer " + sigChat
    },
    json: {
        broadcaster_id: config.channel_id,
        text: "This is a Test Message Kappa",
        extension_id: config.client_id,
        extension_version: config.extension_version
    },
    responseType: 'json'
})
.then(resp => {
    // console log out the useful information
    // keeping track of rate limits is important
    // you can only set the config 12 times a minute per segment
    console.error('Send Chat OK', resp.statusCode, resp.headers['ratelimit-remaining'], '/', resp.headers['ratelimit-limit']);

    // we don't care too much about the statusCode here
    // but you should test it for a 204
})
.catch(err => {
    if (err.response) {
        console.error('Errored', err.response.statusCode, err.response.body);
        return;
    }
    console.error(err);
});
