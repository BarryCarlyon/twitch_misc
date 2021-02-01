const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(
    __dirname,
    'config.json'
)));

const got = require('got');
const jwt = require('jsonwebtoken');

const ext_secret = Buffer.from(config.extension_secret, 'base64');

const sigConfigPayload = {
  "exp": Math.floor(new Date().getTime() / 1000) + 60,
  "user_id": config.user_id,
  "role": "external",
}
const sigConfig = jwt.sign(sigConfigPayload, ext_secret);

let global = JSON.parse(fs.readFileSync(path.join(
    __dirname,
    'global_config.json'
)));

console.log('Set global');

got({
    url: 'https://api.twitch.tv/extensions/' + config.client_id + '/configurations/',
    method: 'PUT',
    headers: {
        'Client-ID': config.client_id,
        'Authorization': 'Bearer ' + sigConfig,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        'segment': 'global',
        'content': JSON.stringify(global)
    }),
    responseType: 'json'
})
.then(resp => {
    console.log('Global Config');
    console.log(resp.headers['ratelimit-ratelimiterextensionsetconfiguration-remaining'], '/', resp.headers['ratelimit-ratelimiterextensionsetconfiguration-limit']);
    console.log(resp.statusCode, resp.body);
    console.log('Global Config');
})
.catch(err => {
    if (err.response) {
        console.error('Error', err.statusCode, err.response.body);
    } else {
        console.error('Generic Error', err);
    }
});

