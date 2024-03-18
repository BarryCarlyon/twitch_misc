class initSocket {
    counter = 0
    closeCodes = {
        4000: 'Internal Server Error',
        4001: 'Client sent inbound traffic',
        4002: 'Client failed ping-pong',
        4003: 'Connection unused',
        4004: 'Reconnect grace time expired',
        4005: 'Network Timeout',
        4006: 'Network error',
        4007: 'Invalid Reconnect'
    }

    constructor(connect) {
        this._events = {};

        if (connect) {
            this.connect();
        }
    }

    connect(url, is_reconnect) {
        this.eventsub = {};
        this.counter++;

        url = url ? url : 'wss://eventsub.wss.twitch.tv/ws';
        is_reconnect = is_reconnect ? is_reconnect : false;

        log(`Connecting to ${url}|${is_reconnect}`);
        this.eventsub = new WebSocket(url);
        this.eventsub.is_reconnecting = is_reconnect;
        this.eventsub.counter = this.counter;

        this.eventsub.addEventListener('open', () => {
            log(`Opened Connection to Twitch`);
        });
        // https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/close_event
        // https://github.com/Luka967/websocket-close-codes
        this.eventsub.addEventListener('close', (close) => {
            console.log('EventSub close', close, this.eventsub);
            log(`${this.eventsub.twitch_websocket_id}/${this.eventsub.counter} Connection Closed: ${close.code} Reason - ${this.closeCodes[close.code]}`);

            if (!this.eventsub.is_reconnecting) {
                log(`${this.eventsub.twitch_websocket_id}/${this.eventsub.counter} Is not reconnecting, auto reconnect`);
                //new initSocket();
                this.connect();
            }

            if (close.code == 1006) {
                // do a single retry
                this.eventsub.is_reconnecting = true;
            }
        });
        // https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/error_event
        this.eventsub.addEventListener('error', (err) => {
            console.log(err);
            log(`${this.eventsub.twitch_websocket_id}/${this.eventsub.counter} Connection Error`);
        });
        // https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/message_event
        this.eventsub.addEventListener('message', (message) => {
            //log('Message');
            console.log(this.eventsub.counter, message);
            let { data } = message;
            data = JSON.parse(data);

            let { metadata, payload } = data;
            let { message_id, message_type, message_timestamp } = metadata;
            //log(`Recv ${message_id} - ${message_type}`);

            switch (message_type) {
                case 'session_welcome':
                    let { session } = payload;
                    let { id, keepalive_timeout_seconds } = session;

                    log(`${this.eventsub.counter} This is Socket ID ${id}`);
                    this.eventsub.twitch_websocket_id = id;

                    log(`${this.eventsub.counter} This socket declared silence as ${keepalive_timeout_seconds} seconds`);

                    if (!this.eventsub.is_reconnecting) {
                        log('Dirty disconnect or first spawn');
                        this.emit('connected', id);
                        // now you would spawn your topics
                    } else {
                        this.emit('reconnected', id);
                        // no need to spawn topics as carried over
                    }

                    this.silence(keepalive_timeout_seconds);
                    
                    break;
                case 'session_keepalive':
                    //log(`Recv KeepAlive - ${message_type}`);
                    this.emit('session_keepalive');
                    this.silence();
                    break;

                case 'notification':
                    console.log('notification', metadata, payload);
                    log(`${this.eventsub.twitch_websocket_id}/${this.eventsub.counter} Recv notification ${JSON.stringify(payload)}`);

                    let { subscription, event } = payload;
                    let { type } = subscription;

                    this.emit('notification', { metadata, payload });
                    this.emit(type, { metadata, payload });
                    this.silence();

                    break;

                case 'session_reconnect':
                    this.eventsub.is_reconnecting = true;

                    let reconnect_url = payload.session.reconnect_url;

                    console.log('Connect to new url', reconnect_url);
                    log(`${this.eventsub.twitch_websocket_id}/${this.eventsub.counter} Reconnect request ${reconnect_url}`)

                    //this.eventsub.close();
                    //new initSocket(reconnect_url, true);
                    this.connect(reconnect_url, true);

                    break;
                case 'websocket_disconnect':
                    log(`${this.eventsub.counter} Recv Disconnect`);
                    console.log('websocket_disconnect', payload);

                    break;

                case 'revocation':
                    log(`${this.eventsub.counter} Recv Topic Revocation`);
                    console.log('revocation', payload);
                    this.emit('revocation', { metadata, payload });
                    break;

                default:
                    console.log(`${this.eventsub.counter} unexpected`, metadata, payload);
                    break;
            }
        });
    }

    trigger() {
        // this function lets you test the disconnect on send method
        this.eventsub.send('cat');
    }
    close() {
        this.eventsub.close();
    }

    silenceHandler = false;
    silenceTime = 10;// default per docs is 10 so set that as a good default
    silence(keepalive_timeout_seconds) {
        if (keepalive_timeout_seconds) {
            this.silenceTime = keepalive_timeout_seconds;
            this.silenceTime++;// add a little window as it's too anal
        }
        clearTimeout(this.silenceHandler);
        this.silenceHandler = setTimeout(() => {
            this.emit('session_silenced');// -> self reconnecting
            this.close();// close it and let it self loop
        }, (this.silenceTime * 1000));
    }
    
    on(name, listener) {
        if (!this._events[name]) {
            this._events[name] = [];
        }

        this._events[name].push(listener);
    }
    emit(name, data) {
        if (!this._events[name]) {
            return;
        }

        const fireCallbacks = (callback) => {
            callback(data);
        };

        this._events[name].forEach(fireCallbacks);
    }
}

function log(msg) {
    if (!document.getElementById('log')) {
        return;
    }

    let div = document.createElement('div');
    document.getElementById('log').prepend(div);

    let tim = document.createElement('span');
    div.append(tim);
    let t = [
        new Date().getHours(),
        new Date().getMinutes(),
        new Date().getSeconds()
    ]
    t.forEach((v,i) => {
        t[i] = v < 10 ? '0'+v : v;
    });
    tim.textContent = t.join(':');

    let sp = document.createElement('span');
    div.append(sp);
    sp.textContent = msg;
}
