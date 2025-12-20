const fs = require('fs');
const path = require('path');

const client_config = JSON.parse(fs.readFileSync(path.join(
    __dirname,
    '..',
    'jsons',
    'config_client.json'
)));
const account_config = JSON.parse(fs.readFileSync(path.join(
    __dirname,
    '..',
    'jsons',
    'config_user.json'
)));
const app_access_token = JSON.parse(fs.readFileSync(path.join(
    __dirname,
    '..',
    'jsons',
    'app_access.json'
)));

const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const http = require('http').Server(app);
http.listen(app_access_token.port, function() {
    console.log('Server raised on', app_access_token.port);
});

app.use(bodyParser.json({
    verify: function(req, res, buf, encoding) {
        // is there a hub to verify against
        req.twitch_hub = false;
        if (req.headers && req.headers.hasOwnProperty('twitch-eventsub-message-signature')) {
            req.twitch_hub = true;

            // id for dedupe
            var id = req.headers['twitch-eventsub-message-id'];
            // check age
            var timestamp = req.headers['twitch-eventsub-message-timestamp'];

            var xHub = req.headers['twitch-eventsub-message-signature'].split('=');

            // you could do
            // req.twitch_hex = crypto.createHmac(xHub[0], config.hook_secret)
            // but we know Twitch always uses sha256
            req.twitch_hex = crypto.createHmac('sha256', app_access_token.eventsub_secret)
                .update(id + timestamp + buf)
                .digest('hex');
            req.twitch_signature = xHub[1];

            if (req.twitch_signature != req.twitch_hex) {
                console.error('Signature Mismatch');
            } else {
                console.log('Signature OK');
            }
        }
    }
}));

app
    .route('/')
    .get((req, res) => {
        console.log('Incoming Get request on /');
        res.send('There is no GET Handler');
    })
    .post((req, res) => {
        console.log('Incoming Post request on /');

        if (req.twitch_hub) {
            if (req.twitch_hex == req.twitch_signature) {
                if (req.headers['twitch-eventsub-message-type'] == 'webhook_callback_verification') {
                    if (req.body.hasOwnProperty('challenge')) {
                        console.log('Yay', req.headers);
                        res.send(encodeURIComponent(req.body.challenge));
                        return;
                    }
                }
                if (req.headers['twitch-eventsub-message-type'] == 'revocation') {
                    res.send('Ok');
                    return;
                }
                if (req.headers['twitch-eventsub-message-type'] == 'notification') {
                    res.send('Ok');
                    return;
                }
            }
        }

        res.status(403).send('Denied');
    });

// boot up sub generation
// generate app access token
// then we'll go get the userID we wanna work with

fetch(
    'https://id.twitch.tv/oauth2/validate',
    {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + app_access_token.access_token
        }
    }
)
.then(resp => {
    if (resp.status != 200) {
        regenerateApp();
    } else {
        goUser();
    }
})
.catch(err => {
    console.error('Error App Validate', err);
});

function regenerateApp() {
    let url = new URL('https://id.twitch.tv/oauth2/token');
    url.search = new URLSearchParams([
        [ 'client_id', client_config.client_id ],
        [ 'client_secret', client_config.client_secret ],
        [ 'grant_type', 'client_credentials' ]
    ]);

    fetch(
        url,
        {
            method: 'POST'
        }
    )
    .then(async (resp) => {
        if (resp.status != 200) {
            throw new Error('failed to regenerateApp: ' + resp.status);
        }

        let { access_token } = await resp.json();
        app_access_token.access_token = access_token;

        fs.writeFileSync(path.join(
            __dirname,
            '..',
            'jsons',
            'app_access.json'
        ), JSON.stringify(app_access_token, null, 4));

        console.log('Generated an app access token', app_access_token.access_token);

        goUser();
    })
    .catch(err => {
        console.error('Error regenerateApp', err);
    });
}

function goUser() {
    fetch(
        'https://id.twitch.tv/oauth2/validate',
        {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + account_config.access_token
            }
        }
    )
    .then(resp => {
        if (resp.status != 200) {
            throw new Error('Failed to validate: ' + resp.status);
        }
        go();
    })
    .catch(err => {
        console.error('Error user validate', err);
        regenerateUser();
    });
}

function regenerateUser() {
    let url = new URL('https://id.twitch.tv/oauth2/token');
    url.search = new URLSearchParams([
        [ 'client_id', client_config.client_id ],
        [ 'client_secret', client_config.client_secret ],
        [ 'grant_type', 'refresh_token' ],
        [ 'refresh_token', account_config.refresh_token ]
    ]);

    fetch(
        url,
        {
            method: 'POST'
        }
    )
    .then(async (resp) => {
        if (resp.status != 200) {
            throw new Error('failed to regenerateUser: ' + resp.status);
        }

        let body = await resp.json();

        for (var k in body) {
            account_config[k] = body[k];
        }

        fs.writeFileSync(path.join(
            __dirname,
            'jsons',
            'config_user.json'
        ), JSON.stringify(account_config, null, 4));

        go();
    })
    .catch(err => {
        console.error('Error regenerateUser', err);
        process.exit();
    });
}

// define subscriptsion to validate and make
var broadcaster_id = '';
var subscriptions_to_make = {
    'channel.channel_points_custom_reward.add': 'broadcaster_user_id',
    'channel.channel_points_custom_reward.update': 'broadcaster_user_id',
    'channel.channel_points_custom_reward.remove': 'broadcaster_user_id',

    'channel.channel_points_custom_reward_redemption.add': 'broadcaster_user_id',
    'channel.channel_points_custom_reward_redemption.update': 'broadcaster_user_id'
}
var subscriptions_valid = {}
for (var topic in subscriptions_to_make) {
    subscriptions_valid[topic] = false;
}
var subs_that_exist = [];

function go() {
    // who am I
    fetch(
        'https://api.twitch.tv/helix/users',
        {
            method: 'GET',
            headers: {
                'Client-ID': client_config.client_id,
                'Authorization': 'Bearer ' + account_config.access_token
            }
        }
    )
    .then(async (resp) => {
        if (resp.status != 200) {
            throw new Error('Failed to get user: ' + resp.status);
        }
        let { data } = await resp.body;
        broadcaster_id = data[0].id;

        // get subs that exist
        goGetSubs();
    })
    .catch(err => {
        console.error('Error get user', err);
    });
}

function goGetSubs(pagination) {
    let url = new URL('https://api.twitch.tv/helix/eventsub/subscriptions');
    let p = [
        [ 'first', 100 ]
    ]
    if (pagination) {
        p.push([
            'after', pagination
        ]);
    }
    url.search = new URLSearchParams(p);

    fetch(
        url,
        {
            method: 'GET',
            headers: {
                'client-id': client_config.client_id,
                'Authorization': 'Bearer ' + app_access_token.access_token
            }
        }
    )
    .then(async (resp) => {
        if (resp.status != 200) {
            throw new Error('Failed to get subs: ' + resp.status);
        }
        let { data, total, max_total_cost, pagination } = await resp.body();
        console.log(data.length, '/', subs_that_exist.length, '--', total, '/', max_total_cost);

        for (var x=0;x<data.length;x++) {
            subs_that_exist.push(data[x]);
        }

        if (pagination && pagination.cursor) {
            goGetSubs(pagination.cursor);
        } else {
            console.log('Got all');
            processSubs();
        }
    })
    .catch(err => {
        console.error('Error get subs', err);
    });
}

function processSubs() {
    for (var x=0;x<subs_that_exist.length;x++) {
        var topic = subs_that_exist[x].type;
        //console.log(topic, subscriptions_valid.hasOwnProperty(topic));
        if (subscriptions_valid.hasOwnProperty(topic)) {
            var condition = subs_that_exist[x].condition[subscriptions_to_make[topic]];

            //console.log(condition, broadcaster_id)
            if (condition == broadcaster_id) {
                // check url
                var url = subs_that_exist[x].transport.callback;
                if (url == app_access_token.callback_url) {
                    // needs some tatus manglement here
                    subscriptions_valid[topic] = true;
                }
            }
        }
    }

    console.log(subscriptions_valid);

    for (var topic in subscriptions_valid) {
        if (!subscriptions_valid[topic]) {
            console.log('Create', topic, subscriptions_to_make[topic]);
            createSubscription(topic, subscriptions_to_make[topic]);
        }
    }
}

function createSubscription(type, thing) {
    var condition = {};
    condition[thing] = broadcaster_id;

    var payload = {
        type,
        version: "1",
        condition,
        transport: {
            method: 'webhook',
            callback: app_access_token.callback_url,
            secret: app_access_token.eventsub_secret
        }
    };
    //console.log(json);process.exit();

    fetch(
        'https://api.twitch.tv/helix/eventsub/subscriptions',
        {
            method: 'POST',
            headers: {
                'client-id': client_config.client_id,
                'Authorization': 'Bearer ' + app_access_token.access_token
            },
            body: JSON.stringify(payload)
        }
    )
    .then(async resp => {
        // success is a 202
        console.log(await resp.json());
    })
    .catch(err => {
        console.error('Error', err);
    });
}
