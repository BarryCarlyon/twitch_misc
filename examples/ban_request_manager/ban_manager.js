// go populate this with a client_id
var client_id = 'hozgh446gdilj5knsrsxxz8tahr3koz';
var redirect = window.location.origin + '/twitch_misc/';

// setup a memory space for the token/userID
// and the state machine
var access_token = '';
var user_id = '';
var channel_id = '';
var unban_request_id = '';

let status = document.getElementById('status');

// setup authorise link
document.getElementById('authorize').setAttribute('href', 'https://id.twitch.tv/oauth2/authorize?client_id=' + client_id + '&redirect_uri=' + encodeURIComponent(redirect) + '&response_type=token&scope=user:read:moderated_channels+moderator:read:unban_requests+moderator:manage:unban_requests');

async function processToken(token) {
    access_token = token;

    status.textContent = 'Got Token. Loading Things';

    // who are we
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

    getPageChannels();
}

// get "targets"
async function getPageChannels(after) {
    let channels_url = new URL('https://api.twitch.tv/helix/moderation/channels');
    let p = [
        [ 'user_id', user_id ],
        [ 'first', 100 ]
    ]
    if (after) {
        p.push([ 'after', after ]);
    }
    channels_url.search = new URLSearchParams(p);
    let channels_req = await fetch(
        channels_url,
        {
            method: 'GET',
            headers: {
                'Client-ID': client_id,
                'Authorization': `Bearer ${access_token}`,
                'Accept': 'application/json'
            }
        }
    );

    if (channels_req.status != 200) {
        status.textContent = `Failed to get channels you mod: ${channels_req.status} - ${await channels_req.text()}`;
        return;
    }

    let channels_resp = await channels_req.json();
    let { data, pagination } = channels_resp;

    // draw targets
    channel_select.textContent = '';
    channel_select.removeAttribute('disabled');

    let opt = document.createElement('option');
    opt.value = user_id;
    opt.textContent = 'You';
    channel_select.append(opt);

    data.forEach(channel => {
        let { broadcaster_id, broadcaster_name } = channel;

        let opt = document.createElement('option');
        opt.value = broadcaster_id;
        opt.textContent = broadcaster_name;
        channel_select.append(opt);
    });

    // next?
    channel_id = user_id;
    initIt();
}

channel_select.addEventListener('change', (e) => {
    channel_id = e.target.value;
    console.log('CID', channel_id);
    status.textContent = `Loading into ${channel_id}`;

    initIt();
});

async function initIt() {
    // open up websocket for eventsub for real time

    resetUnbanRequests();
}

async function resetUnbanRequests() {
    requests.textContent = '';
    // load current data
    loadUnbanRequests();
}
async function loadUnbanRequests(after) {
    let unbans_url = new URL('https://api.twitch.tv/helix/moderation/unban_requests');
    let p = [
        [ 'broadcaster_id', channel_id ],
        [ 'moderator_id', user_id ],
        [ 'status', 'pending' ],
        [ 'first', 100 ]
    ]
    if (after) {
        p.push([ 'after', after ]);
    }
    unbans_url.search = new URLSearchParams(p);

    let unbans_req = await fetch(
        unbans_url,
        {
            method: 'GET',
            headers: {
                'Client-ID': client_id,
                'Authorization': `Bearer ${access_token}`,
                'Accept': 'application/json'
            }
        }
    );

    if (unbans_req.status != 200) {
        status.textContent = `Failed to get requests: ${unbans_req.status} - ${await unbans_req.text()}`;
        return;
    }

    let { data, pagination } = await unbans_req.json();

    data.forEach(unban => {
        let { broadcaster_login, user_login, user_name } = unban;
        let { id, text } = unban;
        let { created_at } = unban;

        let dsp = '';

        // add to le stack
        let dat = new Date(created_at);
        let y = dat.getFullYear();
        let m = dat.getMonth() + 1;
        let d = dat.getDate();

        dsp += `${y}/${m}/${d}`;

        dsp += ' ';

        let h = dat.getHours();
        if (h < 10) { h = `0${h}`; }
        let i = dat.getMinutes();
        if (i < 10) { i = `0${i}`; }
        dsp += `${h}:${i}`;

        let r = requests.insertRow();
        var c = r.insertCell();
        c.textContent = user_name;
        var c = r.insertCell();
        c.textContent = dsp;
        var c = r.insertCell();
        c.textContent = text;

        var c = r.insertCell();
        var b = document.createElement('a');
        b.href = `https://www.twitch.tv/popout/${broadcaster_login}/viewercard/${user_login}?popout=`;
        b.textContent = 'UserCard';
        b.target = '_blank';
        c.append(b);

        var c = r.insertCell();
        var b = document.createElement('div');
        b.textContent = 'Act';
        b.classList.add('alink');
        b.setAttribute('data-ban-id', id);
        c.append(b);

        b.addEventListener('click', (e) => {
            act.showModal();
            //act_act.setAttribute('data-ban-id', e.target.getAttribute('data-ban-id'));
            unban_request_id = e.target.getAttribute('data-ban-id');
        });
    });
}

act_accept.addEventListener('click', (e) => {
    processRequest('approved');
});
act_reject.addEventListener('click', (e) => {
    processRequest('denied');
});
act_noact.addEventListener('click', (e) => {
    act.close();
    unban_request_id = '';
});

async function processRequest(status) {
    // add a spinner?
    let resolution_text = resolution_text_text.value;

    let take_action_req = await fetch(
        'https://api.twitch.tv/helix/moderation/unban_requests',
        {
            method: 'PATCH',
            headers: {
                'Client-ID': client_id,
                'Authorization': `Bearer ${access_token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                broadcaster_id: channel_id,
                moderator_id: user_id,
                unban_request_id,
                status,
                resolution_text
            })
        }
    );

    act.close();
    unban_request_id = '';

    if (take_action_req.status != 200) {
        status.textContent = `Failed to take action ${status} - ${take_action_req.status} - ${await take_action_req.text()}`;
        return;
    }
    status.textContent = 'Completed the requested action';

    // trigger reload?
    resetUnbanRequests();
}
