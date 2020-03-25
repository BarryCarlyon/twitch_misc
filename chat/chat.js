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
const hostRegex = /([a-z_]+)!([a-z_]+)@([a-z._]+)/;

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

        socket.send('JOIN #twitch');
    }).on('message', (raw_data) => {
        let message = raw_data.split('\n');

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
                    socket.send('PONG :' + payload.message);
                    break;

                case 'JOIN':
                    console.log('Joined', payload.room);
                    break;
                case 'USERSTATE':
                case 'ROOMSTATE':
                    break;

                case 'PRIVMSG':
                    // heres where the magic happens
                    break;

                case 'USERNOTICE':
                    break;
                case 'NOTICE':
                    break;

                default:
                    console.log('No Process', payload.command, payload);
            }
        }
    });
}

start();

