// These are set for the GitHub Pages Example
// Substitute as needed
var client_id = 'hozgh446gdilj5knsrsxxz8tahr3koz';
var redirect = `https://${window.location.host}/twitch_misc/`;
//var redirect = `http://localhost:8000/twitch_misc/`;
var access_token = '';

let guest_star_template = 'https://dashboard.twitch.tv/widgets/guest-star/[USERNAME]?display=single&slot=[SLOT]#auth=[AUTH]';

let commonHeaders = {};
let broadcaster_login = '';
let broadcaster_id = '';
let gs_browser_source_token = '';

authorize.setAttribute('href', 'https://id.twitch.tv/oauth2/authorize?client_id=' + client_id + '&redirect_uri=' + encodeURIComponent(redirect) + '&response_type=token&scope=channel:read:guest_star');

async function processToken(token) {
    access_token = token;

    commonHeaders = {
        'Accept': 'application/json',
        'Client-ID': client_id,
        'Authorization': `Bearer ${access_token}`
    }

    twitch_status_bar.textContent = 'Loading';
    let broadcaster = await getOneHelix('users');
    if (!broadcaster) {
        return;
    }
    broadcaster_id = broadcaster.id;
    broadcaster_login = broadcaster.login;

    authorize.remove();

    twitch_status_bar.textContent = `Hello ${broadcaster.display_name}`;

    loadGuestStar();
}
async function getOneHelix(path) {
    let url = new URL(`https://api.twitch.tv/helix/${path}`);
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
        twitch_status_bar.textContent = `Failed to load ${path}: ` + await resp.text();
        return;
    }
    let data = await resp.json();
    if (data.data.length == 1) {
        return data.data[0];
    }
    twitch_status_bar.textContent = 'Failed to find one record';
}

async function loadGuestStar() {
    let guestStar = await getOneHelix(
        `guest_star/channel_settings?broadcaster_id=${broadcaster_id}&moderator_id=${broadcaster_id}`
    );
    if (!guestStar) {
        return;
    }
    let { slot_count, is_browser_source_audio_enabled, group_layout, browser_source_token } = guestStar;

    twitch_status_bar.textContent = `We found you are using ${group_layout} with ${slot_count} slots`;
    gs_browser_source_token = browser_source_token;

    let existing = await obs.call('GetInputList', {
        inputKind: 'browser_source'
    });

    guest_star_slots.textContent = '';
    for (let x=1;x<=slot_count;x++) {
        let gs = document.createElement('div');
        gs.classList.add('guest_star_slot');
        guest_star_slots.append(gs);

        let sl = document.createElement('div');
        gs.append(sl);
        sl.textContent = `Slot ${x}`;

        let bt = document.createElement('button');
        gs.append(bt);
        bt.classList.add('guest_star_slot_control');
        bt.setAttribute('data-slot', x);

        bt.textContent = 'Add';

        let inputName = `Guest Star: Slot ${x}`;
        for (var y=0;y<existing.inputs.length;y++) {
            if (existing.inputs[y].inputName == inputName) {
                bt.textContent = 'Remove';
            }
        }
    }
}
refreshGuestStar.addEventListener('click', (e) => {
    loadGuestStar();
});

guest_star_slots.addEventListener('click', async (e) => {
    if (!e.target.classList.contains('guest_star_slot_control')) {
        return;
    }
    if (!obsControllingScene || obsControllingScene == '') {
        twitch_status_bar.textContent = 'Please Select an OBS Scene first';
        return;
    }

    let slot = e.target.getAttribute('data-slot');
    let url = guest_star_template;
    url = url.replace('[USERNAME]', broadcaster_login);
    url = url.replace('[SLOT]', slot);
    url = url.replace('[AUTH]', gs_browser_source_token);

    //console.log(url);return;

    let inputName = `Guest Star: Slot ${slot}`;
    let found = false;
    // check if exists
    let existing = await obs.call('GetInputList', {
        inputKind: 'browser_source'
    });
    for (var x=0;x<existing.inputs.length;x++) {
        let name = existing.inputs[x].inputName;
        if (name == inputName) {
            found = true;
        }
    }

    if (found) {
        // remove
        await obs.call('RemoveInput', {
            inputName
        });
        e.target.textContent = 'Add';
        return;
    }
    // not found add
    await obs.call('CreateInput', {
        sceneName: obsControllingScene,
        inputName,
        inputKind: 'browser_source',
        inputSettings: {
            fps: 60,
            fps_custom: true,
            url,
            reroute_audio: true,
            width: (1920 / 3),
            height: (1080 / 3)
        },
        sceneItemEnabled: true
    });
    e.target.textContent = 'Remove';
});
//[USERNAME]?display=single&slot=[SLOT]#auth=[AUTH]';

/*
GetSceneItemList { sceneName: ""}
*/

connect_to_obs_form.addEventListener('submit', (e) => {
    e.preventDefault();

    initOBS(
        obs_ip.value,
        obs_port.value,
        obs_password.value
    )
});

const obs = new OBSWebSocket();

async function initOBS(ip, port, password) {
    // connect
    try {
        await obs.connect(`ws://${ip}:${port}`, password, {
            rpcVersion: 1
        });
        obs_status_bar.textContent = 'Connected to OBS';
    } catch (error) {
        obs_status_bar.textContent = `Failed to Connect to OBS: ${error.message}`;
        console.error('Failed to connect', error.code, error.message);
        return;
    }

    twitch.classList.remove('disable');
    connect_to_obs.style.display = 'none';

    // get scenes
    let scenes = await obs.call('GetSceneList');
    obs_scenes.textContent = '';

    scenes.scenes.forEach(scene => {
        let { sceneName } = scene;
        let d = document.createElement('div');
        d.classList.add('bigbutton');
        d.textContent = sceneName;
        obs_scenes.append(d);
    });
}

let obsControllingScene = '';
obs_scenes.addEventListener('click', (e) => {
    let el = document.querySelector('.bigbutton.selected');
    if (el) {
        el.classList.remove('selected');
    }
    e.target.classList.add('selected');
    obsControllingScene = e.target.textContent;
});
