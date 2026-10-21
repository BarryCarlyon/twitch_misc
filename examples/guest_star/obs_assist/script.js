// These are set for the GitHub Pages Example
// Substitute as needed
var client_id = 'hozgh446gdilj5knsrsxxz8tahr3koz';
var redirect = `https://${window.location.host}/twitch_misc/`;
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

    let obsExistingInputs = await obs.call('GetInputList', {
        inputKind: 'browser_source'
    });
    let obsSceneInputs = await obs.call('GetSceneItemList', {
        sceneName: obsControllingScene
    });

    guest_star_slots.textContent = '';
    for (let x=1;x<=slot_count;x++) {
        let gs = document.createElement('div');
        gs.classList.add('guest_star_slot');
        guest_star_slots.append(gs);

        let bt = document.createElement('button');
        gs.append(bt);
        bt.classList.add('guest_star_slot_control');
        bt.setAttribute('data-slot', x);

        bt.textContent = 'Add';

        let targetInputName = `Guest Star: Slot ${x}`;
        for (var y=0;y<obsExistingInputs.inputs.length;y++) {
            let { inputName } = obsExistingInputs.inputs[y];
            if (inputName == targetInputName) {
                bt.textContent = 'Remove';
            }
        }

        let sl = document.createElement('div');
        gs.append(sl);
        sl.textContent = `Slot ${x}`;

        // spacer....

        let vbt = document.createElement('button');
        gs.append(vbt);
        vbt.classList.add('guest_star_visible_control');
        vbt.setAttribute('data-slot', x);

        vbt.textContent = 'Hide';

        for (var y=0;y<obsSceneInputs.sceneItems.length;y++) {
            let { sourceName, sceneItemId, sceneItemEnabled } = obsSceneInputs.sceneItems[y];
            console.log(sourceName, sceneItemId, sceneItemEnabled);

            if (sourceName == targetInputName) {
                vbt.setAttribute('data-obs-sceneItemId', sceneItemId);
            }

            if (sourceName == targetInputName && !sceneItemEnabled) {
                vbt.textContent = 'Show';
                vbt.setAttribute('data-hidden', true);
            }
        }


        let volControl = document.createElement('div');
        gs.append(volControl);

        let volDB = document.createElement('div');
        volDB.textContent = '0.0dB';
        volControl.append(volDB);
        volDB.classList.add('guest_star_db');
        volDB.setAttribute('data-slot', x);
        volDB.setAttribute('data-obs-inputName', targetInputName);

        // volume control
        let vol = document.createElement('input');
        vol.setAttribute('type', 'range');
        vol.setAttribute('step', '0.01');
        vol.setAttribute('max', '1');
        vol.setAttribute('min', '0');
        vol.classList.add('guest_star_volume_control');
        vol.setAttribute('data-slot', x);
        vol.setAttribute('data-obs-inputName', targetInputName);
        volControl.append(vol);

        let muteControl = document.createElement('div');
        gs.append(muteControl);

        let mute = document.createElement('button');
        muteControl.append(mute);
        mute.classList.add('guest_star_mute_control');
        mute.setAttribute('data-slot', x);
        mute.setAttribute('data-obs-inputName', targetInputName);
        mute.textContent = 'Mute';

        checkVolume(targetInputName, vol, mute);
    }
}
refreshGuestStar.addEventListener('click', (e) => {
    loadGuestStar();
});

guest_star_slots.addEventListener('click', async (e) => {
    if (!obsControllingScene || obsControllingScene == '') {
        twitch_status_bar.textContent = 'Please Select an OBS Scene first';
        return;
    }

    if (e.target.classList.contains('guest_star_slot_control')) {
        do_guest_star_slot_control(e);
        return;
    }
    if (e.target.classList.contains('guest_star_mute_control')) {
        do_guest_star_mute_control(e);
        return;
    }
    if (e.target.classList.contains('guest_star_visible_control')) {
        do_guest_star_visible_control(e);
        return;
    }
});

async function do_guest_star_slot_control(e) {
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
}
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
            rpcVersion: 1,
            eventSubscriptions: OBSWebSocket.EventSubscription.All
        });
        obs_status_bar.textContent = 'Connected to OBS';
    } catch (error) {
        obs_status_bar.textContent = `Failed to Connect to OBS: ${error.message}`;
        console.error('Failed to connect', error.code, error.message);
        return;
    }
    twitch.classList.remove('disable');
    connect_to_obs.style.display = 'none';

    // OBS Get scenes and current scene
    let SceneList = await obs.call('GetSceneList');
    obs_scenes.textContent = '';

    let { scenes, currentProgramSceneName } = SceneList;

    scenes.forEach(scene => {
        let { sceneName } = scene;
        let d = document.createElement('div');
        d.classList.add('bigbutton');
        d.textContent = sceneName;
        if (sceneName == currentProgramSceneName) {
            d.classList.add('selected');
            obsControllingScene = sceneName;
        }
        obs_scenes.append(d);
    });

    // the meters!
    //obs.on('InputVolumeMeters', (data) => {
    //    console.log(data);
    //});
    obs.on('InputVolumeChanged', (data) => {
        //console.log(data);
        updateVolume(data);
    });
    obs.on('InputMuteStateChanged', (data) => {
        //console.log('Mute Event', data);
        updateMute(data);
    });

    obs.on('SceneItemEnableStateChanged', (data) => {
        //console.log(data);
        updateState(data);
    });
}


    async function checkVolume(inputName, el, elm) {
        let { inputVolumeMul, inputVolumeDb } = await obs.call(
            'GetInputVolume',
            {
                inputName
            }
        );
        console.log(`For ${inputName} the vol is MUL:${inputVolumeMul}/DB:${inputVolumeDb}`);
        el.value = inputVolumeMul;

        let tel = document.querySelector(`div[data-obs-inputName="${inputName}"]`);
        let dsp = parseFloat(inputVolumeDb).toFixed(2);
        tel.textContent = `${dsp}dB`;

        // bind a change function
        el.addEventListener('mousedown', async (e) => {
            el.classList.add('beingDragged');
        });
        el.addEventListener('mouseup', async (e) => {
            el.classList.remove('beingDragged');
        });
        el.addEventListener('input', async (e) => {
            console.log('Volumne Change', inputName, e.target.value);

            await obs.call(
                'SetInputVolume',
                {
                    inputName,
                    inputVolumeMul: parseFloat(e.target.value)
                }
            );
        });

        let { inputMuted } = await obs.call(
            'GetInputMute',
            {
                inputName
            }
        );
        if (inputMuted) {
            elm.textContent = 'Muted';
        } else {
            elm.textContent = 'Mute';
        }
        elm.setAttribute('data-muted', inputMuted);
    }
    function updateVolume(data) {
        let { inputName, inputVolumeDb, inputVolumeMul } = data;

        let tel = document.querySelector(`.guest_star_db[data-obs-inputName="${inputName}"]`);
        let dsp = parseFloat(inputVolumeDb).toFixed(2);
        tel.textContent = `${dsp}dB`;

        let el = document.querySelector(`input[data-obs-inputName="${inputName}"]`);
        if (el.classList.contains('beingDragged')) {
            return;
        }
        console.log(`Change ${inputName} to MUL:${inputVolumeMul}/DB:${inputVolumeDb}`);
        el.value = inputVolumeMul;
    }

    function updateMute(data) {
        let { inputMuted, inputName } = data;
        let elm = document.querySelector(`.guest_star_mute_control[data-obs-inputName="${inputName}"]`);
        if (inputMuted) {
            elm.textContent = 'Muted';
        } else {
            elm.textContent = 'Mute';
        }
        elm.setAttribute('data-muted', inputMuted);
    }
    async function do_guest_star_mute_control(e) {
        let inputName = e.target.getAttribute('data-obs-inputName');
        await obs.call(
            'ToggleInputMute',
            {
                inputName
            }
        );
    }

    function updateState(data) {
        let { sceneItemEnabled, sceneItemId, sceneName } = data;
        console.log('State', { sceneItemEnabled, sceneItemId, sceneName });
        if (sceneName != obsControllingScene) {
            return;
        }
        let vbt = document.querySelector(`.guest_star_visible_control[data-obs-sceneitemid="${sceneItemId}"]`);
        if (!vbt) {
            return;
        }
        if (sceneItemEnabled) {
            vbt.textContent = 'Hide';
        } else {
            vbt.textContent = 'Show';
        }
        vbt.setAttribute('data-hidden', !sceneItemEnabled);
    }
    async function do_guest_star_visible_control(e) {
        let inputName = e.target.getAttribute('data-obs-inputName');
        // consider moving to a live lookup...
        let sceneItemId = parseInt(e.target.getAttribute('data-obs-sceneItemId'));

        let { sceneItemEnabled } = await obs.call(
            'GetSceneItemEnabled',
            {
                sceneName: obsControllingScene,
                sceneItemId
            }
        );
        sceneItemEnabled = sceneItemEnabled ? false : true;
        await obs.call(
            'SetSceneItemEnabled',
            {
                sceneName: obsControllingScene,
                sceneItemId,
                sceneItemEnabled
            }
        );
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
