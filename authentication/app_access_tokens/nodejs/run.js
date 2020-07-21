const fs = require('fs');
const path = require('path');
const got = require('got');

// Load configuation
const config = JSON.parse(fs.readFileSync(path.join(
    __dirname,
    'config.json'
)));

var twitch = require(path.join(
    __dirname,
    'twitch.js'
))(config);

// exmaple call

setTimeout(() => {
    // it should return the rate limit as 799/800
    got({
        url: "https://api.twitch.tv/helix/users?login=barrycarlyon",
        method: "GET",
        headers: {
            "Client-ID": twitch.client.client_id,
            "Authorization": "Bearer " + twitch.client.access_token
        },
        responseType: "json"
    })
    .then(resp => {
        console.log(resp.body, resp.headers['ratelimit-remaining'], '/', resp.headers['ratelimit-limit']);
    })
    .catch(err => {
        console.error(err);
    })
    .finally(() => {
        process.exit();
    });
}, 5000);
