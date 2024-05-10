// go populate this with a client_id
var client_id = 'hozgh446gdilj5knsrsxxz8tahr3koz';
var redirect = window.location.origin + '/twitch_misc/';
// setup a memory space for the token/userID
var access_token = '';
var user_id = '';

var loading = document.getElementById('loading');
var output = document.getElementById('output');

document.getElementById('authorize').setAttribute('href', 'https://id.twitch.tv/oauth2/authorize?client_id=' + client_id + '&redirect_uri=' + encodeURIComponent(redirect) + '&response_type=token&scope=channel:read:redemptions+channel:manage:redemptions')

function provideAccessToken(token) {
    fetch(
        'https://id.twitch.tv/oauth2/validate',
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        }
    )
    .then(resp => resp.json())
    .then(resp => {
        if (resp.client_id) {
            client_id = resp.client_id;
            processToken(token);

            return;
        }

        document.getElementById('loading').textContent = 'The token seems invalid';
    })
    .catch(err => {
        console.log(err);
        document.getElementById('loading').textContent = 'An Error Occured loading Validating Token: error';
    });
}
provide_access_token.addEventListener('submit', (e) => {
    e.preventDefault();
    provideAccessToken(input_access_token.value);
});

function processToken(token) {
    access_token = token;

    message('Got Token');
    message('Loading User from Token');

    fetch(
        'https://api.twitch.tv/helix/users',
        {
            "headers": {
                "Client-ID": client_id,
                "Authorization": `Bearer ${access_token}`
            }
        }
    )
    .then(resp => resp.json())
    .then(resp => {
        if (resp.data.length == 1) {
            message('Got User ID');

            user_id = resp.data[0].id;

            getRewards();
            // create eventsub for real time updates?
            eventsub();
        } else {
            document.getElementById('loading').textContent = 'An Error Occured loading Profile: not returned';
        }
    })
    .catch(err => {
        console.log(err);
        document.getElementById('loading').textContent = 'An Error Occured loading Profile: error';
    });
}

function message(words) {
    let p = document.createElement('p');
    document.getElementById('loading').prepend(p);
    p.textContent = words;
}

function getRewards() {
    message('Loading Rewards');

    output.textContent = '';

    let params = [
        [ 'broadcaster_id', user_id ],
        [ 'first', 100 ]
    ];

    let url = new URL('https://api.twitch.tv/helix/channel_points/custom_rewards');
    url.search = new URLSearchParams(params).toString();

    fetch(
        url,
        {
            "method": "GET",
            "headers": {
                "Client-ID": client_id,
                "Authorization": `Bearer ${access_token}`
            }
        }
    )
    .then(resp => resp.json())
    .then(resp => {
        message(`Obtained ${resp.data.length} rewards`);
        if (resp.data.length >= 1) {

            resp.data.forEach(reward => {
                let tr = document.createElement('tr');
                output.append(tr);

                tr.setAttribute('id', reward.id);
                tr.style.backgroundColor = reward.background_color;

                cell('Cannot', tr);
                cell(reward.id, tr);

                let itd = cell('', tr);
                if (reward.image && reward.image.url_1x) {
                    let iti = document.createElement('img');
                    itd.append(iti);
                    iti.setAttribute('src', reward.image.url_1x);
                }

                let titleCell = cell('', tr);
                    var d = document.createElement('div');
                    titleCell.append(d);
                    var i = document.createElement('input');
                    d.append(i);
                    i.value = reward.title;
                    i.setAttribute('id', `field_${reward.id}_title`);
                    var u = document.createElement('input');
                    d.append(u);
                    u.setAttribute('type', 'button');
                    u.setAttribute('data-linked', `field_${reward.id}_title`);
                    u.setAttribute('data-update', 'title');
                    u.setAttribute('data-id', reward.id);
                    u.value = 'U';
                cell(reward.cost, tr);

                var td = tr.insertCell();
                let enabler = colorCell((reward.is_enabled ? 'Enabled' : 'Disabled'), td, reward.is_enabled);
                enabler.setAttribute('data-toggle', 'is_enabled');
                enabler.setAttribute('data-id', reward.id);
                var td = tr.insertCell();
                let pauser = colorCell((reward.is_paused ? 'Paused' : 'Running'), td, !reward.is_paused);
                pauser.setAttribute('data-toggle', 'is_paused');
                pauser.setAttribute('data-id', reward.id);
                cell((reward.should_redemptions_skip_request_queue ? 'Skips' : 'Need Mod'), tr);
                let promptCell = cell('', tr);
                    var d = document.createElement('div');
                    promptCell.append(d);
                    var i = document.createElement('input');
                    d.append(i);
                    i.value = reward.prompt;
                    i.setAttribute('id', `field_${reward.id}_prompt`);
                    var u = document.createElement('input');
                    d.append(u);
                    u.setAttribute('type', 'button');
                    u.setAttribute('data-linked', `field_${reward.id}_prompt`);
                    u.setAttribute('data-update', 'prompt');
                    u.setAttribute('data-id', reward.id);
                    u.value = 'U';
                var td = tr.insertCell();
                colorCell((reward.is_user_input_required ? 'IsReq' : ''), td, reward.is_user_input_required);

                let del = cell('x', tr);
                del.classList.add('delete_reward');
                del.setAttribute('data-id', reward.id);
            });

            getRewardsManage();
        } else {
            message('An Error Occured loading Rewards: no rewards');
        }
    })
    .catch(err => {
        console.log(err);
        message('An Error Occured loading Rewards: error');
    });
}

function getRewardsManage() {
    message('Loading Rewards Can Manage');

    let params = [
        [ 'broadcaster_id', user_id ],
        [ 'first', 100 ],
        [ 'only_manageable_rewards', 'true' ]
    ];

    let url = new URL('https://api.twitch.tv/helix/channel_points/custom_rewards');
    url.search = new URLSearchParams(params).toString();

    fetch(
        url,
        {
            "method": "GET",
            "headers": {
                "Client-ID": client_id,
                "Authorization": `Bearer ${access_token}`
            }
        }
    )
    .then(resp => resp.json())
    .then(resp => {
        message(`Obtained ${resp.data.length} manageable rewards`);

        resp.data.forEach((reward) => {
            let { id } = reward;
            let el = document.getElementById(id);
            if (el) {
                el.querySelector('td').textContent = 'Can';
                el.querySelector('td').style.backgroundColor = 'green';
            }
        });
    })
    .catch(err => {
        console.log(err);
        message('An Error Occured loading Manageable Rewards: error');
    });
}

function colorCell(text, td, value) {
    td.textContent = text;
    if (value) {
        td.style.backgroundColor = 'green';
    } else {
        td.style.backgroundColor = 'red';
    }
    return td;
}

function cell(value, row) {
    let td = document.createElement('td');
    row.append(td);
    td.textContent = value;
    return td;
}


document.getElementById('reward_create_form').addEventListener('submit', (e) => {
    e.preventDefault();

    let payload = {
        title: reward_title.value,
        cost: reward_cost.value,

        prompt: reward_prompt.value,
        is_enabled: reward_is_enabled.checked,

        background_color: reward_background_color.value,

        is_user_input_required: reward_is_user_input_required.checked,

        is_max_per_stream_enabled: is_max_per_stream_enabled.checked,
        is_max_per_user_per_stream_enabled: is_max_per_user_per_stream_enabled.checked,
        is_global_cooldown_enabled: is_global_cooldown_enabled.checked,

        should_redemptions_skip_request_queue: reward_should_redemptions_skip_request_queue.checked
    }
    //max_per_stream
    //max_per_user_per_stream
    //global_cooldown_seconds
    if (payload.is_max_per_stream_enabled) {
        payload.max_per_stream = max_per_stream.value;
    }
    if (payload.is_max_per_user_per_stream_enabled) {
        payload.max_per_user_per_stream = max_per_user_per_stream.value;
    }
    if (payload.is_global_cooldown_enabled) {
        payload.global_cooldown_seconds = global_cooldown_seconds.value;
    }

    for (key in payload) {
        if (payload[key] === '') {
            delete payload[key];
        }
    }

    console.log(payload);//return;

    let url = new URL('https://api.twitch.tv/helix/channel_points/custom_rewards');
    url.search = new URLSearchParams([
        [ 'broadcaster_id', user_id ]
    ]).toString();

    message('Attempting to create a reward');
    fetch(
        url,
        {
            "method": "POST",
            "headers": {
                "Client-ID": client_id,
                "Authorization": `Bearer ${access_token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        }
    )
    .then(r => r.json().then(data => ({ status: r.status, body: data })))
    .then(resp => {
        message(`Reward Create Result: ${resp.status}`);
        if (resp.status != 204) {
            message(`Response: ${resp.body.message}`);
        }
        getRewards();
    })
    .catch(err => {
        console.log(err);
        message('An Error Occured creating a reward: error');
    });
});

function deleteReward(id) {
    message(`Attempt to delete reward ${id}`);
    let url = new URL('https://api.twitch.tv/helix/channel_points/custom_rewards');
    url.search = new URLSearchParams([
        [ 'broadcaster_id', user_id ],
        [ 'id', id ]
    ]);

    fetch(
        url,
        {
            "method": "DELETE",
            "headers": {
                "Client-ID": client_id,
                "Authorization": `Bearer ${access_token}`,
            }
        }
    )
    .then(async resp => {
        message(`Reward Delete Result: ${resp.status}`);
        if (resp.status == 204) {
            getRewards();
        } else {
            message(`Reward Delete Result: ${await resp.text()}`);
        }
    })
    .catch(err => {
        console.log(err);
        message('An Error Occured deleting a reward: error');
    });
}

// ui
is_max_per_stream_enabled.addEventListener('change', (e) => {
    if (e.target.checked) {
        max_per_stream.removeAttribute('disabled');
    } else {
        max_per_stream.setAttribute('disabled', 'disabled');
    }
});
max_per_stream.setAttribute('disabled', 'disabled');

is_max_per_user_per_stream_enabled.addEventListener('change', (e) => {
    if (e.target.checked) {
        max_per_user_per_stream.removeAttribute('disabled');
    } else {
        max_per_user_per_stream.setAttribute('disabled', 'disabled');
    }
});
max_per_user_per_stream.setAttribute('disabled', 'disabled');

is_global_cooldown_enabled.addEventListener('change', (e) => {
    if (e.target.checked) {
        global_cooldown_seconds.removeAttribute('disabled');
    } else {
        global_cooldown_seconds.setAttribute('disabled', 'disabled');
    }
});
global_cooldown_seconds.setAttribute('disabled', 'disabled');

output.addEventListener('click', (e) => {
    let rewardID = e.target.getAttribute('data-id');

    if (e.target.classList.contains('delete_reward')) {
        deleteReward(e.target.getAttribute('data-id'));
    } else if (e.target.getAttribute('data-toggle')) {
        // we have a jerb
        let toggle = e.target.getAttribute('data-toggle');

        // build a patch
        togglePatcher(rewardID, toggle);
    } else if (e.target.getAttribute('data-update')) {
        let pl = {};
        pl[e.target.getAttribute('data-update')] = document.getElementById(e.target.getAttribute('data-linked')).value;
        patcher(rewardID, pl);
    }
});
async function togglePatcher(id, field) {
    // get current value
    let url = new URL('https://api.twitch.tv/helix/channel_points/custom_rewards');
    url.search = new URLSearchParams([
        [ 'broadcaster_id', user_id ],
        [ 'id', id ]
    ]);

    let currentReq = await fetch(
        url,
        {
            "method": 'GET',
            "headers": {
                "Client-ID": client_id,
                "Authorization": `Bearer ${access_token}`,
            }
        }
    );
    if (currentReq.status != 200) {
        message(`Reward Update GET Error: ${await currentReq.text()}`);
        // balls
        return;
    }
    let currentData = await currentReq.json();
    // find it
    let { data } = currentData;
    if (data.length != 1) {
        message(`Reward Update Error: Failed to get current value`);
        return;
    }
    // find the field
    let currentValue = data[0][field];
    // invert it
    let pl = {};
    pl[field] = !currentValue;
    console.log('Patching', pl);
    // and patch it
    patcher(id, pl);
}

async function patcher(id, pl) {
    let url = new URL('https://api.twitch.tv/helix/channel_points/custom_rewards');
    url.search = new URLSearchParams([
        [ 'broadcaster_id', user_id ],
        [ 'id', id ]
    ]);

    let patchReq = await fetch(
        url,
        {
            "method": 'PATCH',
            "headers": {
                "Client-ID": client_id,
                "Authorization": `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pl)
        }
    );
    if (patchReq.status != 200) {
        // balls
        message(`Reward Update Error: ${await patchReq.text()}`);
    }
    getRewards();
}

function eventsub() {
    let socket_space = new initSocket(true);
    socket_space.on('connected', (id) => {
        message(`Connected to WebSocket with ${id}`);
        requestHooks(id, user_id);
    });
    socket_space.on('session_keepalive', () => {
        console.log('keepalive', new Date());
    });

    socket_space.on('channel.channel_points_custom_reward.update', ({ metadata, payload }) => {
        let { event } = payload;

        let { id } = event;
        message(`Process a channel.channel_points_custom_reward.update on ${id}`);

        let { image, title, cost } = event;

        let { is_enabled, is_paused } = event;
        let { should_redemptions_skip_request_queue } = event;

        let { prompt, is_user_input_required } = event;

        let row = document.getElementById(id);
        if (!row) {
            // not found
            return;
        }

        let cells = row.querySelectorAll('td');

        // 2 is the image
        //cells[2].IMAGE
        cells[2].textContent = '';
        if (image && image.url_1x) {
            let iti = document.createElement('img');
            cells[2].append(iti);
            iti.setAttribute('src', image.url_1x);
        }

        // 3 is the title
        let inp = document.getElementById(`field_${id}_title`);
        if (inp) {
            inp.vlaue = title;
        }
        // 4 is the price
        cells[4].textContent = cost;
        // 5 is enabled 6 is paused
        colorCell((is_enabled ? 'Enabled' : 'Disabled'), cells[5], is_enabled);
        colorCell((is_paused ? 'Paused' : 'Running'), cells[6], !is_paused);
        // 7 skip
        cells[7].textContent = (should_redemptions_skip_request_queue ? 'Skips' : 'Need Mod');
        // 8 prompt
        //cells[8].textContent = prompt;
        let promptCell = document.getElementById(`field_${id}_prompt`);
        promptCell.value = prompt;
        // 9 user input
        colorCell((is_user_input_required ? 'IsReq' : ''), cells[9], is_user_input_required);

    });
}


function requestHooks(session_id, user_id) {
    message('Requesting Topics');
    let topics = {
        'channel.channel_points_custom_reward.add':     { version: 1, condition: { broadcaster_user_id: user_id } },
        'channel.channel_points_custom_reward.update':  { version: 1, condition: { broadcaster_user_id: user_id } },
        'channel.channel_points_custom_reward.remove':  { version: 1, condition: { broadcaster_user_id: user_id } },
    }

    message(`Spawn Topics for ${user_id}`);

    for (let type in topics) {
        message(`Attempt create ${type} - ${user_id}`);
        let { version, condition } = topics[type];

        fetch(
            'https://api.twitch.tv/helix/eventsub/subscriptions',
            {
                "method": "POST",
                "headers": {
                    "Client-ID": client_id,
                    "Authorization": "Bearer " + access_token,
                    'Content-Type': 'application/json'
                },
                "body": JSON.stringify({
                    type,
                    version,
                    condition,
                    transport: {
                        method: "websocket",
                        session_id
                    }
                })
            }
        )
        .then(resp => resp.json())
        .then(resp => {
            if (resp.error) {
                message(`Error with eventsub Call ${type} Call: ${resp.message ? resp.message : ''}`);
            } else {
                message(`Eventsub Created ${type}`);
            }
        })
        .catch(err => {
            console.log(err);
            message(`Error with eventsub Call ${type} Call: ${err.message ? err.message : ''}`);
        });
    }
}