require('dotenv').config()

let start = new Date();

async function run() {
    // token validate
    let validate_resp = await fetch(
        'https://id.twitch.tv/oauth2/validate',
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.TWITCH_TOKEN}`,
                'Accept': 'application/json'
            }
        }
    );

    if (validate_resp.status != 200) {
        console.log('Failed to Validate Token');
        return;
    }

    let validate_data = await validate_resp.json();

    console.log('Token Validated', validate_data.user_id);

    // obtained the moderator user ID
    process.env.TWITCH_USER_ID = validate_data.user_id;
    // obtained clientID from the response
    process.env.TWITCH_CLIENT_ID = validate_data.client_id;

    // lets go
    chatters();
}

run();

async function chatters(after) {
    let chatters_url = new URL('https://api.twitch.tv/helix/chat/chatters');
    let chatters_params = [
        [ 'broadcaster_id', process.env.TWITCH_STREAMER_CHANNEL ],
        [ 'moderator_id',   process.env.TWITCH_USER_ID ],
        [ 'first',          1000 ]
    ];
    if (after) {
        chatters_params.push([ 'after', after ]);
    }
    chatters_url.search = new URLSearchParams(chatters_params).toString();

    let chatters_resp = await fetch(
        chatters_url,
        {
            method: 'GET',
            headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${process.env.TWITCH_TOKEN}`,
                'Accept': 'application/json'
            }
        }
    );

    if (chatters_resp.status != 200) {
        console.log('Failed to get chatters', chatters_resp.status, await chatters_resp.text());
        return;
    }

    let chatters_data = await chatters_resp.json();
    console.log('Loaded', chatters_resp.headers.get('ratelimit-remaining'), chatters_resp.headers.get('ratelimit-limit'), chatters_data.data.length, chatters_data.total);

    processPage(chatters_data.data);
    if (chatters_data.hasOwnProperty('pagination')) {
        if (chatters_data.pagination.hasOwnProperty('cursor')) {
            chatters(chatters_data.pagination.cursor);
        }
    }
}

async function processPage(many_items) {
    if (many_items.length > 0) {
        let items = many_items.splice(0, 100);
        //console.log(items[0]);

        getUsers(items);
        processPage(many_items);
    }
}

let users = [];
async function getUsers(items) {
    let lookup = [];
    items.forEach(item => {
        lookup.push([ 'login', item.user_login ]);
    });

    //console.log(lookup);

    let user_url = new URL('https://api.twitch.tv/helix/users');
    user_url.search = new URLSearchParams(lookup).toString();

    //console.log(user_url);process.exit();

    let user_resp = await fetch(
        user_url,
        {
            method: 'GET',
            headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${process.env.TWITCH_TOKEN}`,
                'Accept': 'application/json'
            }
        }
    );

    console.log('Loaded B', user_resp.headers.get('ratelimit-remaining'), user_resp.headers.get('ratelimit-limit'));

    let user_data = await user_resp.json();

    user_data.data.forEach((user) => {
        users.push(user);
    });

    console.log('Users', users.length);

    fin();
}

let end = '';
let done = false;
function fin() {
    end = new Date();

    clearTimeout(done);
    done = setTimeout(() => {
        console.log('Complete', (end.getTime() - start.getTime()) / 1000);
    }, 5000);
}
