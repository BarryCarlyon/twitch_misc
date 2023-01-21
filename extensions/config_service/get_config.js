const fs = require('fs');
const path = require('path');

// Load configuation
const config = JSON.parse(fs.readFileSync(path.join(
    __dirname,
    'config.json'
)));

// Require depedancies
// fetch is used for making HTTP/API Calls
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
// jsonwebtoken is used for creating an decoding JWT's
const jwt = require('jsonwebtoken');

// Prepare the Extension secret for use
// it's base64 encoded and we need to decode it first
const ext_secret = Buffer.from(config.extension_secret, 'base64');

// Lets prepare the signatures for saving config and sending to PubSub
// The EXP is being set to 4 seconds in the future
const sigConfigPayload = {
    "exp": Math.floor(new Date().getTime() / 1000) + 4,
    "user_id": config.owner,
    "role": "external",
}
const sigConfig = jwt.sign(sigConfigPayload, ext_secret);

let configURL = new URL("https://api.twitch.tv/helix/extensions/configurations");
configURL.search = new URLSearchParams([
    [ 'extension_id', config.client_id ],
    [ 'segment', 'global' ]
]).toString();
fetch(
    configURL,
    {
        method: "GET",
        headers: {
            "Client-ID": config.client_id,
            "Authorization": "Bearer " + sigConfig,
            "Accept": "application/json"
        }
    }
)
.then(resp => {
    // console log out the useful information
    // keeping track of rate limits is important
    // you can only set the config 12 times a minute per segment
    console.error('Got Config OK', resp.status, resp.headers.get('ratelimit-remaining'), '/', resp.headers.get('ratelimit-limit'));
    return resp.json();
})
.then(resp => {
    console.log(resp);
    if (resp.data && resp.data[0]) {
        console.log(JSON.parse(resp.data[0].content));
    }
})
.catch(err => {
    console.error(err);
});
