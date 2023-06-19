// These are set for the GitHub Pages Example
// Substitute as needed
var client_id = 'hozgh446gdilj5knsrsxxz8tahr3koz';
var redirect = `https://${window.location.host}/twitch_misc/`;
var access_token = '';

let commonHeaders = {};
let whoami = {};
let broadcaster_id = '';
let moderator_id = '';
let active_session_id = '';
let active_session_slot_count = 0;

let user_name_cache = {};

document.getElementById('authorize').setAttribute('href', 'https://id.twitch.tv/oauth2/authorize?client_id=' + client_id + '&redirect_uri=' + encodeURIComponent(redirect) + '&response_type=token&scope=channel:manage:guest_star+moderator:manage:guest_star');

async function getUserData(username) {
    let url = new URL('https://api.twitch.tv/helix/users');
    if (username) {
        url.search = new URLSearchParams([
            [ 'login', username ]
        ]);
    }
    let resp = await fetch(
        url,
        {
            method: 'GET',
            headers: {
                ...commonHeaders
            }
        }
    );
    if (resp.status != 200) {
        status_bar.textContent = 'Failed to user lookup: ' + await resp.text();
        return;
    }
    let data = await resp.json();
    if (data.data.length == 1) {
        return data.data[0];
    }
    status_bar.textContent = 'Failed to find user';
}

async function processToken(token) {
    access_token = token;

    commonHeaders = {
        'Accept': 'application/json',
        'Client-ID': client_id,
        'Authorization': `Bearer ${access_token}`
    }

    status_bar.classList.add('show');
    status_bar.textContent = 'Loading';

    let moderator = await getUserData();
    moderator_id = moderator.id;

    whoami = moderator;
    let els = document.querySelectorAll('.whoami');
    els.forEach(el => {
        el.textContent = `You are: ${moderator.display_name}`;
    })

    selector.style.display = 'block';
}


async function moderateChannel(e) {
    e.preventDefault();

    status_bar.textContent = `Loking up ${moderate_channel_name.value}`;
    let user = await getUserData(moderate_channel_name.value);

    broadcaster_id = user.id;
    let els = document.querySelectorAll('.target_channel');
    els.forEach(el => {
        el.textContent = `${user.display_name}`;
    })

    initGuestStar();
}
moderate_channel_form.addEventListener('submit', moderateChannel);
moderate_channel.addEventListener('click', moderateChannel);
control_channel.addEventListener('click', (e) => {
    broadcaster_id = moderator_id;

    let els = document.querySelectorAll('.target_channel');
    els.forEach(el => {
        el.textContent = `${whoami.display_name}`;
    })

    initGuestStar();
});

// control functions
controls.addEventListener('click', async (e) => {
    let func = e.target.getAttribute('data-function');
    if (!func) {
        return;
    }
    e.preventDefault();

    switch (func) {
        case 'start':
            var url = new URL('https://api.twitch.tv/helix/guest_star/session');
            url.search = new URLSearchParams([
                [ 'broadcaster_id', broadcaster_id ]
            ]);

            var req = await fetch(
                url,
                {
                    method: 'POST',
                    headers: {
                        ...commonHeaders
                    }
                }
            );
            if (req.status != 200) {
                status_bar.textContent = 'Failed to Start Guest Star Session: ' + await req.text();
                return;
            }

            var resp = await req.json();
            if (resp.data.length != 1) {
                status_bar.textContent = 'Not one Guest Star Session';
                return;
            }
            //var { id } = resp.data[0];
            //active_session_id = id;

            status_bar.textContent = 'Started a Guest Star Session';
            console.log('Skipping the load');
            //loadSession();
            return;
        case 'stop':
            var url = new URL('https://api.twitch.tv/helix/guest_star/session');
            url.search = new URLSearchParams([
                [ 'broadcaster_id', broadcaster_id ],
                [ 'session_id', active_session_id ]
            ]);

            var req = await fetch(
                url,
                {
                    method: 'DELETE',
                    headers: {
                        ...commonHeaders
                    }
                }
            );
            if (req.status != 200) {
                status_bar.textContent = 'Failed to Stop Guest Star Session: ' + await req.text();
                return;
            }
            status_bar.textContent = 'Stopped Guest Star Session';
            //loadSession();
            break;

        case 'refresh_invites':
            refreshInvites();
            break;
        case 'slot_refresh':
            loadSession();
            break;
        case 'delete_invite':
            var url = new URL('https://api.twitch.tv/helix/guest_star/invites');
            url.search = new URLSearchParams([
                [ 'broadcaster_id', broadcaster_id ],
                [ 'moderator_id', moderator_id ],
                [ 'session_id', active_session_id ],
                [ 'guest_id', e.target.getAttribute('data-user-id') ]
            ]);

            var req = await fetch(
                url,
                {
                    method: 'DELETE',
                    headers: {
                        ...commonHeaders
                    }
                }
            );
            if (req.status != 204) {
                status_bar.textContent = 'Failed to Delete Invite: ' + await req.text();
                return;
            }
            status_bar.textContent = 'Deleted Invite';
            break;

        case 'slot_mute':
            slot_id = e.target.getAttribute('data-slot-id');
            reviseSlotLive(slot_id, { is_audio_enabled: false });
            break;
        case 'slot_unmute':
            slot_id = e.target.getAttribute('data-slot-id');
            reviseSlotLive(slot_id, { is_audio_enabled: true });
            break;
        case 'slot_camoff':
            slot_id = e.target.getAttribute('data-slot-id');
            reviseSlotLive(slot_id, { is_video_enabled: false });
            break;
        case 'slot_camon':
            slot_id = e.target.getAttribute('data-slot-id');
            reviseSlotLive(slot_id, { is_video_enabled: true });
            break;
    }
});

let eventSubController;
// go
async function initGuestStar() {
    selector.style.display = 'none';
    controls.style.display = 'block';

    // check
    if (broadcaster_id != moderator_id) {
        // only the caster can start/stop
        master_controls.classList.add('disableit');
    } else {
        master_controls.classList.remove('disableit');
    }

    // lets connect to eventsub
    stauts_bar = 'Spawning EventSub';
    eventSubController = new initSocket(true);
    eventSubController.on('connected', async (id) => {
        status_bar.textContent = `Connected to EventSub WebSockets with ${id}`;

        console.log(eventSubController.eventsub.twitch_websocket_id);

        // subscribe
        if (broadcaster_id == moderator_id) {
            requstEventSub('channel.guest_star_session.begin', 'beta', { broadcaster_user_id: broadcaster_id });
            requstEventSub('channel.guest_star_session.end', 'beta', { broadcaster_user_id: broadcaster_id });
        }
        let resp = await requstEventSub('channel.guest_star_guest.update', 'beta', { broadcaster_user_id: broadcaster_id, moderator_user_id: moderator_id });
        if (resp.status == 403) {
            // assume not a guest star moderator
            status_bar.textContent = 'You do not appear to be a Guest Star Moderator for this channel';
            controls.classList.add('disableit');
            return;
        }
        controls.classList.remove('disableit');

        requstEventSub('channel.guest_star_slot.update', 'beta', { broadcaster_user_id: broadcaster_id, moderator_user_id: moderator_id });
        requstEventSub('channel.guest_star_settings.update', 'beta', { broadcaster_user_id: broadcaster_id, moderator_user_id: moderator_id });
    });

    bindEventSubTriggers();

    // lets load current status
    loadSession();
    loadSettings();
}

async function requstEventSub(type, version, condition) {
    return fetch(
        'https://api.twitch.tv/helix/eventsub/subscriptions',
        {
            method: "POST",
            headers: {
                ...commonHeaders,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type,
                version,
                condition,
                transport: {
                    method: "websocket",
                    session_id: eventSubController.eventsub.twitch_websocket_id
                }
            })
        }
    );
}

async function loadSession() {
    let url = new URL('https://api.twitch.tv/helix/guest_star/session');
    url.search = new URLSearchParams([
        [ 'broadcaster_id', broadcaster_id ],
        [ 'moderator_id', moderator_id ]
    ]);
    let request = await fetch(
        url,
        {
            method: 'GET',
            headers: {
                ...commonHeaders
            }
        }
    );
    if (request.status != 200) {
        status_bar.textContent = 'Failed to get Session Status: ' + await resp.text();
        return;
    }
    let session = await request.json();
    console.log('The session count is', session.data.length);
    if (session.data.length != 1) {
        // no session
        master_control.setAttribute('data-function', 'start');
        master_control.value = 'Start Guest Star';
        return;
    }
    master_control.setAttribute('data-function', 'stop');
    master_control.value = 'End Guest Star';

    let { id } = session.data[0];
    active_session_id = id;

    // process slots
    let { guests } = session.data[0];
    buildGuests(guests);

    // spawn invite check
    initInvite();
}

/*
Hole in eventsub!
*/
function initInvite() {
    // check invites
    refreshInvites();

    console.log('Suppress initinvite refresh timer');
    return;

    clearInterval(refreshInvitesTimer);
    refreshInvitesTimer = setInterval(refreshInvites, 5000);
}

let refreshInvitesTimer = false;
async function refreshInvites() {
    if (active_session_id == '') {
        return;
    }
    console.log('Doing a refreshInvites');

    let url = new URL('https://api.twitch.tv/helix/guest_star/invites');
    url.search = new URLSearchParams([
        [ 'broadcaster_id', broadcaster_id ],
        [ 'moderator_id', moderator_id ],
        [ 'session_id', active_session_id ]
    ]);

    let invite = await fetch(
        url,
        {
            method: 'GET',
            headers: {
                ...commonHeaders
            }
        }
    );
    let invited = await invite.json();

    invite_manager_list.textContent = '';

    if (invited.data.length == 0) {
        return;
    }

    let user_ids = [];

    for (let x=0;x<invited.data.length;x++) {
        let { user_id, invited_at, status } = invited.data[x];

        let r = invite_manager_list.insertRow();
        r.setAttribute('id', `invite_for_${user_id}`);
        r.setAttribute('data-user-id', user_id);
        var c = r.insertCell();
        c.setAttribute('data-user-id', user_id);

        if (user_name_cache.hasOwnProperty(user_id)) {
            c.textContent = user_name_cache[user_id].display_name;
        } else {
            user_ids.push([ 'id', user_id ]);
            c.textContent = user_id;
        }

        var c = r.insertCell();
        c.setAttribute('data-invite-state', user_id);
        c.textContent = status;
        var c = r.insertCell();

        //c.textContent = invited_at;
        let ago = new Date().getTime() - new Date(invited_at).getTime();
        let seconds = Math.floor(ago / 1000);
        let mins = Math.floor(seconds / 60);
        seconds = seconds - (mins * 60);

        mins = mins < 10 ? `0${mins}` : mins;
        seconds = seconds < 10 ? `0${seconds}` : seconds;

        c.textContent = `${mins}:${seconds} ago`;

        var c = r.insertCell();
        let kill_invite = document.createElement('button');
        //kill_invite.textContent = 'Del';
        kill_invite.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16"><path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/></svg>';
        kill_invite.setAttribute('data-user-id', user_id);
        kill_invite.setAttribute('data-function', 'delete_invite');
        c.append(kill_invite);

        var c = r.insertCell();
        let slot = document.createElement('select');
        c.append(slot);
        slot.setAttribute('id', `invite_to_slot_for_${user_id}`);
        if (status.toLowerCase() != 'ready') {
            slot.style.display = 'none';
        }

        //slot.setAttribute('data-user-id', user_id);
        var b = document.createElement('option');
        b.textContent = `Assign Slot`;
        slot.append(b);

        for (var slot_id=1;slot_id<=5;slot_id++) {
            let opt = document.createElement('option');
            opt.value = slot_id;
            opt.textContent = `Slot ${slot_id}`
            slot.append(opt);
        }

        slot.addEventListener('change', slotUser);
    }

    if (user_ids.length == 0) {
        return;
    }

    let users = new URL('https://api.twitch.tv/helix/users');
    users.search = new URLSearchParams(user_ids);

    let userLookup = await fetch(
        users,
        {
            method: 'GET',
            headers: {
                ...commonHeaders
            }
        }
    );
    let userData = await userLookup.json();
    userData.data.forEach(user => {
        let { id, display_name } = user;
        document.querySelector(`td[data-user-id="${id}"]`).textContent = display_name;

        user_name_cache[id] = user;
    });
}

async function buildGuests(guests) {
    status_bar.textContent = 'Checking the Guest List';

    let slot_ref = {};
    let user_ids = [];

    let actives = slots.querySelectorAll('.active');
    for (var x=0;x<actives.length;x++) {
        actives[x].classList.remove('active');
    }
    let inactives = slots.querySelectorAll('.inactive');
    for (var x=0;x<inactives.length;x++) {
        inactives[x].classList.remove('active');
    }

    for (var x=0;x<guests.length;x++) {
        // slot_id 0 is the streamer
        // and local video
        let { slot_id, user_id, is_live } = guests[x];
        if (slot_id != 0) {
            let row = document.getElementById(`slot_${slot_id}`);
            row.setAttribute('data-user-id', user_id);
            let sel = document.getElementById(`slot_${slot_id}_live`);
            if (is_live) {
                sel.value = 'live';
            } else {
                sel.value = 'backstage';
            }

            let mov = document.getElementById(`slot_${slot_id}_move`);
            //mov.setAttribute('data-user-id', user_id);

            if (user_name_cache.hasOwnProperty(user_id)) {
                document.getElementById(`slot_${slot_id}_guest`).textContent = user_name_cache[user_id].display_name;
            } else {
                slot_ref[user_id] = document.getElementById(`slot_${slot_id}_guest`);
                user_ids.push([ 'id', user_id ]);
            }

            let { audio, video, volume } = guests[x];
            // mic
            let mic = document.getElementById(`slot_${slot_id}_mic`);
            if (mic) {
                if (audio.is_host_enabled) {
                    mic.classList.add('active');
                    mic.classList.remove('inactive');
                } else {
                    mic.classList.remove('active');
                    mic.classList.add('inactive');
                }
            }
            // cam
            let cam = document.getElementById(`slot_${slot_id}_cam`);
            if (cam) {
                if (video.is_host_enabled) {
                    cam.classList.add('active');
                    cam.classList.remove('inactive');
                } else {
                    cam.classList.remove('active');
                    cam.classList.add('inactive');
                }
            }
        }
    }

    if (user_ids.length == 0) {
        // no guests
        return;
    }

    // get user names
    let users = new URL('https://api.twitch.tv/helix/users');
    users.search = new URLSearchParams(user_ids);

    let userReq = await fetch(
        users,
        {
            method: 'GET',
            headers: {
                ...commonHeaders
            }
        }
    );
    if (userReq.status != 200) {
        // oh no
        status_bar.textContent = 'Something went wrong looking up guests';
        return;
    }

    let userData = await userReq.json();
    userData.data.forEach(user => {
        let { id, display_name } = user;
        slot_ref[id].textContent = display_name;

        user_name_cache[id] = user;
    });
}

async function loadSettings() {
    if (broadcaster_id != moderator_id) {
        // cannot do
        settings_form.classList.add('disableit');
        return;
    }

    let url = new URL('https://api.twitch.tv/helix/guest_star/channel_settings');
    url.search = new URLSearchParams([
        [ 'broadcaster_id', broadcaster_id ]
    ]);
    let request = await fetch(
        url,
        {
            method: 'GET',
            headers: {
                ...commonHeaders
            }
        }
    );
    if (request.status != 200) {
        status_bar.textContent = 'Failed to get Settings: ' + await resp.text();
        return;
    }
    let session = await request.json();

    drawSession(session.data[0]);
}

function drawSession(session_data) {
    let { is_moderator_send_live_enabled, slot_count, is_browser_source_audio_enabled, group_layout } = session_data;
    if (is_moderator_send_live_enabled) {
        document.querySelector('input[name="is_moderator_send_live_enabled"]').setAttribute('checked', 'checked');
    } else {
        document.querySelector('input[name="is_moderator_send_live_enabled"]').removeAttribute('checked');
    }

    active_session_slot_count = slot_count;
    document.querySelector('select[name="slot_count"]').value = slot_count;
    for (var x=1;x<=5;x++) {
        let layout_row = document.getElementById(`slot_${x}`);
        if (x <= slot_count) {
            layout_row.removeAttribute('disabled');
            layout_row.classList.remove('disabled');
        } else {
            layout_row.setAttribute('disabled', 'disabled');
            layout_row.classList.add('disabled');
        }
    }

    if (is_browser_source_audio_enabled) {
        document.querySelector('input[name="is_browser_source_audio_enabled"]').setAttribute('checked', 'checked');
    } else {
        document.querySelector('input[name="is_browser_source_audio_enabled"]').removeAttribute('checked');
    }
    document.querySelector('select[name="group_layout"]').value = group_layout.toUpperCase();
}

// functions
invite_username_form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!active_session_id) {
        status_bar.textContent = 'Please Start a Guest Star session first';
        return;
    }

    console.log('create invite');

    let username = invite_username.value;
    let userData = await getUserData(username);

    // send invite
    let invite = await fetch(
        'https://api.twitch.tv/helix/guest_star/invites',
        {
            method: 'POST',
            headers: {
                ...commonHeaders,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                broadcaster_id,
                moderator_id,
                session_id: active_session_id,
                guest_id: userData.id
            })
        }
    );
    if (invite.status == 204) {
        // yay
        status_bar.textContent = `Invite sent to ${username}`;
        // we have to refresh
        // as eventsub doesn't give us NEW INVITED users
        refreshInvites();
        return;
    }

    let data = await invite.json();
    status_bar.textContent = `Failed to invite ${username} - ${data.message}`;
});
settings_form.addEventListener('submit', async (e) => {
    e.preventDefault();

    console.log('submitting settings');

    let revise = await fetch(
        'https://api.twitch.tv/helix/guest_star/channel_settings',
        {
            method: 'PATCH',
            headers: {
                ...commonHeaders,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                broadcaster_id,

                is_moderator_send_live_enabled: (is_moderator_send_live_enabled.checked),
                slot_count: slot_count.value,
                is_browser_source_audio_enabled: (is_browser_source_audio_enabled.checked),
                group_layout: group_layout.value
            })
        }
    );
    if (revise.status == 204) {
        // yay
        status_bar.textContent = `Settings Revised`;
        return;
    }

    let data = await revise.json();
    status_bar.textContent = `Failed to Revise Settings - ${data.message}`;
});





function bindEventSubTriggers() {
    eventSubController.on('channel.guest_star_session.begin', ({ metadata, payload }) => {
        let { session_id } = payload.event;
        active_session_id = session_id;

        initInvite();

        master_control.setAttribute('data-function', 'stop');
        master_control.value = 'End Guest Star';
    });
    eventSubController.on('channel.guest_star_session.end', ({ metadata, payload }) => {
        active_session_id = '';

        master_control.setAttribute('data-function', 'start');
        master_control.value = 'Start Guest Star';
    });

    eventSubController.on('channel.guest_star_settings.update', ({ metadata, payload }) => {
        drawSession(payload.event);
        // load guests
        loadSession();
    });

    eventSubController.on('channel.guest_star_guest.update', ({ metadata, payload }) => {
        let { slot_id, guest_user_id, guest_user_login, state } = payload.event;

        console.log(`Update ${slot_id} to ${guest_user_login} with ${state}`);

        //if (state == 'ready') {
        if (!slot_id) {
            // occurance on a user not in a slot
            // so in the invite queue

            if (state == 'removed') {
                // invite was removed
                return;
            }

            // user changed state in the queue 
            document.querySelector(`td[data-invite-state="${guest_user_id}"]`).textContent = state;
            // if it's ready show the slot selector
            if (state == 'ready') {
                document.getElementById(`invite_to_slot_for_${guest_user_id}`).style.display = 'block';
            }

            return;
        }

        // check for and remove from invites
        var invite = document.getElementById(`invite_for_${guest_user_id}`);
        if (invite) {
            invite.remove();
        }
        // check for and remove from invites

        let el = document.getElementById(`slot_${slot_id}_guest`);
        if (!el) {
            // errr
            console.log('no el');
            return;
        }

        let st = document.getElementById(`slot_${slot_id}_live`);
        let mov = document.getElementById(`slot_${slot_id}_move`);

        let mic = document.getElementById(`slot_${slot_id}_mic`);
        let cam = document.getElementById(`slot_${slot_id}_cam`);

        if (state == 'invited') {
            // this slot was emptied of the user and the user was removed or queued
            el.textContent = '';
            st.value = 'backstage';
            mov.removeAttribute('data-user-id');

            // reset mic/cam
                mic.classList.remove('active');
                mic.classList.remove('inactive');
            // cam
                cam.classList.remove('active');
                cam.classList.remove('inactive');

            // add the user _back_ to the invite list
            refreshInvites();//cop out

            return;
        }

        el.textContent = guest_user_login;

        console.log('making state', state);
        st.value = state;

        mov.setAttribute('data-user-id', guest_user_id);

        // mic cam
        loadSession();
        // I don't know what the mic/cam state is
        mic.classList.add('active');
        cam.classList.add('active');
    });


    eventSubController.on('channel.guest_star_slot.update', ({ metadata, payload }) => {
        console.log('slot update', payload.event);
        let { slot_id, host_video_enabled, host_audio_enabled, host_volume } = payload.event;
        let { guest_user_id, guest_user_login, guest_user_name } = payload.event;

        // redraw the table line for slot_id
        let targetRow = document.getElementById(`slot_${slot_id}`);
        targetRow.setAttribute('data-user-id', guest_user_id);

        let targetGuest = document.getElementById(`slot_${slot_id}_guest`);
        let targetLive = document.getElementById(`slot_${slot_id}_live`);
        let mic = document.getElementById(`slot_${slot_id}_mic`);
        let cam = document.getElementById(`slot_${slot_id}_cam`);

        if (guest_user_id == null) {
            // the slot was emptied
            targetGuest.textContent = '';
            targetLive.value = 'backstage';
            mic.classList.remove('active');
            mic.classList.remove('inactive');
            cam.classList.remove('active');
            cam.classList.remove('inactive');

            return;
        }

        targetGuest.textContent = guest_user_name;
        //targetLive.value = 'backstage';// missing data....

        if (host_audio_enabled) {
            mic.classList.add('active');
            mic.classList.remove('inactive');
        } else {
            mic.classList.remove('active');
            mic.classList.add('inactive');
        }

        if (host_video_enabled) {
            cam.classList.add('active');
            cam.classList.remove('inactive');
        } else {
            cam.classList.remove('active');
            cam.classList.add('inactive');
        }
    });
}


/*
Slotting
*/
async function slotUser(e) {
    let guest_id = e.target.closest('tr').getAttribute('data-user-id');
    let slot_id = e.target.value;

    if (slot_id > active_session_slot_count) {
        status_bar.textContent = `Cannot add to slot due to slot max ${slot_id} is > ${active_session_slot_count}`;
        return;
    }

    console.log(`Putting ${guest_id} into ${slot_id}`);
    status_bar.textContent = `Putting ${guest_id} into ${slot_id}`;

    let slotAttempt = await fetch(
        'https://api.twitch.tv/helix/guest_star/slot',
        {
            method: 'POST',
            headers: {
                ...commonHeaders,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                broadcaster_id,
                moderator_id,
                session_id: active_session_id,
                slot_id,
                guest_id
            })
        }
    );

    if (slotAttempt.status == 204) {
        // yay
        status_bar.textContent = `Slotted ${guest_id} into ${slot_id}`;

        // reload
        console.log('Skip reload');
        //loadSession();
        return;
    }

    let data = await slotAttempt.json();
    status_bar.textContent = `Failed to Slot User - ${data.message}`;
}

async function makeSlotLive(slot_id, is_live) {
    status_bar.textContent = `Making ${slot_id} into ${is_live ? 'Live' : 'Backstage'}`;

    let slotAttempt = await fetch(
        'https://api.twitch.tv/helix/guest_star/slot_settings',
        {
            method: 'PATCH',
            headers: {
                ...commonHeaders,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                broadcaster_id,
                moderator_id,
                session_id: active_session_id,
                slot_id,
                is_live
            })
        }
    );

    if (slotAttempt.status == 204) {
        // yay
        status_bar.textContent = `Updated ${slot_id} into ${is_live ? 'Live' : 'Backstage'}`;
        return;
    }

    let data = await slotAttempt.json();
    status_bar.textContent = `Failed to Update Slot - ${data.message}`;
}
    async function reviseSlotLive(slot_id, settings) {
        status_bar.textContent = `Revising ${slot_id}`;

        let slotAttempt = await fetch(
            'https://api.twitch.tv/helix/guest_star/slot_settings',
            {
                method: 'PATCH',
                headers: {
                    ...commonHeaders,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    broadcaster_id,
                    moderator_id,
                    session_id: active_session_id,
                    slot_id,
                    ...settings
                })
            }
        );

        if (slotAttempt.status == 204) {
            // yay
            status_bar.textContent = `Revised ${slot_id}`;

            // no eventsub for the result
            // request guest/redraw
            console.log('Skip full reload');

            return;
        }

        let data = await slotAttempt.json();
        status_bar.textContent = `Failed to Update Slot - ${data.message}`;
    }

async function moveSlot(source_slot_id, destination_slot_id) {
    if (destination_slot_id > active_session_slot_count) {
        status_bar.textContent = `Cannot change slot due to slot max ${destination_slot_id} is > ${active_session_slot_count}`;
        //return;
    }

    status_bar.textContent = `Moving ${source_slot_id} into ${destination_slot_id}`;

    let slotAttempt = await fetch(
        'https://api.twitch.tv/helix/guest_star/slot',
        {
            method: 'PATCH',
            headers: {
                ...commonHeaders,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                broadcaster_id,
                moderator_id,
                session_id: active_session_id,
                source_slot_id,
                destination_slot_id
            })
        }
    );

    if (slotAttempt.status == 204) {
        // yay
        status_bar.textContent = `Moved ${source_slot_id} into ${destination_slot_id}`;

        // no eventsub for the result
        // request guest/redraw
        console.log('skip reload');
        //loadSession();

        return;
    }

    let data = await slotAttempt.json();
    status_bar.textContent = `Failed to Move Slot - ${data.message}`;
}
async function emptySlot(slot_id, guest_id, should_reinvite_guest) {
    status_bar.textContent = `Removing Guest in ${slot_id} with ${should_reinvite_guest}`;

    let slotAttempt = await fetch(
        'https://api.twitch.tv/helix/guest_star/slot',
        {
            method: 'DELETE',
            headers: {
                ...commonHeaders,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                broadcaster_id,
                moderator_id,
                session_id: active_session_id,
                guest_id,
                slot_id,
                should_reinvite_guest
            })
        }
    );

    if (slotAttempt.status == 204) {
        // yay
        status_bar.textContent = `Removed Guest in ${slot_id} with ${should_reinvite_guest}`;
        return;
    }

    let data = await slotAttempt.json();
    status_bar.textContent = `Failed to Empty Slot - ${data.message}`;
}

/*
Slot Control
*/
slots.addEventListener('change', (e) => {
    let func = e.target.getAttribute('data-function');
    if (!func) {
        return;
    }
    let slot_id = e.target.getAttribute('data-slot-id');
    var user_id = e.target.closest('tr').getAttribute('data-user-id');

    switch (func) {
        case 'slot_guest':
            let destination = e.target.value;

            // reset the form
            e.target.value = slot_id;
            if (destination == slot_id) {
                return;
            }

            if (destination == 'Remove') {
                console.log('Removing the user', slot_id, user_id);
                emptySlot(slot_id, user_id, false);
            } else if (destination == 'Queue') {
                console.log('ReQueuing the user', slot_id, user_id);
                emptySlot(slot_id, user_id, true);
            } else {
                moveSlot(slot_id, destination);
            }

            break;

        case 'slot_live':
            let is_live = false;
            if (e.target.value == 'live') {
                is_live = true;
            }
            makeSlotLive(slot_id, is_live);
            break;
    }
});
