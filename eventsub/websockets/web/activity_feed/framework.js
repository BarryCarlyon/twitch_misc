// These are set for the GitHub Pages Example
// Substitute as needed
var client_id = 'hozgh446gdilj5knsrsxxz8tahr3koz';
var redirect = window.location.origin + '/twitch_misc/';
var access_token = '';
var socket_space = '';
var session_id = '';
var my_user_id = '';

document.getElementById('authorize').setAttribute('href', 'https://id.twitch.tv/oauth2/authorize?client_id=' + client_id + '&redirect_uri=' + encodeURIComponent(redirect) + '&response_type=token&scope=user:read:chat');

if (document.location.hash && document.location.hash != '') {
    log('Checking for token');
    var parsedHash = new URLSearchParams(window.location.hash.slice(1));
    if (parsedHash.get('access_token')) {
        log('Got a token');
        processToken(parsedHash.get('access_token'));
    }
}

function log(line) {
    console.log(line);
}

function processToken(token) {
    access_token = token;

    authorize.style.display = 'none';//remove link to avoid relinks....

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
            socket_space = new initSocket(true);
            // and build schnanaigans
            socket_space.on('connected', (id) => {
                log(`Connected to WebSocket with ${id}`);
                session_id = id;
                my_user_id = resp.data[0].id;

                requestHooks(resp.data[0].id, my_user_id);
            });

            socket_space.on('session_silenced', () => {
                document.getElementById('keepalive').textContent = 'Session mystery died due to silence detected';
            });
            socket_space.on('session_keepalive', () => {
                document.getElementById('keepalive').textContent = new Date();
            });

            socket_space.on('channel.chat.notification', runLineNotification);
            socket_space.on('channel.chat.message', runLineMessage);
        })
        .catch(err => {
            console.log(err);
            log('Error with Users Call');
        });
}

function addUser(username) {
    let url = new URL('https://api.twitch.tv/helix/users');
    url.search = new URLSearchParams([['login', username]]).toString();

    fetch(
        url,
        {
            "headers": {
                "Client-ID": client_id,
                "Authorization": `Bearer ${access_token}`
            }
        }
    )
        .then(resp => resp.json())
        .then(resp => {
            log(`Got ${resp.data[0].id} for ${username}`);
            requestHooks(resp.data[0].id, my_user_id);
            loadCheermotes(resp.data[0].id);
        })
        .catch(err => {
            console.log(err);
            log('Error with Users Call');
        });
}


function requestHooks(broadcaster_user_id, user_id) {
    let topics = {
        'channel.chat.notification': { version: "1", condition: { broadcaster_user_id, user_id } },
        'channel.chat.message': { version: "1", condition: { broadcaster_user_id, user_id } }
    }

    log(`Spawn Topics for ${user_id}`);

    for (let type in topics) {
        log(`Attempt create ${type} - ${broadcaster_user_id} via ${user_id}`);
        let { version, condition } = topics[type];

        fetch(
            'https://api.twitch.tv/helix/eventsub/subscriptions',
            {
                "method": "POST",
                "headers": {
                    "Client-ID": client_id,
                    "Authorization": `Bearer ${access_token}`,
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
                    document.getElementById('subscriptions_cost').textContent = `${resp.total}/${resp.total_cost}/${resp.max_total_cost}`;
                }
            })
            .catch(err => {
                console.log(err);
                log(`Error with eventsub Call ${type} Call: ${err.message ? err.message : ''}`);
            });
    }
}

document.getElementById('subscriptions_refresh').addEventListener('click', (e) => {
    fetchSubs();
});

let subscriptions = document.getElementById('subscriptions');
function fetchSubs(after) {
    let url = new URL('https://api.twitch.tv/helix/eventsub/subscriptions');
    let params = {
        first: 100,
        status: 'enabled'
    };
    if (after) {
        params.after = after;
    }

    url.search = new URLSearchParams(params).toString();

    fetch(
        url,
        {
            "method": "GET",
            "headers": {
                "Client-ID": client_id,
                "Authorization": `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            }
        }
    )
        .then(resp => resp.json())
        .then(resp => {

            subscriptions.textContent = '';

            resp.data.forEach(sub => {
                let tr = document.createElement('tr');
                subscriptions.append(tr);

                add(tr, sub.id);
                add(tr, sub.type);

                let keys = Object.keys(sub.condition);
                if (sub.condition[keys[0]]) {
                    add(tr, sub.condition[keys[0]]);
                } else {
                    add(tr, sub.condition[keys[1]]);
                }
                add(tr, sub.cost);

                add(tr, sub.status);

                let td = document.createElement('td');
                tr.append(td);
                td.textContent = 'Delete';
                td.classList.add('delete_button');
                td.addEventListener('click', (e) => {
                    deleteSub(sub.id)
                        .then(resp => {
                            console.log('Delete', resp.status);

                            if (resp.status) {
                                td.textContent = 'Deleted';
                            } else {
                                td.textContent = `Err ${resp.status}`;
                            }
                        })
                        .catch(err => {
                            console.log(err);
                            log(`Error with eventsub delete`);
                        });
                });
            });

            document.getElementById('subscriptions_cost').textContent = `${resp.total}/${resp.total_cost}/${resp.max_total_cost}`;

            if (resp.pagination) {
                if (resp.pagination.cursor) {
                    fetchSubs(resp.pagination.cursor);
                }
            }
        })
        .catch(err => {
            console.log(err);
            log(`Error with eventsub Fetch`);
        });
}

function add(tr, text) {
    let td = document.createElement('td');
    td.textContent = text;
    tr.append(td);
}

function deleteSub(id) {
    let url = new URL('https://api.twitch.tv/helix/eventsub/subscriptions');
    url.search = new URLSearchParams([['id', id]]).toString();

    return fetch(
        url,
        {
            "method": "DELETE",
            "headers": {
                "Client-ID": client_id,
                "Authorization": `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            }
        }
    )
}

document.getElementById('form').addEventListener('submit', (e) => {
    e.preventDefault();
    let username = document.getElementById('add_user').value;
    log(`Lets lookup and add ${username}`);
    addUser(username);
    document.getElementById('add_user').value = '';
});