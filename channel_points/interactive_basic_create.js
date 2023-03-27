const fs = require('fs');
const path = require('path');

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
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

async function entry() {
    let resp = await fetch(
        'https://id.twitch.tv/oauth2/validate',
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${account_config.access_token}`,
                'Accept': 'application/json'
            }
        }
    )
    if (resp.status != 200) {
        regenerate();
        return;
    }
    go();
}

async function regenerate() {
    let url = new URL('https://id.twitch.tv/oauth2/token');
    url.search = new URLSearchParams([
        [ 'grant_type', 'refresh_token' ],
        [ 'refresh_token', account_config.refresh_token ],
        [ 'client_id', client_config.client_id ],
        [ 'client_secret', client_config.client_secret ]
    ]).toString();

    let resp = await fetch(
        url,
        {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            }
        }
    );
    if (resp.status != 200) {
        console.error('Error', resp.status, await resp.text());
        return;
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
}

function go() {
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

async function create(item) {
    let userResp = await fetch(
        'https://api.twitch.tv/helix/users',
        {
            method: 'GET',
            headers: {
                'Client-ID': client_config.client_id,
                'Authorization': `Bearer ${account_config.access_token}`,
                'Accept': 'application/json'
            }
        }
    );
    if (userResp.status != 200) {
        console.error('Error', userResp.status, await userResp.text());
        return;
    }

    let body = await userResp.json();
    console.log(body);
    let broadcaster_id = body.data[0].id;

    console.log('send', item);

    let url = new URL('https://api.twitch.tv/helix/channel_points/custom_rewards');
    url.search = new URLSearchParams([
        [ 'broadcaster_id', broadcaster_id ],
        [ 'only_manageable_rewards', 1 ]
    ]).toString();

    let resp = await fetch(
        url,
        {
            method: 'POST',
            headers: {
                'Client-ID': client_config.client_id,
                'Authorization': `Bearer ${account_config.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
        }
    );
    
    console.log('Did', resp.status, (resp.status != 200 ? await resp.text() : ''));

    go();
}

entry();