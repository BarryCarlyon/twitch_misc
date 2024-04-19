function runLine({ payload }) {
    let { event } = payload;

    let { system_message, notice_type, message } = event;

    let { text, fragments } = message;

    // channel
    let { broadcaster_user_name, broadcaster_user_login, broadcaster_user_id } = event;
    // entity
    let { chatter_user_name, chatter_user_login, chatter_user_id, color, chatter_is_anonymous } = event;

    //let { gifter_user_name, gifter_user_login, gifter_user_id } = event;
    //let { recipient_user_name, recipient_user_login, recipient_user_id } = event;

    switch (notice_type) {
        case 'sub':
            let { sub } = event;
            var { duration_months, is_prime, sub_tier } = sub;

            var r = activity_feed.insertRow(0);
            r.setAttribute('title', system_message);
            var cell = r.insertCell();
            cell.textContent = broadcaster_user_login;

            var cell = r.insertCell();
            cell.style.color = color;
            cell.textContent = processName(chatter_user_name, chatter_user_login);

            var cell = r.insertCell();
            cell.textContent = 'New Sub';

            var cell = r.insertCell();
            cell.textContent = sub_tier;
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
            cell.textContent = broadcaster_user_login;

            var cell = r.insertCell();
            cell.style.color = color;
            cell.textContent = processName(chatter_user_name, chatter_user_login);

            var cell = r.insertCell();
            cell.textContent = 'Resub';
            var cell = r.insertCell();
            cell.textContent = sub_tier;
            var cell = r.insertCell();
            if (streak_months) {
                cell.textContent = `${cumulative_months} months for ${streak_months} streak`;
            } else {
                cell.textContent = `${cumulative_months} months`;
            }

            var cell = r.insertCell();
            if (is_prime) {
                text = `With Twitch Prime: ${text}`;
            }
            cell.textContent = text;

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
                    // or _wait_
                    setTimeout(() => {
                        runLine({ payload })
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
                cell.textContent = broadcaster_user_login;

                var cell = r.insertCell();
                cell.style.color = color;
                cell.textContent = processName(chatter_user_name, chatter_user_login, chatter_is_anonymous);

                var cell = r.insertCell();
                cell.textContent = 'Direct Gift';
                var cell = r.insertCell();
                cell.textContent = sub_tier;

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
            cell.textContent = broadcaster_user_login;

            var cell = r.insertCell();
            cell.style.color = color;
            cell.textContent = processName(chatter_user_name, chatter_user_login, chatter_is_anonymous);

            var cell = r.insertCell();
            cell.textContent = 'Community Gift';
            var cell = r.insertCell();
            cell.textContent = sub_tier;

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
            cell.textContent = broadcaster_user_login;

            var cell = r.insertCell();
            cell.style.color = color;
            cell.textContent = processName(chatter_user_name, chatter_user_login);

            var cell = r.insertCell();
            cell.textContent = 'Paying it Forward';
            var cell = r.insertCell();
            // tier
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
            cell.textContent = broadcaster_user_login;

            var cell = r.insertCell();
            cell.style.color = color;
            cell.textContent = processName(chatter_user_name, chatter_user_login);
            var cell = r.insertCell();
            cell.textContent = 'Gift Upgrade';
            var cell = r.insertCell();
            // tier
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
            cell.textContent = broadcaster_user_login;

            var cell = r.insertCell();
            cell.style.color = color;
            cell.textContent = processName(chatter_user_name, chatter_user_login);
            var cell = r.insertCell();
            cell.textContent = 'Prime Upgrade';
            var cell = r.insertCell();
            cell.textContent = sub_tier;
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
            var cell = r.insertCell();
            cell.textContent = `Raiding with ${viewer_count} viewers`;

            break;

        case 'announcement':
            // skip
            break;
        default:
            go = false;
            console.log('Unexpected', notice_type, event);
    }
}

function processName(display, login, is_anon) {
    if (is_anon) {
       return 'Anonymous';
    }
    if (display.toLowerCase() != login) {
        return `${display} (${login})`;
    }

    return display;
}
