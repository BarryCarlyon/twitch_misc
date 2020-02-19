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
// Got is used for making HTTP/API Calls
const got = require('got');
// jsonwebtoken is used for creating an decoding JWT's
const jwt = require('jsonwebtoken');

// Prepare the Extension secret for use
// it's base64 encoded and we need to decode it first
const ext_secret = Buffer.from(config.extension_secret, 'base64');

// Lets prepare the signatures for saving config and sending to PubSub
// The EXP is being set to 60 seconds in the future
// which is a bit long but it suffices
const sigConfigPayload = {
  "exp": Math.floor(new Date().getTime() / 1000) + 60,
  "user_id": config.owner,
  "role": "external",
}
const sigConfig = jwt.sign(sigConfigPayload, ext_secret);

const sigPubSubPayload = {
    "exp": Math.floor(new Date().getTime() / 1000) + 60,
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
var data = JSON.stringify({
    "config_key_1": "config_value_1",
    "config_key_2": "config_value_2",
    "config_key_3": "config_value_3"
});

// We have now prepared the Signatures and data
// We'll now store this in the global segment
// This means its' available for all instances of the extension
// an instance is a channel the extension is installed upon

got({
    url: "https://api.twitch.tv/extensions/"
        + config.client_id
        + "/configurations/",
    method: "PUT",
    headers: {
        "Client-ID": config.client_id,
        "Content-Type": "application/json",
        "Authorization": "Bearer " + sigConfig
    },
    body: JSON.stringify({
        segment: "global",
        content: data
    }),
    gzip: true
})
.then(resp => {
    // console log out the useful information
    // keeping track of rate limits is important
    // you can only set the config 12 times a minute per segment
    console.error('Store Config OK', resp.statusCode, resp.headers['ratelimit-ratelimiterextensionsetconfiguration-remaining'], '/', resp.headers['ratelimit-ratelimiterextensionsetconfiguration-limit']);

    // we don't care too much about the statusCode here
    // but you should test it for a 204

    // lets also send the same information to pubsub
    // so running instances get the update

    // we'll pubsub to the all/global message line
    return got({
        url: "https://api.twitch.tv/extensions/message/all",
        method: "POST",
        headers: {
            "Client-ID": config.client_id,
            "Content-Type": "application/json",
            "Authorization": "Bearer " + sigPubSub
        },
        body: JSON.stringify({
            "message": JSON.stringify({
                event: "configure",
                data
            }),
            "content_type": "application/json",
            "targets": [
                "global"
            ]
        }),
        gzip: true
    })
})
.then(resp => {
    // Same story here with the rate limit its around 60 per minute per topic
    console.error('Relay PubSub OK', resp.statusCode, resp.headers['ratelimit-ratelimitermessagesbychannel-remaining'], '/', resp.headers['ratelimit-ratelimitermessagesbychannel-limit']);
})
.catch(err => {
    console.error(err, err.response.body);
});
