const fs = require('fs');
const path = require('path');

const got = require('got');

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

// boot up sub generation
// generate app access token
// then we'll go get the userID we wanna work with

got({
    url: 'https://id.twitch.tv/oauth2/validate',
    method: 'GET',
    headers: {
        'Authorization': 'Bearer ' + app_access_token.access_token
    },
    responseType: 'json'
})
.then(resp => {
    goUser();
})
.catch(err => {
    if (err.response) {
        console.error('Error App Validate', err.response.statusCode, err.response.body);

        if (err.response.statusCode == 401) {
            regenerateApp();
        }
    } else {
        console.error('Error App Validate', err);
    }
});

function regenerateApp() {
    got({
        url: 'https://id.twitch.tv/oauth2/token',
        method: 'POST',
        searchParams: {
            client_id: client_config.client_id,
            client_secret: client_config.client_secret,
            grant_type: 'client_credentials'
        },
        responseType: 'json'
    })
    .then(resp => {
        app_access_token.access_token = resp.body.access_token;

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
        if (err.response) {
            console.error('Error regenerateApp', err.response.statusCode, err.response.body);
        } else {
            console.error('Error regenerateApp', err);
        }
    });
}
function goUser() {
    got({
        url: 'https://id.twitch.tv/oauth2/validate',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + account_config.access_token
        },
        responseType: 'json'
    })
    .then(resp => {
        go();
    })
    .catch(err => {
        if (err.response) {
            console.error('Error user validate', err.response.statusCode, err.response.body);

            if (err.response.statusCode == 401) {
                regenerateUser();
            }
        } else {
            console.error('Error user validate', err);
        }
    });
}

function regenerateUser() {
    got({
        url: 'https://id.twitch.tv/oauth2/token',
        method: 'POST',
        searchParams: {
            grant_type: 'refresh_token',
            refresh_token: account_config.refresh_token,
            client_id: client_config.client_id,
            client_secret: client_config.client_secret
        },
        responseType: 'json'
    })
    .then(resp => {
        console.log(resp.body);

        for (var k in resp.body) {
            account_config[k] = resp.body[k];
        }

        fs.writeFileSync(path.join(
            __dirname,
            'jsons',
            'config_user.json'
        ), JSON.stringify(account_config, null, 4));

        go();
    })
    .catch(err => {
        if (err.response) {
            console.error('Error regenerateUser', err.response.statusCode, err.response.body);
        } else {
            console.error('Error regenerateUser', err);
        }
    });
}

var broadcaster_id = '';
var subscriptions_to_make = {
    'channel.channel_points_custom_reward.add': 'broadcaster_user_id',
    'channel.channel_points_custom_reward.update': 'broadcaster_user_id',
    'channel.channel_points_custom_reward.remove': 'broadcaster_user_id',

    'channel.channel_points_custom_reward_redemption.add': 'broadcaster_user_id',
    'channel.channel_points_custom_reward_redemption.update': 'broadcaster_user_id'
}

function go() {
    // who am I
    got({
        url: 'https://api.twitch.tv/helix/users',
        method: 'GET',
        headers: {
            'Client-ID': client_config.client_id,
            'Authorization': 'Bearer ' + account_config.access_token
        },
        responseType: 'json'
    })
    .then(resp => {
        broadcaster_id = resp.body.data[0].id;

        // get subs that exist
        goGetSubs();
    })
    .catch(err => {
        if (err.response) {
            console.error('Error get user', err.response.statusCode, err.response.body);
        } else {
            console.error('Error get user', err);
        }
    });
}

var subs_that_exist = [];

function goGetSubs(pagination) {
    got({
        url: 'https://api.twitch.tv/helix/eventsub/subscriptions',
        method: 'GET',
        headers: {
            'client-id': client_config.client_id,
            'Authorization': 'Bearer ' + app_access_token.access_token
        },
        searchParams: {
            first: 100,
            after: (pagination ? pagination : '')
        },
        responseType: 'json'
    })
    .then(resp => {
        console.log(resp.body.data.length, '/', subs_that_exist.length, '--', resp.body.total, '/', resp.body.limit);

        for (var x=0;x<resp.body.data.length;x++) {
            subs_that_exist.push(resp.body.data[x]);
        }

        if (resp.body.pagination && resp.body.pagination.cursor) {
            goGetSubs(resp.body.pagination.cursor);
        } else {
            console.log('Got all');
            processSubs();
        }
    })
    .catch(err => {
        if (err.response) {
            console.error('Error get subs', err.response.statusCode, err.response.body);
        } else {
            console.error('Error get subs', err);
        }
    });
}

function processSubs() {
    for (var x=0;x<subs_that_exist.length;x++) {
        var topic = subs_that_exist[x].type;
        if (subscriptions_to_make.hasOwnProperty(topic)) {
            var condition = subs_that_exist[x].condition[subscriptions_to_make[topic]];

            //console.log(condition, broadcaster_id)
            if (condition == broadcaster_id) {
                // check url
                var url = subs_that_exist[x].transport.callback;
                if (url == app_access_token.callback_url) {
                    // needs some tatus manglement here
                    deleteSubscription(subs_that_exist[x].id);
                }
            }
        }
    }
}

function deleteSubscription(id) {
    got({
        url: 'https://api.twitch.tv/helix/eventsub/subscriptions',
        method: 'DELETE',
        headers: {
            'client-id': client_config.client_id,
            'Authorization': 'Bearer ' + app_access_token.access_token
        },
        searchParams: {
            id
        },
        responseType: 'json'
    })
    .then(resp => {
        console.log('Deleted', resp.body);
    })
    .catch(err => {
        if (err.response) {
            console.error('Error', err.response.statusCode, err.response.body);
        } else {
            console.error('Error', err);
        }
    });
}
