'use strict';

const util = require('util');
const EventEmitter = require('events').EventEmitter;

const WebSocket = require('ws');

class ChatBot extends EventEmitter {
    constructor(opts) {
        super();

        opts = opts || {};

        this._anonymous = true;
        this._autoTokenTime = 3600;//an hour
        this._username = '';
        this._userId = '';
        this.reconnect = opts.reconnect || true;

        this.access_token = opts.access_token || '';
        this.refresh_token = opts.refresh_token || '';
        this.client_secret = opts.client_secret || '';
        this.client_id = opts.client_id || '';

        this.channels = opts.channels || [];

        // check if string/convert to an array
        if (typeof this.channels == 'string') {
            this.channels = this.channels.split(',');
        }

        if (this.access_token != '') {
            this._anonymous = false;
            console.debug('Bot will boot with access token');

            if (this.refresh_token != '' && this.client_secret == '') {
                throw ('A Refresh Token was provided but no client secret');
            }
        } else {
            this._username = 'justinfan'+(Math.floor(Math.random()*100));
        }

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

    async _tokenMaintainece() {
        return new Promise(async (resolve, reject) => {
            let token_validation_response = await fetch(
                'https://id.twitch.tv/oauth2/validate',
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.access_token}`,
                        'Accept': 'application/json'
                    }
                }
            );
            if (token_validation_response.status == 200) {
                // token passed validation
                let token_validation_data = await token_validation_response.json();

                this.client_id  = token_validation_data.client_id;
                this._username  = token_validation_data.login;
                this._userId    = token_validation_data.user_id;

                console.log('Init data as', this.client_id, this._username, this._userId);

                // check scopes?

                if (this.refresh_token != '' && token_validation_data.expires_in < this._autoTokenTime) {
                    // auto refresh the token
                    let token_refresh_url = new URL('https://id.twitch.tv/oauth2/token');
                    token_refresh_url.search = new URLSearchParams([
                        [ 'client_id', this.client_id ],
                        [ 'client_secret', this.client_secret ],
                        [ 'grant_type', 'refresh_token' ],
                        [ 'refresh_token', this.refresh_token ]
                    ]).toString();

                    let token_refresh_response = await fetch(
                        token_refresh_url,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'Accept': 'application/json'
                            }
                        }
                    );

                    if (token_refresh_response.status == 200) {
                        // token refresh ok
                        let token_refresh_data = await token_refresh_response.json();

                        this.emit('token_regnerated', token_refresh_data);

                        this.access_token   = token_refresh_data.access_token;
                        this.refresh_token  = token_refresh_data.refresh_token;

                        return resolve();
                    }

                    return reject(`Token Refresh Failed: ${await token_validation_response.text()}`);
                }

                return resolve();
            }

            return reject(`Failed to validate the token ${await token_validation_response.text()}`);
        });
    }

    async connect() {
        console.log('init');

        // if token do token
        if (!this._anonymous) {
            try {
                await this._tokenMaintainece();
                console.log('Token cleared Maintainece');
            } catch (e) {
                console.log(e);
                console.error('An Error Occured during token validation');
                return;
            }

            // auto token every 15 minutes
            setInterval(async () => {
                await this._tokenMaintainece();
                console.log('Token cleared auto Maintainece');
            }, (15 * 60 * 1000));
        }

        // go do it
        this.ws = new WebSocket('wss://irc-ws.chat.twitch.tv');

        this.ws.onmessage = this._onMessage.bind(this);
        this.ws.onerror = this._onError.bind(this);
        this.ws.onclose = this._onClose.bind(this);
        this.ws.onopen = this._onOpen.bind(this);

        // setup maintain timer
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

        this.emit('opened');

        console.log('Login with', this._username, this.access_token, this._anonymous);

        // auto connect
        if (this._anonymous) {
            console.log('is anon');
            this.ws.send(`PASS oauth:empty`);
        } else {
            console.log('is real');
            this.ws.send(`PASS oauth:${this.access_token}`);
        }
        this.ws.send(`NICK ${this._username}`);

        // and rooms
        if (this.channels.length > 0) {
            this.join(this.channels);
        }
    }
    _onMessage(event) {
        let messages = event.data.toString().trim().split(/\r?\n/);

        //messages.forEach(this._parse);
        for (var x=0;x<messages.length;x++) {
            this.emit('raw', messages[x]);
            this._parse(messages[x]);
        }
    }

    // prefix parser from
    // https://github.com/osslate/irc-prefix-parser/blob/master/index.js
    _parsePrefix(prefix) {
        if (!prefix || prefix.length === 0) {
            return null
        }

        var dpos = prefix.indexOf('.') + 1
        var upos = prefix.indexOf('!') + 1
        var hpos = prefix.indexOf('@', upos) + 1

        if (upos === 1 || hpos === 1) {
            return null
        }

        var result = {}
        result.raw = prefix
        result.isServer = false
        result.nick = null
        result.user = null
        result.host = null

        if (upos > 0) {
            result.nick = prefix.slice(0, upos - 1)
            if (hpos > 0) {
                result.user = prefix.slice(upos, hpos - 1)
                result.host = prefix.slice(hpos)
            } else {
                result.user = prefix.slice(upos)
            }
        } else if (hpos > 0) {
            result.nick = prefix.slice(0, hpos - 1)
            result.host = prefix.slice(hpos)
        } else if (dpos > 0) {
            result.host = prefix
            result.isServer = true
        } else {
            result.nick = prefix
        }

        return result
    }
    _parse(data) {
        // parsing time
        //console.log(message);
        var message = {
            raw: data,
            tags: {},
            prefix: null,
            command: null,
            params: []
        }

        // this borrows a lot from
        // https://github.com/osslate/irc-message/blob/master/index.js
        // Which has BSD-2-Clause license

        var position = 0;
        var nextspace = 0;

        // Is this message including ircV3 tags
        // http://ircv3.atheme.org/specification/message-tags-3.2
        if (data.charCodeAt(0) === 64) {
            var nextspace = data.indexOf(' ')

            if (nextspace === -1) {
                // Malformed IRC message.
                return null
            }

            // Tags are split by a semi colon.
            var rawTags = data.slice(1, nextspace).split(';')

            for (var i = 0; i < rawTags.length; i++) {
                // Tags delimited by an equals sign are key=value tags.
                // If there's no equals, we assign the tag a value of true.
                var tag = rawTags[i]
                var pair = tag.split('=')
                message.tags[pair[0]] = pair[1] || true

                if (pair[1] !== true && pair[1] != '') {
                    // is this IRCv3 tag a relevant Twitch tag
                    switch (pair[0]) {
                        case 'badge-info':
                        case 'badges':
                            // both badges and badge info use the same formatting
                            // but badge-info tends to be a single badge

                            // badge/version,badge/version
                            // badges are generlal max 5
                            // and ordered as they should be displayed
                            let badges_data = pair[1].split(',');
                            let badges = {};

                            badges_data.forEach(badge_data => {
                                let [ badge, version ] = badge_data.split('/');
                                badges[badge] = version;
                            });

                            message.tags[pair[0]] = badges;
                            break;

                        case 'emotes':
                            // formatting is
                            // emote_id:start-end,emote_id:start-end,start-end
                            let emotes_groups = pair[1].split('/');
                            let emote_data = {};
                            emotes_groups.forEach(emotes_group => {
                                let [ emote_id, emote_positions ] = emotes_group.split(':');
                                emote_data[emote_id] = [];

                                emote_positions = emote_positions.split(',');
                                emote_positions.forEach(position => {
                                    //emote_data[emote_id].push(position.split('-'));

                                    let [ start, end ] = position.split('-');
                                    // we'll parseInt these
                                    // as they are numerical positions
                                    emote_data[emote_id].push([
                                        parseInt(start),
                                        parseInt(end)
                                    ]);
                                });
                            });
                            message.tags[pair[0]] = emote_data;

                            break;
                    }
                }
            }

            position = nextspace + 1
        }

        // Skip any trailing whitespace.
        while (data.charCodeAt(position) === 32) {
            position++
        }

        // Extract the message's prefix if present. Prefixes are prepended
        // with a colon.

        if (data.charCodeAt(position) === 58) {
            nextspace = data.indexOf(' ', position)

            // If there's nothing after the prefix, deem this message to be
            // malformed.
            if (nextspace === -1) {
                // Malformed IRC message.
                return null
            }

            message.prefix = data.slice(position + 1, nextspace)
            position = nextspace + 1

            // Skip any trailing whitespace.
            while (data.charCodeAt(position) === 32) {
                position++
            }
        }

        nextspace = data.indexOf(' ', position)

        // If there's no more whitespace left, extract everything from the
        // current position to the end of the string as the command.
        if (nextspace === -1) {
            if (data.length > position) {
                message.command = data.slice(position)
                return message
            }

            return null
        }

        // Else, the command is the current position up to the next space. After
        // that, we expect some parameters.
        message.command = data.slice(position, nextspace)

        position = nextspace + 1

        // Skip any trailing whitespace.
        while (data.charCodeAt(position) === 32) {
            position++
        }

        while (position < data.length) {
            nextspace = data.indexOf(' ', position)

            // If the character is a colon, we've got a trailing parameter.
            // At this point, there are no extra params, so we push everything
            // from after the colon to the end of the string, to the params array
            // and break out of the loop.
            if (data.charCodeAt(position) === 58) {
                message.params.push(data.slice(position + 1))
                break
            }

            // If we still have some whitespace...
            if (nextspace !== -1) {
                // Push whatever's between the current position and the next
                // space to the params array.
                message.params.push(data.slice(position, nextspace))
                position = nextspace + 1

                // Skip any trailing whitespace and continue looping.
                while (data.charCodeAt(position) === 32) {
                    position++
                }

                continue
            }

            // If we don't have any more whitespace and the param isn't trailing,
            // push everything remaining to the params array.
            if (nextspace === -1) {
                message.params.push(data.slice(position))
                break
            }
        }

        message.prefix = this._parsePrefix(message.prefix);

        //console.log(message);
        this._relay(message);
    }
    _relay(message) {
        this.emit('raw_parsed', message);
        // determine what we want to emit
        // and/or if we have an auto task to do

        // auto tasks

        // https://tools.ietf.org/html/rfc1459
        // commands the template needs to reply
        switch (message.command) {
            case 'PING':
                // Twitch sent a "R U STILL THERE?"
                this.ws.send('PONG :' + message.params[1]);
            case 'PONG':
                this.pinger.gotPong();
                break;
        }

        // regular sutff :tm:
        //console.debug(message.command);

        switch (message.command) {
            case '001':
            case '002':
            case '003':
            case '004':
                // startup
            case '353':
            case '366':
                // names

                // above list of things
                // we "ignore" and don't emit
                // but we switch on them to stop
                // the no process
                break;

            case 'CAP':
                this.emit('CAP', message.raw);
                break;
            case '372':
            case '375':
            case '376':
                // motd
                this.emit('MOTD', message.raw);
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

                if (message.hasOwnProperty('tags')) {
                    if (message.tags.hasOwnProperty('bits')) {
                        // it's a cheer message
                        // but it's also a privmsg
                        this.emit(
                            'cheer',
                            message
                        );
                    }
                }

            case 'USERNOTICE':
                // see https://dev.twitch.tv/docs/irc/tags#usernotice-twitch-tags
                // An "Twitch event" occured, like a subscription or raid

                if (message.hasOwnProperty('tags')) {
                    if (message.tags.hasOwnProperty('msg-id')) {
                        this.emit(
                            message.tags['msg-id'],
                            message
                        );

                        this.emit(
                            `usernotice_${message.tags['msg-id']}`,
                            message
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

                // all things that dropped here
                // send/relay the event
                this.emit(
                    message.command,
                    message
                );
                this.emit(
                    message.command.toLowerCase(),
                    message
                );
                break;

            case 'RECONNECT':
                // The server you are connected to is restarted
                // you should restart the bot and reconnect

                this.emit(
                    message.command,
                    message
                );
                this.emit(
                    message.command.toLowerCase(),
                    message
                );

                // close the socket and let the close handler grab it
                this.ws.close();
                break;

            default:
                console.log('No Process', message.command, message);
        }
    }

    _roomHash = function(room) {
        if (!room.startsWith('#')) {
            room = '#'+room
        }
        room.toLowerCase();

        return room;
    }

    join = function(rooms) {
        rooms.forEach((room, index, rooms) => {
            rooms[index] = this._roomHash(room);
        })
        //process.exit();
        this.ws.send(`JOIN ${rooms.join(',')}`);
    }
    send = function(room, message) {
        room = this._roomHash(room);
        console.log(`>PRIVMSG ${room} :${message}`);
        this.ws.send(`PRIVMSG ${room} :${message}`);
    }
    reply = function(room, id, message) {
        room = this._roomHash(room);
        //console.log(`@reply-parent-msg-id=${id} PRIVMSG ${room} :${message}`);
        this.ws.send(`@reply-parent-msg-id=${id} PRIVMSG ${room} :${message}`);
    }


    close = function() {
        try {
            this.ws.close();
        } catch (err) {
            console.log(err);
        }
    }





    timeout = function(room_id, user_id, duration, reason) {
        this._banUser(
            room_id,
            {
                data: {
                    user_id,
                    duration: duration,
                    reason
                }
            }
        );
    }
    ban = function(room_id, user_id, reason) {
        this._banUser(
            room_id,
            {
                data: {
                    user_id,
                    reason
                }
            }
        );
    }
    _banUser = async function(broadcaster_id, payload) {
        //await this._tokenMaintainece();

        let url = new URL('https://api.twitch.tv/helix/moderation/bans');
        url.search = new URLSearchParams([
            [ 'broadcaster_id', broadcaster_id ],
            [ 'moderator_id', this._userId ]
        ]).toString();

        console.log('_banUser', url, payload);

        let ban_user_response = await fetch(
            url,
            {
                method: 'POST',
                headers: {
                    'Client-ID': this.client_id,
                    'Authorization': `Bearer ${this.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            }
        );
        this.emit('ban_user_response', ban_user_response);
        // promise return instead
    }

    delete = function(room_id, message_id) {
        let url = new URL('https://api.twitch.tv/helix/moderation/chat');
        url.search = new URLSearchParams([
            [ 'broadcaster_id', broadcaster_id ],
            [ 'moderator_id', this._userId ],
            [ 'message_id', message_id ]
        ]).toString();
        this._delete(url);
    }
    clear = function(room_id) {
        let url = new URL('https://api.twitch.tv/helix/moderation/chat');
        url.search = new URLSearchParams([
            [ 'broadcaster_id', broadcaster_id ],
            [ 'moderator_id', this._userId ]
        ]).toString();
        this._delete(url);
    }
    _delete = async function(url) {
        //await this._tokenMaintainece();

        let delete_response = await fetch(
            url,
            {
                method: 'DELETE',
                headers: {
                    'Client-ID': this.client_id,
                    'Authorization': `Bearer ${this.access_token}`
                }
            }
        );
        this.emit('delete_response', delete_response);
        // promise return instead
    }

    announcement = async function(room_id, message, color) {
        color = color || 'primary';

        //await this._tokenMaintainece();

        let url = new URL('https://api.twitch.tv/helix/chat/announcements');
        url.search = new URLSearchParams([
            [ 'broadcaster_id', room_id ],
            [ 'moderator_id', this._userId ]
        ]).toString();

        let announcement_response = await fetch(
            url,
            {
                method: 'POST',
                headers: {
                    'Client-ID': this.client_id,
                    'Authorization': `Bearer ${this.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    color
                })
            }
        );
        //console.debug('announcement_response', announcement_response.status, await announcement_response.text());
        this.emit('announcement_response', announcement_response);
    }

    // kinda dumb util...
    emoteOnly = function(room_id, emote_mode) {
        this._updateChatSettings(room_id, {
            emote_mode
        });
    }
    emoteOnlyOn = function(room_id) {
        this._updateChatSettings(room_id, {
            emote_mode: true
        });
    }
    emoteOnlyOff = function(room_id) {
        this._updateChatSettings(room_id, {
            emote_mode: false
        });
    }

    followersOn = function(room_id, follower_mode_duration) {
        this._updateChatSettings(room_id, {
            follower_mode: true,
            follower_mode_duration
        });
    }
    followersOff = function(room_id) {
        this._updateChatSettings(room_id, {
            follower_mode: false
        });
    }

    slowOn = function(room_id, slow_mode_wait_time) {
        if (slow_mode_wait_time < 3 || slow_mode_wait_time > 120) {
            throw new Error('Slow Mode Duration must be between 3 and 120 seconds');
        }

        this._updateChatSettings(room_id, {
            slow_mode: true,
            slow_mode_wait_time
        });
    }
    slowOff = function(room_id) {
        this._updateChatSettings(room_id, {
            slow_mode: false
        });
    }

    subscribersOn = function(room_id) {
        this._updateChatSettings(room_id, {
            subscriber_mode: true
        });
    }
    subscribersOff = function(room_id) {
        this._updateChatSettings(room_id, {
            subscriber_mode: false
        });
    }

    uniqueOn = function(room_id) {
        this._updateChatSettings(room_id, {
            unique_chat_mode: true
        });
    }
    uniqueOff = function(room_id) {
        this._updateChatSettings(room_id, {
            unique_chat_mode: false
        });
    }

    _updateChatSettings = async function(room_id, payload) {
        //await this._tokenMaintainece();

        let url = new URL('https://api.twitch.tv/helix/chat/settings');
        url.search = new URLSearchParams([
            [ 'broadcaster_id', room_id ],
            [ 'moderator_id', this._userId ]
        ]).toString();

        let chat_settings_response = await fetch(
            url,
            {
                method: 'POST',
                headers: {
                    'Client-ID': this.client_id,
                    'Authorization': `Bearer ${this.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            }
        );
        this.emit('update_chat_settings_response', chat_settings_response);
    }
}

module.exports = ChatBot;
