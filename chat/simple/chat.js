'use strict';

const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const pinger = {
    clock: false,
    start: () => {
        if (pinger.clock) {
            clearInterval(pinger.clock);
        }
        pinger.sendPing();

        pinger.clock = setInterval(function() {
            setTimeout(function() {
                pinger.sendPing();
                //jitter
            }, Math.floor((Math.random() * 1000) + 1));
        }, (4 * 60 * 1000));
        // at least ever 5 minutes
    },
    sendPing: () => {
        try {
            socket.send('PING');
            pinger.awaitPong();
        } catch (e) {
            console.log(e);

            socket.close();
        }
    },

    pingtimeout: false,
    awaitPong: () => {
        pinger.pingtimeout = setTimeout(() => {
            console.log('WS Pong Timeout');
            socket.close();
        }, 10000)
    },
    gotPong: () => {
        clearTimeout(pinger.pingtimeout);
    }
}

const ircRegex = /^(?:@([^ ]+) )?(?:[:](\S+) )?(\S+)(?: (?!:)(.+?))?(?: [:](.+))?$/;
const tagsRegex = /([^=;]+)=([^;]*)/g;
const badgesRegex = /([^,]+)\/([^,]*)/g;
const emotesRegex = /([^\/]+):([^\/]*)/g;
const emoteIndexRegex = /([^,]+)-([^,]*)/g;
const actionRegex = /^\u0001ACTION (.*)\u0001$/g;
// can't do a username.tmi.twitch.tv since the latter part of the host could change at any point
// course this is just a relately standard IRC parser anyway.
// but this will trip a ReDoS scanner since >= 10
// A Twitch username is up to 25 letters, we'll leave some wiggle room
const hostRegex = /([a-z_0-9]{1,30})!([a-z_0-9]{1,30})@([a-z._0-9]{1,60})/;

let socket;
const start = function() {
    socket = new WebSocket('wss://irc-ws.chat.twitch.tv');

    socket.on('close', () => {
        console.log('Closed restarting');
        // reconnect
        start();
    }).on('open', () => {
        console.log('Opened');
        // pinger
        pinger.start();

        console.log('Send Conn stuff');

        socket.send('PASS nopass');
        socket.send('NICK justinfan1337');

        socket.send('CAP REQ :twitch.tv/commands');
        socket.send('CAP REQ :twitch.tv/tags');

        socket.send('JOIN #barrycarlyon');
    }).on('message', (raw_data) => {
        let message = raw_data.toString().trim().split(/\r?\n/);
        // uncomment this line to log all inbounc messages
        //console.log(message);

        for (var x=0;x<message.length;x++) {
            // the last line is empty
            if (message[x].length == 0) {
                return;
            }

            let payload = {
                tags: {},
                command: false,
                message: '',
                raw: message[x]
            }

            const data = ircRegex.exec(message[x].trim());

            if (data === null) {
                console.error(`Couldnt parse message '${message[x]}'`);
                return;
            }

            // items
            // 0 is unparsed message
            // 1 ircV3 tags
            // 2 tmi.twitch.tv
            // 3 COMMAND
            // 4 Room
            // 5 rest/message

            // 0 ignore

            // 1 tags
            let tagdata = data[1] ? data[1] : false;
            if (tagdata) {
                let m;
                do {
                    m = tagsRegex.exec(tagdata);
                    if (m) {
                        // unparsed, a, b
                        const [, key, val] = m;

                        // interrupts
                        switch (key) {
                            case 'badges':
                            case 'badge-info':
                                payload.tags[key] = {};

                                let b;
                                do {
                                    b = badgesRegex.exec(val);
                                    if (b) {
                                        const [, badge, tier] = b;
                                        payload.tags[key][badge] = tier;
                                    }
                                } while (b);
                                break;
                            case 'emotes':
                                payload.tags[key] = {};

                                let e;
                                do {
                                    e = emotesRegex.exec(val);
                                    if (e) {
                                        const [, emoteID, indices] = e;
                                        // and split again

                                        let em;
                                        do {
                                            em = emoteIndexRegex.exec(indices);

                                            if (em) {
                                                const [, startIndex, endIndex] = em;

                                                // arrays!
                                                if (!payload.tags[key][emoteID]) {
                                                    payload.tags[key][emoteID] = new Array();
                                                }
                                                payload.tags[key][emoteID].push({
                                                    startIndex,
                                                    endIndex
                                                });
                                            }
                                        } while (em);
                                    }
                                } while (e);
                                break;
                            default:
                                payload.tags[key] = val.replace(/\\s/g, ' ').trim();// for \s (space)
                                //// dupe - keys for ease
                                //if (key.indexOf('-') >= 0) {
                                //    let dupeKey = key.replace(/-/g, '_');
                                //    payload.tags[dupeKey] = val.replace(/\\s/g, ' ').trim();// for \s (space)
                                //}
                        }
                    }
                } while (m);
            }

            // 2 host
            let host = hostRegex.exec(data[2]);
            payload.user = false;
            if (host != null) {
                payload.user = host[1];
            }

            // 3 command
            payload.command = data[3];

            // 4 room
            payload.room = data[4];
            // 5 message
            payload.message = data[5];
            payload.action = false;

            // check for action
            const actionCheck = actionRegex.exec(payload.message);
            if (actionCheck != null) {
                // it's an action
                payload.action = true;
                payload.message = actionCheck[1];
            }

            // https://tools.ietf.org/html/rfc1459
            switch (payload.command) {
                case 'PONG':
                    console.log('Pong');
                    pinger.gotPong();
                    break;
                case '001':
                case '002':
                case '003':
                case '004':
                    // do nothing
                    break;
                case 'CAP':
                    console.log('CAP ACK', payload.raw);
                    break;
                case '372':
                case '375':
                case '376':
                    // motd
                    //console.log('Hello', payload.room);
                    break;
                case '353':
                case '366':
                    // names
                    break;

                case 'PING':
                    // Twitch sent a "R U STILL THERE?"
                    socket.send('PONG :' + payload.message);
                    break;

                case 'JOIN':
                    // You joined a room
                    console.log('Joined', payload.room);
                    break;
                case 'PART':
                    // as the result of a PART command
                    // you left a room
                    break;

                case 'GLOBALUSERSTATE':
                    // You connected to the server
                    // here is some info about the user
                    break;
                case 'USERSTATE':
                    // Often sent when you send a PRIVMSG to a room
                    break;
                case 'ROOMSTATE':
                    // You joined a room here is the intial state (followers only etc)
                    // The Room state was changed, on change only sends what changed, not the whole settings blob
                    break;

                case 'PRIVMSG':
                    // heres where the magic happens
                    console.log(`${payload.user} wrote ${payload.message}`);
                    break;
                case 'WHISPER':
                    // you received a whisper, good luck replying!
                    break;

                case 'USERNOTICE':
                    // see https://dev.twitch.tv/docs/irc/tags#usernotice-twitch-tags
                    // An "Twitch event" occured, like a subscription or raid
                    break;
                case 'NOTICE':
                    // General notices about Twitch/rooms you are in
                    // https://dev.twitch.tv/docs/irc/commands#notice-twitch-commands
                    break;
                case 'RECONNECT':
                    // The server you are connected to is restarted
                    // you should restart the bot and reconnect

                    // close the socket and let the close handler grab it
                    socket.close();
                    break;

                // moderationy stuff
                case 'CLEARCHAT':
                    // A users message is to be removed
                    // as the result of a ban or timeout
                    break;
                case 'CLEARMSG':
                    // a single users message was deleted
                    break;
                case 'HOSTTARGET':
                    // the room you are in, is now hosting someone or has ended the host
                    break;

                default:
                    console.log('No Process', payload.command, payload);
            }
        }
    });
}

start();

