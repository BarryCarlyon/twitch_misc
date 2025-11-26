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

                cell('Cannot', tr);
                let info = cell('', tr);
                var d = document.createElement('div');
                info.append(d);
                d.textContent = reward.id;
                var d = document.createElement('div');
                info.append(d);
                d.textContent = reward.title;

                let itd = cell('', tr);
                itd.style.textAlign = 'center';
                let iti = document.createElement('img');
                itd.append(iti);
                if (reward.image && reward.image.url_1x) {
                    iti.setAttribute('src', reward.image.url_1x);
                } else {
                    //default_image
                    iti.setAttribute('src', reward.default_image.url_1x);
                }
                itd.style.backgroundColor = reward.background_color;

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

                cell(reward.prompt, tr);

                var td = tr.insertCell();
                colorCell((reward.is_user_input_required ? 'IsReq' : ''), td, reward.is_user_input_required);

                let edit = cell('', tr);
                edit.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/></svg>';
                edit.classList.add('edit_reward');
                edit.setAttribute('data-id', reward.id);

                let del = cell('', tr);
                del.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16"><path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/></svg>';
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
                el.classList.add('can_manage');
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
            //getRewards();
            // is trigger from evnetsub
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

function updateDisables() {
    if (is_max_per_stream_enabled.checked) {
        max_per_stream.removeAttribute('disabled');
    } else {
        max_per_stream.setAttribute('disabled', 'disabled');
    }
    if (is_max_per_user_per_stream_enabled.checked) {
        max_per_user_per_stream.removeAttribute('disabled');
    } else {
        max_per_user_per_stream.setAttribute('disabled', 'disabled');
    }
    if (is_global_cooldown_enabled.checked) {
        global_cooldown_seconds.removeAttribute('disabled');
    } else {
        global_cooldown_seconds.setAttribute('disabled', 'disabled');
    }
}


output.addEventListener('click', (e) => {
    let rewardID = e.target.getAttribute('data-id');
    console.log('clicked on output', rewardID);
    if (!rewardID) {
        return;
    }

    if (e.target.classList.contains('delete_reward')) {
        if (confirm('Are you sure you wish to delete?')) {
            deleteReward(rewardID);
        }
    } else if (e.target.classList.contains('edit_reward')) {
        startEdit(rewardID);
    } else if (e.target.getAttribute('data-toggle')) {
        // we have a jerb
        let toggle = e.target.getAttribute('data-toggle');

        // build a patch
        togglePatcher(toggle, rewardID);
    } else if (e.target.getAttribute('data-update')) {
        let pl = {};
        pl[e.target.getAttribute('data-update')] = document.getElementById(e.target.getAttribute('data-linked')).value;
        patcher(pl, rewardID);
    }
});

// this function toggles asingle value
// to the opposite of what it currently is on the API
// so can differ from the current UI if desynced
async function togglePatcher(field, id) {
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
// edit UI
closemodal.addEventListener('click', (e) => {
    e.preventDefault();
    myshittymodal.classList.remove('show');
});
async function startEdit(rewardID) {
    // get current values
    let url = new URL('https://api.twitch.tv/helix/channel_points/custom_rewards');
    url.search = new URLSearchParams([
        [ 'broadcaster_id', user_id ],
        [ 'id', rewardID ]
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
    let reward = data[0];

    document.querySelector('[name="rewardID"]').value = reward.id;
    // pop modal and populate values
    document.querySelector('[name="title"]').value = reward.title;
    document.querySelector('[name="prompt"]').value = reward.prompt;
    document.querySelector('[name="cost"]').value = reward.cost;
    document.querySelector('[name="background_color"]').value = reward.background_color;

    document.querySelector('[name="is_enabled"]').checked = reward.is_enabled;
    document.querySelector('[name="is_user_input_required"]').checked = reward.is_user_input_required;
    document.querySelector('[name="should_redemptions_skip_request_queue"]').checked = reward.should_redemptions_skip_request_queue;

    document.querySelector('[name="is_max_per_stream_enabled"]').checked = reward.max_per_stream_setting.is_enabled;
    document.querySelector('[name="max_per_stream"]').value = reward.max_per_stream_setting.max_per_stream;
    document.querySelector('[name="is_max_per_user_per_stream_enabled"]').checked = reward.max_per_user_per_stream_setting.is_enabled;
    document.querySelector('[name="max_per_user_per_stream"]').value = reward.max_per_user_per_stream_setting.max_per_user_per_stream;
    document.querySelector('[name="is_global_cooldown_enabled"]').checked = reward.global_cooldown_setting.is_enabled;
    document.querySelector('[name="global_cooldown_seconds"]').value = reward.global_cooldown_setting.global_cooldown_seconds;

    updateDisables();
    // show
    myshittymodal.classList.add('show');
}

mknew.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('[name="rewardID"]').value = '';
    // blank
    document.querySelector('[name="title"]').value = '';
    document.querySelector('[name="prompt"]').value = '';
    document.querySelector('[name="cost"]').value = '';
    document.querySelector('[name="background_color"]').value = '';

    document.querySelector('[name="is_enabled"]').checked = false;
    document.querySelector('[name="is_user_input_required"]').checked = false;
    document.querySelector('[name="should_redemptions_skip_request_queue"]').checked = false;

    document.querySelector('[name="is_max_per_stream_enabled"]').checked = false;
    document.querySelector('[name="max_per_stream"]').value = '';
    document.querySelector('[name="is_max_per_user_per_stream_enabled"]').checked = false;
    document.querySelector('[name="max_per_user_per_stream"]').value = '';
    document.querySelector('[name="is_global_cooldown_enabled"]').checked = false;
    document.querySelector('[name="global_cooldown_seconds"]').value = '';

    updateDisables();

    myshittymodal.classList.add('show');
});
createorupdate.addEventListener('submit', (e) => {
    e.preventDefault();

    let payload = {
        title: document.querySelector('[name="title"]').value,
        cost: document.querySelector('[name="cost"]').value,

        prompt: document.querySelector('[name="prompt"]').value,
        is_enabled: document.querySelector('[name="is_enabled"]').checked,

        background_color: document.querySelector('[name="background_color"]').value,

        is_user_input_required: document.querySelector('[name="is_user_input_required"]').checked,

        is_max_per_stream_enabled: document.querySelector('[name="is_max_per_stream_enabled"]').checked,
        is_max_per_user_per_stream_enabled: document.querySelector('[name="is_max_per_user_per_stream_enabled"]').checked,
        is_global_cooldown_enabled: document.querySelector('[name="is_global_cooldown_enabled"]').checked,

        should_redemptions_skip_request_queue: document.querySelector('[name="should_redemptions_skip_request_queue"]').checked
    }

    //if (payload.is_max_per_stream_enabled) {
        payload.max_per_stream = parseInt(document.querySelector('[name="max_per_stream"]').value);
    //}
    //if (payload.is_max_per_user_per_stream_enabled) {
        payload.max_per_user_per_stream = parseInt(document.querySelector('[name="max_per_user_per_stream"]').value);
    //}
    //if (payload.is_global_cooldown_enabled) {
        payload.global_cooldown_seconds = parseInt(document.querySelector('[name="global_cooldown_seconds"]').value);
    //}

    // simple sanitize blanks
    for (let key in payload) {
        if (payload[key] === '') {
            delete payload[key];
        }
    }

    // decide what to do
    let rewardID = document.querySelector('[name="rewardID"]').value;

    if (rewardID) {
        // patch
        patcher(payload, rewardID)
    } else {
        // post
        poster(payload)
    }
    myshittymodal.classList.remove('show');
});

// send request
async function poster(pl) {
    let url = new URL('https://api.twitch.tv/helix/channel_points/custom_rewards');
    url.search = new URLSearchParams([
        [ 'broadcaster_id', user_id ]
    ]).toString();

    message('Attempting to create a reward');
    let postReq = await fetch(
        url,
        {
            "method": "POST",
            "headers": {
                "Client-ID": client_id,
                "Authorization": `Bearer ${access_token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(pl)
        }
    );
    if (postReq.status != 200) {
        // balls
        message(`Reward Create Error: ${await postReq.text()}`);
    }
    // is trigger from evnetsub
    //getRewards();
}
async function patcher(pl, id) {
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
    // is trigger from evnetsub
    //getRewards();
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

    socket_space.on('channel.channel_points_custom_reward.add', getRewards);
    socket_space.on('channel.channel_points_custom_reward.update', getRewards);
    socket_space.on('channel.channel_points_custom_reward.remove', getRewards);
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
