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

got({
    url: 'https://api.twitch.tv/extensions/' + config.client_id + '/configurations/segments/global/',
    method: 'GET',
    headers: {
        'Client-ID': config.client_id,
        'Authorization': 'Bearer ' + sigConfig
    },
    responseType: 'json'
})
.then(resp => {
    console.log('Global Config');
    console.log(resp.body);
    console.log('Global Config');

    let config_to_write = {};
    if (resp.body && resp.body['global:']) {
        config_to_write = JSON.parse(resp.body['global:'].record.content);
    }

    fs.writeFileSync(path.join(
        __dirname,
        'global_config.json'
    ), JSON.stringify(config_to_write, null, 4));
})
.catch(err => {
    if (err.response) {
        console.error('Error', err.statusCode, err.response.body);
    } else {
        console.error('Generic Error', err);
    }
});

