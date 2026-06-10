// go populate this with a client_id
var client_id = 'hozgh446gdilj5knsrsxxz8tahr3koz';
var redirect = window.location.origin + '/twitch_misc/';

// setup a memory space for the token/userID
var access_token = '';
var user_id = '';
var poll_id = '';
var socket_space = false;

let status = document.getElementById('status');

// setup authorise link
document.getElementById('authorize').setAttribute('href', 'https://id.twitch.tv/oauth2/authorize?client_id=' + client_id + '&redirect_uri=' + encodeURIComponent(redirect) + '&response_type=token&scope=channel:manage:polls');

async function processToken(token) {
    access_token = token;

    status.textContent = 'Got Token. Loading Things';

    // we need the userID
    let user_resp = await fetch(
        'https://api.twitch.tv/helix/users',
        {
            method: 'GET',
            headers: {
                'Client-ID': client_id,
                'Authorization': `Bearer ${access_token}`,
                'Accept': 'application/json'
            }
        }
    );

    if (user_resp.status != 200) {
        status.textContent = `Failed to obtain User information ${user_resp.status} - ${await user_resp.text()}`;
        return;
    }

    let user_data = await user_resp.json();
    if (user_data.data.length != 1) {
        status.textContent = `Failed to obtain a User`;
        return;
    }

    user_id = user_data.data[0].id;
    status.textContent = `Hello ${user_id} - ${user_data.data[0].login}`;

    socket_space = new initSocket(true);
    socket_space.on('connected', (id) => {
        log(`Connected to WebSocket with ${id}`);
        requestHooks(id, user_id);
    });
    socket_space.on('session_keepalive', () => {
        document.getElementById('keepalive').textContent = new Date();
    });

        socket_space.on('channel.poll.begin', (msg) => {
            writeESLog('begin');
            let { metadata, payload } = msg;
            let { event } = payload;
            drawNewPoll(event);
        });
        socket_space.on('channel.poll.progress', (msg) => {
            writeESLog('progress');
            let { metadata, payload } = msg;
            let { event } = payload;
            drawUpdatePoll(event);
        });
        socket_space.on('channel.poll.end', (msg) => {
            writeESLog('end');
            let { metadata, payload } = msg;
            let { event } = payload;
            drawEndPoll(event);
        });
}

document.getElementById('add_choice').addEventListener('click', (e) => {
    let choices = document.getElementById('poll_choices').querySelectorAll('input');
    if (choices.length < 5) {
        // add one
        let copy = choices[choices.length - 1].cloneNode();
        copy.value = '';
        document.getElementById('poll_choices').append(copy);
    }
});
document.getElementById('poll_form').addEventListener('submit', (e) => {
    e.preventDefault();

    submitPoll();
});
document.getElementById('poll_end').addEventListener('click', endPoll);

async function endPoll() {
    let poll_resp = await fetch(
        `https://api.twitch.tv/helix/polls`,
        {
            method: 'PATCH',
            headers: {
                'Client-ID': client_id,
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                broadcaster_id: user_id,
                id: poll_id,
                status: 'TERMINATED'
            })
        }
    );

    if (poll_resp.status == 200) {
        status.textContent = `TERMINATED a poll`;
    } else {
        status.textContent = `Failed to TERMINATED a poll ${poll_resp.status} - ${await poll_resp.text()}`;
    }
}

async function submitPoll() {
    let payload = {
        broadcaster_id: user_id,
        title: document.getElementById('poll_title').value,
        duration: parseInt(document.getElementById('poll_duration').value),
        choices: [],
        channel_points_voting_enabled: false
    }

    let poll_channel_points = parseInt(document.getElementById('poll_channel_points').value);
    if (!isNaN(poll_channel_points) && poll_channel_points > 0) {
        payload.channel_points_voting_enabled = true;
        payload.channel_points_per_vote = poll_channel_points;
    }

    let choices = document.getElementById('poll_choices').querySelectorAll('input');
    choices.forEach(choice => {
        let text = choice.value.trim();

        if (text.length > 0) {
            payload.choices.push({
                title: text
            });
        }
    });

    status.textContent = `Creating a poll`;

    let poll_resp = await fetch(
        'https://api.twitch.tv/helix/polls',
        {
            method: 'POST',
            headers: {
                'Client-ID': client_id,
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        }
    );

    if (poll_resp.status == 200) {
        status.textContent = `Created a poll`;

        // store poll ID so I can kill it
        let poll_data = await poll_resp.json();
        poll_id = poll_data.data[0].id;
    } else {
        status.textContent = `Failed to create a poll ${poll_resp.status} - ${await poll_resp.text()}`;
    }
}


function requestHooks(session_id, user_id) {
    let topics = {
        'channel.poll.begin':       { version: 1, condition: { broadcaster_user_id: user_id } },
        'channel.poll.progress':    { version: 1, condition: { broadcaster_user_id: user_id } },
        'channel.poll.end':         { version: 1, condition: { broadcaster_user_id: user_id } },
    }

    log(`Spawn Topics for ${user_id}`);

    for (let type in topics) {
        log(`Attempt create ${type} - ${user_id}`);
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
                log(`Error with eventsub Call ${type} Call: ${resp.message ? resp.message : ''}`);
            } else {
                log(`Created ${type}`);
            }
        })
        .catch(err => {
            console.log(err);
            log(`Error with eventsub Call ${type} Call: ${err.message ? err.message : ''}`);
        });
    }
}



function drawNewPoll(poll) {
    let { title, choices, started_at, ends_at } = poll;

    let right = document.getElementById('right');
    right.textContent = '';

    let h2 = document.createElement('h2');
    h2.textContent = title;
    right.append(h2);

    let tbl = document.createElement('table');
    right.append(tbl);

    choices.forEach(choice => {
        let { id, title } = choice;

        let r = tbl.insertRow();
        let t = r.insertCell();
        t.textContent = title;
        let s = r.insertCell();
        s.textContent = 0;
        s.setAttribute('id', `poll_choice_${id}`);
    });
}
function drawUpdatePoll(poll) {
    let { choices } = poll;

    let total_votes = 0;
    choices.forEach(choice => {
        let { id, title, channel_points_votes, votes } = choice;
        total_votes += channel_points_votes + votes;

        let el = document.getElementById(`poll_choice_${id}`);
        el.textContent = (channel_points_votes + votes);
    });
}
function drawEndPoll(poll) {
    let { status } = poll;
    if (status == "archived") {
        return;
    }

    drawUpdatePoll(poll);

    let winner = { score: 0, id: '', title: '' };

    let { choices } = poll;
    choices.forEach(choice => {
        let { id, title, channel_points_votes, votes } = choice;
        let score = channel_points_votes + votes;
        if (score > winner.score) {
            winner = {
                score: score,
                id,
                title
            }
        }
    });

    let el = document.getElementById(`poll_choice_${winner.id}`);
    if (el) {
        el.classList.add('winner');
    }
}

function writeESLog(evt) {
    let l = document.createElement('p');
    l.textContent = `${new Date().toString()} - ${evt}`;
    eventsub_log.prepend(l);
}
