const fs = require('fs');
const path = require('path');

const got = require('got');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const client_config = JSON.parse(fs.readFileSync(path.join(
    __dirname,
    'jsons',
    'config_client.json'
)));
const account_config = JSON.parse(fs.readFileSync(path.join(
    __dirname,
    'jsons',
    'config_user.json'
)));

// validate n refresh key
console.log('Run with', client_config.client_id, account_config.access_token);

got({
    url: 'https://id.twitch.tv/oauth2/validate',
    method: 'GET',
    headers: {
        'Authorization': 'OAuth ' + account_config.access_token
    },
    responseType: 'json'
})
.then(resp => {
    goFetch();
})
.catch(err => {
    if (err.response) {
        console.error('Error', err.response.statusCode, err.response.body);

        if (err.response.statusCode == 401) {
            regenerate();
        }
    } else {
        console.error('Error', err);
    }
});

function regenerate() {
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

        goFetch();
    })
    .catch(err => {
        if (err.response) {
            console.error('Error', err.response.statusCode, err.response.body);
        } else {
            console.error('Error', err);
        }
    });
}

function goFetch() {
    var broadcaster_id = '';

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
        //console.log(resp.body.data[0]);
        broadcaster_id = resp.body.data[0].id;

        return got({
            url: 'https://api.twitch.tv/helix/channel_points/custom_rewards',
            method: 'GET',
            headers: {
                'Client-ID': client_config.client_id,
                'Authorization': 'Bearer ' + account_config.access_token
            },
            searchParams: {
                broadcaster_id,
                only_manageable_rewards: 1
            },
            responseType: 'json'
        })
    })
    .then(resp => {
        console.log('Found', resp.body.data.length, 'for', broadcaster_id);

        rl.question('Enable or disable (1/0)> ', dir => {
            dir = parseInt(dir);

            var enable = false;
            if (dir === 1) {
                enable = true;
            } else if (dir === 0) {
                enable = false;
            } else {
                console.log('Enter 1/0');
                goFetch();
                return;
            }

            rl.close();

            for (var x=0;x<resp.body.data.length;x++) {
                toggleReward(broadcaster_id, resp.body.data[x], enable);
            }
        })
    })
    .catch(err => {
        if (err.response) {
            console.error('Error', err.response.statusCode, err.response.body);
        } else {
            console.error('Error', err);
        }
    });
}

function toggleReward(broadcaster_id, reward, is_enabled) {
    got({
        url: 'https://api.twitch.tv/helix/channel_points/custom_rewards',
        method: 'PATCH',
        headers: {
            'Client-ID': client_config.client_id,
            'Authorization': 'Bearer ' + account_config.access_token
        },
        searchParams: {
            broadcaster_id,
            id: reward.id
        },
        json: {
            is_enabled
        },
        responseType: 'json'
    })
    .then(resp => {
        console.log('Updated', resp.body);
    })
    .catch(err => {
        if (err.response) {
            console.error('Error', err.response.statusCode, err.response.body);
        } else {
            console.error('Error', err);
        }
    });
}
