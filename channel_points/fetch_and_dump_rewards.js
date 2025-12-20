const fs = require('fs');
const path = require('path');

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
    goFetch();
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

    goFetch();
}

async function goFetch() {
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

    let url = new URL('https://api.twitch.tv/helix/channel_points/custom_rewards');
    url.search = new URLSearchParams([
        [ 'broadcaster_id', body.data[0].id ],
        [ 'only_manageable_rewards', 1 ]
    ]).toString();

    let rewardsResp = await fetch(
        url,
        {
            method: 'GET',
            headers: {
                'Client-ID': client_config.client_id,
                'Authorization': `Bearer ${account_config.access_token}`,
                'Accept': 'application/json'
            }
        }
    )
    if (rewardsResp.status != 200) {
        console.error('Error', rewardsResp.status, await rewardsResp.text());
        return;
    }

    let rewardsBody = await rewardsResp.json();
    fs.writeFileSync(path.join(
        __dirname,
        'jsons',
        'custom_rewards.json'
    ), JSON.stringify(rewardsBody, null, 4));
    console.log('Fetch and wrote', rewardsBody.data.length);
}

entry();