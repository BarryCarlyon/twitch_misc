const fs = require('fs');
const path = require('path');

// Load configuation
const config = JSON.parse(fs.readFileSync(path.join(
    __dirname,
    'config.json'
)));

// the channelID we want to send a message to
let channel_id = "";

// Require depedancies
// Fetch is used for making HTTP/API Calls
// we use current node fetch as included
// jsonwebtoken is used for creating an decoding JWT's
const jwt = require('jsonwebtoken');

// Prepare the Extension secret for use
// it's base64 encoded and we need to decode it first
const ext_secret = Buffer.from(config.extension_secret, 'base64');

const sigPubSubPayload = {
    "exp": Math.floor(new Date().getTime() / 1000) + 4,
    "user_id": config.owner,
    "role": "external",
    channel_id,
    "pubsub_perms": {
        "send": [
            "broadcast"
        ]
    }
}
const sigPubSub = jwt.sign(sigPubSubPayload, ext_secret);

var content = JSON.stringify({
    "config_key_1": "config_value_1",
    "config_key_2": "config_value_2",
    "config_key_3": "config_value_3"
});

fetch(
    "https://api.twitch.tv/helix/extensions/pubsub",
    {
        method: "POST",
        headers: {
            "Client-ID": config.client_id,
            "Authorization": `Bearer ${sigPubSub}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            target: sigPubSubPayload.pubsub_perms.send,
            broadcaster_id: channel_id,
            is_global_broadcast: false,
            message: JSON.stringify({
                event: "configure",
                data: content
            })
        })
    }
)
.then(async resp => {
    // Same story here with the rate limit its around 60 per minute per topic
    if (resp.status != 204) {
        console.error('Relay Error', await resp.text());
        return;
    }
    console.error('Relay PubSub OK', resp.status, resp.headers.get('ratelimit-remaining'), '/', resp.headers.get('ratelimit-limit'));
})
.catch(err => {
    console.error('Relay Error', err);
});
