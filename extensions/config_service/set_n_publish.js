/*

The config service for Twitch Extensions is great.
But when you set config it doesn't trigger onChanged.
onChanged is used to retrieve config values from the config service.
But it's only triggered once when the extension inits

This example covers how to set the config
And then Broadcast it

it's a NodeJS Example
it's suitable for cron jobs

*/

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
const sigConfigPayload = {
    "exp": Math.floor(new Date().getTime() / 1000) + 4,
    "user_id": config.owner,
    "role": "external",
}
const sigConfig = jwt.sign(sigConfigPayload, ext_secret);

const sigPubSubPayload = {
    "exp": Math.floor(new Date().getTime() / 1000) + 4,
    "user_id": config.owner,
    "role": "external",
    "channel_id": "all",
    "pubsub_perms": {
        "send": [
            "global"
        ]
    }
}
const sigPubSub = jwt.sign(sigPubSubPayload, ext_secret);

// Payload we are storing in config
// it needs to be a JSON string
// Also remember about the 5kb limit for config segements and pubsub
var content = JSON.stringify({
    "config_key_1": "config_value_1",
    "config_key_2": "config_value_2",
    "config_key_3": "config_value_3"
});

// We have now prepared the Signatures and data
// We'll now store this in the global segment
// This means its' available for all instances of the extension
// an instance is a channel the extension is installed upon

fetch(
    "https://api.twitch.tv/helix/extensions/configurations",
    {
        method: "PUT",
        headers: {
            "Client-ID": config.client_id,
            "Authorization": "Bearer " + sigConfig,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            extension_id: config.client_id,
            segment: "global",
            content
        })
    }
)
.then(resp => {
    // console log out the useful information
    // keeping track of rate limits is important
    // you can only set the config 12 times a minute per segment
    console.error('Store Config OK', resp.status, resp.headers.get('ratelimit-remaining'), '/', resp.headers.get('ratelimit-limit'));

    // we don't care too much about the status here
    // but you should test it for a 204

    // lets also send the same information to pubsub
    // so running instances get the update

    // we'll pubsub to the all/global message feed
    return fetch(
        "https://api.twitch.tv/helix/extensions/pubsub",
        {
            method: "POST",
            headers: {
                "Client-ID": config.client_id,
                "Authorization": "Bearer " + sigPubSub,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                target: sigPubSubPayload.pubsub_perms.send,
                is_global_broadcast: true,
                message: JSON.stringify({
                    event: "configure",
                    data: content
                })
            })
        }
    )
})
.then(resp => {
    // Same story here with the rate limit its around 60 per minute per topic
    console.error('Relay PubSub OK', resp.status, resp.headers.get('ratelimit-remaining'), '/', resp.headers.get('ratelimit-limit'));
})
.catch(err => {
    console.error(err);
});
