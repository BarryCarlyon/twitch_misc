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
    let token_url = new URL('https://id.twitch.tv/oauth2/token');
    token_url.search = new URLSearchParams([
        [ 'client_id',      client_config.client_id ],
        [ 'client_secret',  client_config.client_secret ],
        [ 'grant_type',     'client_credentials' ]
    ]).toString();

    fetch(
        token_url,
        {
            method: 'POST',
        }
    )
    .then(async resp => {
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
        if (err.response) {
            console.error('Error regenerateApp', err.response.statusCode, err.response.body);
        } else {
            console.error('Error regenerateApp', err);
        }
    });
}
function goUser() {
    fetch(
        "https://id.twitch.tv/oauth2/validate",
        {
            method: "GET",
            headers: {
                Authorization: "Bearer " + account_config.access_token
            }
        }
    )
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
        console.error('Error regenerateUser', err);
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
        if (err.response) {
            console.error('Error get user', err.response.statusCode, err.response.body);
        } else {
            console.error('Error get user', err);
        }
    });
}

var subs_that_exist = [];


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
    fetch(
        `https://api.twitch.tv/helix/eventsub/subscriptions?id=${id}`,
        {
            method: 'DELETE',
            headers: {
                'client-id': client_config.client_id,
                'Authorization': 'Bearer ' + app_access_token.access_token
            }
        }
    )
    .then(resp => {
        console.log('Deleted', resp.status);
    })
    .catch(err => {
        console.error('Error', err);
    });
}
