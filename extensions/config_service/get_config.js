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
const sigConfigPayload = {
    "exp": Math.floor(new Date().getTime() / 1000) + 4,
    "user_id": config.owner,
    "role": "external",
}
const sigConfig = jwt.sign(sigConfigPayload, ext_secret);

got({
    url: "https://api.twitch.tv/helix/extensions/configurations",
    method: "GET",
    headers: {
        "Client-ID": config.client_id,
        "Authorization": "Bearer " + sigConfig
    },
    searchParams: {
        extension_id: config.client_id,
        segment: "global",
    },
    responseType: 'json'
})
.then(resp => {
    // console log out the useful information
    // keeping track of rate limits is important
    // you can only set the config 12 times a minute per segment
    console.error('Got Config OK', resp.statusCode, resp.headers['ratelimit-remaining'], '/', resp.headers['ratelimit-limit']);
    console.log(resp.body);
    if (resp.body.data && resp.body.data[0]) {
        console.log(JSON.parse(resp.body.data[0].content));
    }
})
.catch(err => {
    if (err.response) {
        console.error('Errored', err.response.statusCode, err.response.body);
        return;
    }
    console.error(err);
});
