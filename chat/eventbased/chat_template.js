'use strict';

const util = require('util');
const EventEmitter = require('events').EventEmitter;

const WebSocket = require('ws');

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

class ChatBot extends EventEmitter {
    constructor(opts) {
        super();

        this.reconnect = true;
        this.ws = null;
        this.pinger = {
            clock: false,
            start: () => {
                if (this.pinger.clock) {
                    clearInterval(this.pinger.clock);
                }
                this.pinger.sendPing();

                this.pinger.clock = setInterval(() => {
                    setTimeout(() => {
                        this.pinger.sendPing();
                        //jitter
                    }, Math.floor((Math.random() * 1000) + 1));
                }, (4 * 60 * 1000));
                // at least ever 5 minutes
            },
            sendPing: () => {
                try {
                    this.ws.send('PING');
                    this.pinger.awaitPong();
                } catch (e) {
                    console.log(e);

                    this.ws.close();
                }
            },

            pingtimeout: false,
            awaitPong: () => {
                this.pinger.pingtimeout = setTimeout(() => {
                    //console.log('WS Pong Timeout');
                    this.ws.close();
                }, 10000)
            },
            gotPong: () => {
                clearTimeout(this.pinger.pingtimeout);
            }
        }
    }

    connect() {
        console.log('init');
        this.ws = new WebSocket('wss://irc-ws.chat.twitch.tv');

        this.ws.onmessage = this._onMessage.bind(this);
        this.ws.onerror = this._onError.bind(this);
        this.ws.onclose = this._onClose.bind(this);
        this.ws.onopen = this._onOpen.bind(this);
    }
    _reconnect() {
        this.ws = null;
        this.connect();
    }

    _onError() {
        console.log('Got Error');
        // reconnect
        this.emit('close');

        if (this.reconnect) {
            console.log('Reconnecting');
            this._reconnect();
        }
    }
    _onClose() {
        console.log('Got Close');
        // reconnect
        this.emit('close');

        if (this.reconnect) {
            console.log('Reconnecting');
            this._reconnect();
        }
    }
    _onOpen() {
        // pinger
        this.pinger.start();

        this.ws.send('CAP REQ :twitch.tv/commands');
        this.ws.send('CAP REQ :twitch.tv/tags');

        this.emit('open');
    }
    _onMessage(event) {
        let message = event.data.toString().trim().split(/\r?\n/);
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
                        }
                    }
                } while (m);

                // Javascript magic helper
                for (let key in payload.tags) {
                    ley new_key = key.replace(/-/g, '_');
                    payload.tags[new_key] = payload[key];
                }
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
            // commands the template needs to reply
            switch (payload.command) {
                case 'PING':
                    // Twitch sent a "R U STILL THERE?"
                    this.ws.send('PONG :' + payload.message);
                case 'PONG':
                    this.pinger.gotPong();
                    break;
            }

            switch (payload.command) {
                case '001':
                case '002':
                case '003':
                case '004':
                    // do nothing
                    break;
                case 'CAP':
                    this.emit('CAP ACK', payload.raw);
                    break;
                case '372':
                case '375':
                case '376':
                    // motd
                    this.emit('MOTD', payload.raw);
                    break;
                case '353':
                case '366':
                    // names
                    break;

                case 'PING':
                case 'PONG':

                case 'JOIN':
                    // You joined a room
                case 'PART':
                    // as the result of a PART command
                    // you left a room

                case 'GLOBALUSERSTATE':
                    // You connected to the server
                    // here is some info about the user
                case 'USERSTATE':
                    // Often sent when you send a PRIVMSG to a room
                case 'ROOMSTATE':
                    // You joined a room here is the intial state (followers only etc)
                    // The Room state was changed, on change only sends what changed, not the whole settings blob

                case 'WHISPER':
                    // you received a whisper, good luck replying!
                case 'PRIVMSG':
                    // heres where the magic happens

                    if (payload.hasOwnProperty('tags')) {
                        if (payload.tags.hasOwnProperty('bits')) {
                            // it's a cheer message
                            // but it's also a privmsg
                            this.emit(
                                'cheer',
                                payload
                            );
                        }
                    }

                case 'USERNOTICE':
                    // see https://dev.twitch.tv/docs/irc/tags#usernotice-twitch-tags
                    // An "Twitch event" occured, like a subscription or raid

                    if (payload.hasOwnProperty('tags')) {
                        if (payload.tags.hasOwnProperty('msg-id')) {
                            this.emit(
                                `usernotice_${payload.tags['msg-id']}`,
                                payload
                            );
                        }
                    }

                case 'NOTICE':
                    // General notices about Twitch/rooms you are in
                    // https://dev.twitch.tv/docs/irc/commands#notice-twitch-commands

                // moderationy stuff
                case 'CLEARCHAT':
                    // A users message is to be removed
                    // as the result of a ban or timeout
                case 'CLEARMSG':
                    // a single users message was deleted
                case 'HOSTTARGET':
                    // the room you are in, is now hosting someone or has ended the host

                    this.emit(
                        payload.command,
                        payload
                    );
                    this.emit(
                        payload.command.toLowerCase(),
                        payload
                    );
                    break;

                case 'RECONNECT':
                    // The server you are connected to is restarted
                    // you should restart the bot and reconnect

                    // close the socket and let the close handler grab it
                    this.ws.close();
                    break;

                default:
                    console.log('No Process', payload.command, payload);
            }
        }
    }

    login = function(username, user_token, rooms) {
        this.ws.send(`PASS oauth:${user_token}`);
        this.ws.send(`NICK ${username}`);

        if (typeof rooms == 'undefined') {
            rooms = [];
        } else if (typeof rooms == 'string') {
            rooms = [rooms];
        }
        // could also concat joins....
        for (let x=0;x<rooms.length;x++) {
            if (!rooms[x].startsWith('#')) {
                rooms[x] = `#${rooms[x]}`;
            }
            this.ws.send(`JOIN ${rooms[x]}`);
        }
    }
    send = function(room, message) {
        if (!room.startsWith('#')) {
            room = '#'+room;
        }
        console.log('>' + `PRIVMSG ${room} :${message}`);
        this.ws.send(`PRIVMSG ${room} :${message}`);
    }
    reply = function(room, id, message) {
        console.log(`@reply-parent-msg-id=${id} PRIVMSG ${room} :${message}`);
        this.ws.send(`@reply-parent-msg-id=${id} PRIVMSG ${room} :${message}`);
    }

    close = function() {
        try {
            this.ws.close();
        } catch (err) {
            console.log(err);
        }
    }
}

module.exports = ChatBot;
