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
        'Authorization': 'Bearer ' + account_config.access_token
    },
    responseType: 'json'
})
.then(resp => {
    go();
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

        go();
    })
    .catch(err => {
        if (err.response) {
            console.error('Error', err.response.statusCode, err.response.body);
        } else {
            console.error('Error', err);
        }
    });
}

function go() {
//        prompt: '',
    var item = {
        title: '',
        cost: 0,
        is_enabled: false,
        is_enabled: true,
        background_color: '#000000'
    }
    rl.question('Title> ', (dat) => {
        item.title = dat;
        rl.question('Prompt> ', (p) => {
            if (p && p.length > 0) {
                item.prompt = p;
            }

            rl.question('Cost> ', (c) => {
                item.cost = parseInt(c);

                rl.question('Color> no #/hex ', (c) => {
                    item.background_color = '#' + c;

                rl.question('Pause> 0/1 ', (c) => {
                    item.is_paused = (c == "1" ? true : false);

                    create(item);
                });
                });
            });
        })
    });
}

function create(item) {
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
        console.log(resp.body.data[0]);
console.log('send', item);
        return got({
            url: 'https://api.twitch.tv/helix/channel_points/custom_rewards',
            method: 'POST',
            headers: {
                'Client-ID': client_config.client_id,
                'Authorization': 'Bearer ' + account_config.access_token
            },
            searchParams: {
                broadcaster_id:resp.body.data[0].id
            },
            json: item,
            responseType: 'json'
        })
    })
    .then(resp => {
        console.log('Did', resp.body);

        go();
    })
    .catch(err => {
        if (err.response) {
            console.error('Error', err.response.statusCode, err.response.body);
        } else {
            console.error('Error', err);
        }

        go();
    });
}
