function runLineNotification({ payload }) {
    let { event } = payload;

    let { system_message, notice_type, message } = event;

    let { text, fragments } = message;

    // channel
    let { broadcaster_user_name, broadcaster_user_login, broadcaster_user_id } = event;
    // entity
    let { chatter_user_name, chatter_user_login, chatter_user_id, color, chatter_is_anonymous } = event;

    switch (notice_type) {
        case 'sub':
            let { sub } = event;
            var { duration_months, is_prime, sub_tier } = sub;

            var r = activity_feed.insertRow(0);
            r.setAttribute('title', system_message);
            var cell = r.insertCell();
            cell.textContent = dateTime();
            var cell = r.insertCell();
            cell.textContent = broadcaster_user_login;

            var cell = r.insertCell();
            cell.style.color = color;
            cell.textContent = processName(chatter_user_name, chatter_user_login);

            var cell = r.insertCell();
            cell.textContent = `New Sub ${processTier(sub_tier)}`;

            var cell = r.insertCell();
            // counts
            var cell = r.insertCell();
            if (is_prime) {
                cell.textContent = `With Twitch Prime`;
            } else if (duration_months > 1) {
                cell.textContent = `In Advance for ${duration_months}`;
            }

            break;
        case 'resub':
            let { resub } = event;

            var { cumulative_months, streak_months, duration_months } = resub;
            var { sub_tier, is_gift, is_prime } = resub;

            var r = activity_feed.insertRow(0);
            r.setAttribute('title', system_message);
            var cell = r.insertCell();
            cell.textContent = dateTime();
            var cell = r.insertCell();
            cell.textContent = broadcaster_user_login;

            var cell = r.insertCell();
            cell.style.color = color;
            cell.textContent = processName(chatter_user_name, chatter_user_login);

            var cell = r.insertCell();
            cell.textContent = `Resub ${processTier(sub_tier)}`;
            var cell = r.insertCell();

            let durational = `${cumulative_months} months`;
            if (cumulative_months % 12 === 0) {
                durational = `${cumulative_months / 12} years`;
            }

            if (streak_months) {
                cell.textContent = `${durational} for ${streak_months} streak`;
            } else {
                cell.textContent = `${durational}`;
            }

            var cell = r.insertCell();
            if (is_prime) {
                cell.textContent = 'With Twitch Prime: ';
            }
            buildFromFragments(cell, fragments);

            break;

        case 'sub_gift':
            let { sub_gift } = event;

            let { community_gift_id } = sub_gift;
            var { sub_tier, cumulative_total, duration_months } = sub_gift;

            var { recipient_user_name, recipient_user_login, recipient_user_id } = sub_gift;

            if (community_gift_id) {
                // this gift is part of a bomb
                // duration is useless here as gift bombs are only a monther

                // look for the sub table
                let target = document.getElementById(`victims_for_${community_gift_id}`);
                if (target) {
                    //let sr = target.insertRow();
                    //var cell = sr.insertCell();
                    let cell = document.createElement('li')
                    target.append(cell);
                    cell.textContent = processName(recipient_user_name, recipient_user_login);
                } else {
                    //go = false;
                    console.log('target doesnt exist', notice_type, event);
                    // now the real question what would be the best way to _wait_
                    // do we draw the line with what we can
                    // or _wait_ I don't LIKE this but it works...
                    setTimeout(() => {
                        runLineNotification({ payload })
                    }, 500);

                    let hasProc = document.getElementById(`processing_for_${community_gift_id}`);
                    if (!hasProc) {
                        var proc = activity_feed.insertRow(0);
                        proc.setAttribute('id', `processing_for_${community_gift_id}`);
                        var cell = proc.insertCell();
                        cell.setAttribute('colspan', 50);
                        cell.style.backgroundColor = 'red';
                        cell.style.textAlign = 'center';
                        cell.textContent = `Processing ${community_gift_id}`;
                    }
                }
            } else {
                var r = activity_feed.insertRow(0);
                r.setAttribute('title', system_message);
                var cell = r.insertCell();
                cell.textContent = dateTime();
                var cell = r.insertCell();
                cell.textContent = broadcaster_user_login;

                var cell = r.insertCell();
                cell.style.color = color;
                cell.textContent = processName(chatter_user_name, chatter_user_login, chatter_is_anonymous);

                var cell = r.insertCell();
                cell.textContent = `Direct Gift ${processTier(sub_tier)}`;

                var cell = r.insertCell();
                // counts N/A
                var cell = r.insertCell();

                let text = `Gifted ${processName(recipient_user_name, recipient_user_login)}`;
                if (duration_months > 1) {
                    text = `${text} for ${duration_months} months`;
                }
                if (cumulative_total) {
                    text = `${text} it is their ${cumulative_total} gift to the channel`;
                }

                cell.textContent = text;
            }

            break;
        case 'community_sub_gift':
            let { community_sub_gift } = event;
            // gift bomb occuring
            var { cumulative_total } = community_sub_gift;// can be blank/null
            var { id, sub_tier, total } = community_sub_gift;

            var r = activity_feed.insertRow(0);
            r.setAttribute('title', system_message);
            var cell = r.insertCell();
            cell.textContent = dateTime();
            var cell = r.insertCell();
            cell.textContent = broadcaster_user_login;

            var cell = r.insertCell();
            cell.style.color = color;
            cell.textContent = processName(chatter_user_name, chatter_user_login, chatter_is_anonymous);

            var cell = r.insertCell();
            cell.textContent = `Community Gift ${processTier(sub_tier)}`;

            var cell = r.insertCell();
            if (cumulative_total) {
                cell.textContent = `${total} gift${total > 1 ? 's' : ''} for ${cumulative_total} cumulative in the channel`;
            } else {
                cell.textContent = `${total} gift${total > 1 ? 's' : ''}`;
            }

            var cell = r.insertCell();
            //var t = document.createElement('table');
            var t = document.createElement('ul');
            cell.append(t);
            t.setAttribute('id', `victims_for_${id}`);

            let hasProc = document.getElementById(`processing_for_${id}`);
            if (hasProc) {
                hasProc.remove();
            }

            break;

        case 'pay_it_forward':
            // direct gift forward
            let { pay_it_forward } = event;

            // chatter recieved a gift from
            var { gifter_user_name, gifter_user_login, gifter_user_id, gifter_is_anonymous } = pay_it_forward;
            // chatter is giving to
            var { recipient_user_name, recipient_user_login, recipient_user_id } = pay_it_forward;

            var r = activity_feed.insertRow(0);
            r.setAttribute('title', system_message);
            var cell = r.insertCell();
            cell.textContent = dateTime();
            var cell = r.insertCell();
            cell.textContent = broadcaster_user_login;

            var cell = r.insertCell();
            cell.style.color = color;
            cell.textContent = processName(chatter_user_name, chatter_user_login);

            var cell = r.insertCell();
            cell.textContent = 'Paying it Forward';
            var cell = r.insertCell();
            // counts
            var cell = r.insertCell();
            // message
            if (!recipient_user_id) {
                // its a bomb
                cell.textContent = `Community Gifting in response to a gift from ${processName(gifter_user_name, gifter_user_login, gifter_is_anonymous)}`;
            } else {
                cell.textContent = `Gifting ${processName(recipient_user_name, recipient_user_login)} in response to a gift from ${processName(gifter_user_name, gifter_user_login, gifter_is_anonymous)}`;
            }
            // raises a sub_gift

            break;

        case 'gift_paid_upgrade':
            let { gift_paid_upgrade } = event;

            // chatter recieved a gift from
            var { gifter_user_name, gifter_user_login, gifter_user_id, gifter_is_anonymous } = gift_paid_upgrade;
            // and is self upgrading
            var r = activity_feed.insertRow(0);
            r.setAttribute('title', system_message);
            var cell = r.insertCell();
            cell.textContent = dateTime();
            var cell = r.insertCell();
            cell.textContent = broadcaster_user_login;

            var cell = r.insertCell();
            cell.style.color = color;
            cell.textContent = processName(chatter_user_name, chatter_user_login);
            var cell = r.insertCell();
            cell.textContent = 'Gift Upgrade';
            var cell = r.insertCell();
            // counts
            var cell = r.insertCell();
            // message
            cell.textContent = `Continuing their sub they got from ${processName(gifter_user_name, gifter_user_login, gifter_is_anonymous)}`;

            break;
        case 'prime_paid_upgrade':
            let { prime_paid_upgrade } = event;

            var { sub_tier } = prime_paid_upgrade;

            var r = activity_feed.insertRow(0);
            r.setAttribute('title', system_message);
            var cell = r.insertCell();
            cell.textContent = dateTime();
            var cell = r.insertCell();
            cell.textContent = broadcaster_user_login;

            var cell = r.insertCell();
            cell.style.color = color;
            cell.textContent = processName(chatter_user_name, chatter_user_login);
            var cell = r.insertCell();
            cell.textContent = `Prime Upgrade: ${processTier(sub_tier)}`;
            var cell = r.insertCell();
            // counts
            var cell = r.insertCell();
            // message
            cell.textContent = `Upgraded from Twitch Prime`;

            break;

        case 'raid':
            let { raid } = event;
            let { profile_image_url, user_id, user_login, user_name, viewer_count } = raid;

            var r = activity_feed.insertRow(0);
            r.setAttribute('title', system_message);
            var cell = r.insertCell();
            cell.textContent = dateTime();
            var cell = r.insertCell();
            cell.textContent = broadcaster_user_login;

            var cell = r.insertCell();
            cell.style.color = color;
            // the raiders is also the chatter.... soooo....
            //cell.textContent = processName(chatter_user_name, chatter_user_login);
            cell.textContent = processName(user_name, user_login);

            var cell = r.insertCell();
            cell.textContent = 'Raid';
            var cell = r.insertCell();
            var cell = r.insertCell();
            cell.textContent = `Raiding with ${viewer_count} viewers`;

            break;

        case 'bits_badge_tier':
            // to consider...
            let { bits_badge_tier } = event;
            var { tier } = bits_badge_tier;

            var r = activity_feed.insertRow(0);
            r.setAttribute('title', system_message);
            var cell = r.insertCell();
            cell.textContent = dateTime();
            var cell = r.insertCell();
            cell.textContent = broadcaster_user_login;

            var cell = r.insertCell();
            cell.style.color = color;
            cell.textContent = processName(chatter_user_name, chatter_user_login);

            var cell = r.insertCell();
            cell.textContent = 'Bits Tier';
            var cell = r.insertCell();
            cell.textContent = tier;
            var cell = r.insertCell();
            buildFromFragments(cell, fragments);

            break;

        case 'announcement':
            // skip
            break;
        default:
            go = false;
            console.log('Unexpected', notice_type, event);
    }
}

function runLineMessage({ payload }) {
    let { event } = payload;

    let { message_type, message } = event;

    let { text, fragments } = message;

    // channel
    let { broadcaster_user_name, broadcaster_user_login, broadcaster_user_id } = event;
    // entity
    let { chatter_user_name, chatter_user_login, chatter_user_id, color } = event;

    let { cheer, channel_points_custom_reward_id } = event;

    let title_of_event = '';
    switch (message_type) {
        case 'channel_points_sub_only':
            title_of_event = 'SubOnly Message';
            break;
        case 'channel_points_highlighted':
            title_of_event = 'Highlighted';
            break;
        case 'user_intro':
            title_of_event = 'User Intro';
            break;
        case 'power_ups_gigantified_emote':
            title_of_event = 'Big Emote';
            break;
        case 'power_ups_message_effect':
            title_of_event = 'Pretty Chat';
            break;
        default:
            if (channel_points_custom_reward_id) {
                title_of_event = 'ChannelPoints';
            }
    }

    if (title_of_event != '') {
        var r = activity_feed.insertRow(0);

        var cell = r.insertCell();
        cell.textContent = dateTime();
        var cell = r.insertCell();
        cell.textContent = broadcaster_user_login;

        var cell = r.insertCell();
        cell.style.color = color;
        cell.textContent = processName(chatter_user_name, chatter_user_login);

        // what span tier
        var cell = r.insertCell();
        cell.textContent = title_of_event;
        // counts
        var cell = r.insertCell();
        //message
        var cell = r.insertCell();
        buildFromFragments(cell, fragments);
    } else {
        if (cheer) {
            // it's a cheer message
            // bits is the total bits used
            let { bits } = cheer;
            var r = activity_feed.insertRow(0);

            var cell = r.insertCell();
            cell.textContent = dateTime();
            var cell = r.insertCell();
            cell.textContent = broadcaster_user_login;

            var cell = r.insertCell();
            cell.style.color = color;
            cell.textContent = processName(chatter_user_name, chatter_user_login);
            // what span tier
            var cell = r.insertCell();
            cell.textContent = 'Cheer';
            // count
            var cell = r.insertCell();
            cell.textContent = bits;
            //message
            var cell = r.insertCell();
            buildFromFragments(cell, fragments);
        } else {
            //go = false;
            //console.log('Unexpected', message_type, event);
        }
    }
}



function dateTime() {
    let n = new Date();
    let d = [];
    d.push(n.getHours());
    d.push(n.getMinutes());
    d.push(n.getSeconds());
    for (var x=0;x<d.length;x++) {
        if (d[x] < 10) {
            d[x] = `0${d[x]}`;
        }
    }
    return d.join(':');
}

function processTier(tier) {
    switch (tier) {
        case '3000':
            return 'T3';
        case '2000':
            return 'T2';
        case '1000':
            return 'T1';
    }
    return tier;
}
function processName(display, login, is_anon) {
    if (is_anon) {
       return 'Anonymous';
    }
    if (display.trim().toLowerCase() != login.trim()) {
        return `${display} (${login})`;
    }

    return display;
}

let knownCheermotes = {};

function buildFromFragments(chat, fragments) {
    if (fragments == null) {
        var el = document.createElement('span');
        chat.append(el);
        el.textContent = "Fragments is null";

        return;
    }
    for (var x=0;x<fragments.length;x++) {
        let { type, text, cheermote, emote, mention } = fragments[x];
        switch (type) {
            case 'emote':
                var { id, emote_set_id, owner_id, format } = emote;

                var el = document.createElement('img');
                el.setAttribute('src', `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/1.0`);
                el.setAttribute('title', text);
                el.setAttribute('alt', text);

                chat.append(el);
                break;
            case 'text':
                var el = document.createElement('span');
                chat.append(el);
                el.textContent = text;
                break;

            case 'mention':
                var el = document.createElement('span');
                chat.append(el);
                el.textContent = text;
                el.style.backgroundColor = 'red';
                break;

            case 'cheermote':
                var el = document.createElement('span');
                chat.append(el);

                // hmm
                var { prefix, bits, tier } = cheermote;
                prefix = prefix.toLowerCase();
                //knownCheermotes[prefix][id]
                if (knownCheermotes[prefix] && knownCheermotes[prefix][tier]) {
                    var iel = document.createElement('img');
                    iel.setAttribute('src', knownCheermotes[prefix][tier]);
                    el.append(iel);
                    var iel = document.createElement('span');
                    el.append(iel);
                } else {
                    el.textContent = prefix;
                }
                el.textContent += bits + ' ';
                break;

            default:
                var el = document.createElement('span');
                chat.append(el);
                el.textContent = `No Handle ${type}`;

                console.error(fragments[x]);
        }
    }
}

async function loadCheermotes(broadcaster_id) {
    let url = new URL('https://api.twitch.tv/helix/bits/cheermotes');
    url.search = new URLSearchParams([['broadcaster_id', broadcaster_id]]).toString();

    let bitsRequest = await fetch(
        url,
        {
            "headers": {
                "Client-ID": client_id,
                "Authorization": `Bearer ${access_token}`
            }
        }
    );
    if (bitsRequest.status != 200) {
        return;
    }
    let { data } = await bitsRequest.json();

    data.forEach(cheermote => {
        let { prefix, tiers } = cheermote;
        if (tiers && tiers.length > 0) {
            prefix = prefix.toLowerCase();
            knownCheermotes[prefix] = {};

            tiers.forEach(tier => {
                let { can_cheer, id, images } = tier;
                if (can_cheer) {
                    let image = images.dark.animated["1.5"];
                    knownCheermotes[prefix][id] = image;
                }
            });
        }
    });
}
