import { EventEmitter } from 'events';
import WebSocket from 'ws';

class eventsubSocket extends EventEmitter {
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
        super();

        if (connect) {
            this.connect();
        }
    }

    connect(url, is_reconnect) {
        this.eventsub = {};
        this.counter++;

        url = url ? url : 'wss://eventsub.wss.twitch.tv/ws';
        is_reconnect = is_reconnect ? is_reconnect : false;

        console.log(`Connecting to ${url}|${is_reconnect}`);
        this.eventsub = new WebSocket(url);
        this.eventsub.is_reconnecting = is_reconnect;
        this.eventsub.counter = this.counter;

        this.eventsub.addEventListener('open', () => {
            console.log(`Opened Connection to Twitch`);
        });
        // https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/close_event
        // https://github.com/Luka967/websocket-close-codes
        this.eventsub.addEventListener('close', (close) => {
            //console.log('EventSub close', close, this.eventsub);
            console.log(`${this.eventsub.twitch_websocket_id}/${this.eventsub.counter} Connection Closed: ${close.code} Reason - ${this.closeCodes[close.code]}`);

            if (!this.eventsub.is_reconnecting) {
                console.log(`${this.eventsub.twitch_websocket_id}/${this.eventsub.counter} Is not reconnecting, auto reconnect`);
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
            console.log(`${this.eventsub.twitch_websocket_id}/${this.eventsub.counter} Connection Error`);
        });
        // https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/message_event
        this.eventsub.addEventListener('message', (message) => {
            //console.log('Message');
            //console.log(this.eventsub.counter, message);
            let { data } = message;
            data = JSON.parse(data);

            let { metadata, payload } = data;
            let { message_id, message_type, message_timestamp } = metadata;
            //console.log(`Recv ${message_id} - ${message_type}`);

            switch (message_type) {
                case 'session_welcome':
                    let { session } = payload;
                    let { id, keepalive_timeout_seconds } = session;

                    console.log(`${this.eventsub.counter} This is Socket ID ${id}`);
                    this.eventsub.twitch_websocket_id = id;

                    console.log(`${this.eventsub.counter} This socket declared silence as ${keepalive_timeout_seconds} seconds`);

                    if (!this.eventsub.is_reconnecting) {
                        console.log('Dirty disconnect or first spawn');
                        this.emit('connected', id);
                        // now you would spawn your topics
                    } else {
                        this.emit('reconnected', id);
                        // no need to spawn topics as carried over
                    }

                    this.silence(keepalive_timeout_seconds);

                    break;
                case 'session_keepalive':
                    //console.log(`Recv KeepAlive - ${message_type}`);
                    this.emit('session_keepalive');
                    this.silence();
                    break;

                case 'notification':
                    console.log('notification', metadata, payload);
                    console.log(`${this.eventsub.twitch_websocket_id}/${this.eventsub.counter} Recv notification ${JSON.stringify(payload)}`);

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
                    console.log(`${this.eventsub.twitch_websocket_id}/${this.eventsub.counter} Reconnect request ${reconnect_url}`)

                    //this.eventsub.close();
                    //new initSocket(reconnect_url, true);
                    this.connect(reconnect_url, true);

                    break;
                case 'websocket_disconnect':
                    console.log(`${this.eventsub.counter} Recv Disconnect`);
                    console.log('websocket_disconnect', payload);

                    break;

                case 'revocation':
                    console.log(`${this.eventsub.counter} Recv Topic Revocation`);
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
}

class Twitch extends EventEmitter {
    twitch_client_id = '';
    twitch_client_secret = '';
    twitch_token = '';
    headers = {};

    constructor({
        init_client_id,
        init_client_secret,
        init_token,

        init_conduit_id,
        init_shard_id
    }) {
        super();

        if (init_conduit_id) {
            this.conduit_id = init_conduit_id;
        }
        if (init_shard_id) {
            this.shard_id = init_shard_id;
        }

        if (init_client_id && init_client_secret) {
            // self managing token
            this.twitch_client_id = init_client_id;
            this.twitch_client_secret = init_client_secret;
        }
        if (init_token) {
            // run with token
            this.twitch_token = init_token;
            // validate it
            this.validateToken();
            return;
        }
        if (init_client_id && init_client_secret) {
            // no token so generate
            this.generateToken();
            return;
        }

        throw new Error('Did not init with ClientID/Secret pair or a token');
    }

    validateToken = async () => {
        if (this.twitch_token == '') {
            console.debug('No Token will generate');
            // can generate?
            this.generateToken();
            return;
        }

        let validateReq = await fetch(
            'https://id.twitch.tv/oauth2/validate',
            {
                method: 'GET',
                headers: {
                    'Authorization': `OAuth ${this.twitch_token}`
                }
            }
        );
        if (validateReq.status != 200) {
            console.debug('Token failed', validateReq.status);
            // the token is invalid
            // try to generate
            this.generateToken();
            return;
        }

        let validateRes = await validateReq.json();

        if (validateRes.hasOwnProperty('user_id')) {
            throw new Error('Token is NOT app access/client credentials');
        }

        if (this.twitch_client_id != '' && this.twitch_client_id != validateRes.client_id) {
            throw new Error('Token ClientID does not match specified client ID');
        }
        if (this.twitch_client_id == '') {
            // infer
            console.log('Inferring CID');
            this.twitch_client_id = validateRes.client_id;
        }

        // token passed validation check
        this.headers = {
            'Client-ID':        this.twitch_client_id,
            'Authorization':    `Bearer ${this.twitch_token}`,
            'Accept':           'application/json',
            'Accept-Encoding':  'gzip'
        };
        console.log('headers', this.headers);
        // we'll emit
        // as the program can force a generate if it wants
        // ie: close to expire lets go early
        this.emit('validated', validateRes);
    }

    generateToken = async () => {
        console.debug('Generating a token');
        if (
            this.twitch_client_id == null ||
            this.twitch_client_secret == null ||
            this.twitch_client_id == '' ||
            this.twitch_client_secret == ''
        ) {
            throw new Error('No Client ID/Secret, cannot generate token');
        }

        let tokenReq = await fetch(
            'https://id.twitch.tv/oauth2/token',
            {
                method: 'POST',
                body: new URLSearchParams([
                    [ 'client_id',      this.twitch_client_id ],
                    [ 'client_secret',  this.twitch_client_secret ],
                    [ 'grant_type',     'client_credentials' ]
                ])
            }
        );
        if (tokenReq.status != 200) {
            throw new Error(`Failed to get a token: ${tokenReq.status}//${await tokenReq.text()}`);
        }
        let { access_token } = await tokenReq.json();
        this.twitch_token = access_token;
        // emit token as we don't handle storage the program does
        // the program might also need the token itself for whatever reason
        this.emit('access_token', this.twitch_token);
        // final check
        this.validateToken();
    }

    conduit_id = '';
    shard_id = '';
    setConduitID = (conduit_id) => {
        this.conduit_id = conduit_id;
    }
    setShardID = (shard_id) => {
        this.shard_id = shard_id;
    }
    session_id = '';
    setSessionID = (session_id) => {
        this.session_id = session_id;
    }

    createConduit = async (shard_count) => {
        if (!shard_count) {
            shard_count = 1;
        }

        let createReq = await fetch(
            'https://api.twitch.tv/helix/eventsub/conduits',
            {
                method: 'POST',
                headers: {
                    ...twitchHeaders,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ shard_count: 1 })
            }
        );
        if (createReq.status != 200) {
            throw new Error(`Failed to create Conduit ${createReq.status}//${await createReq.text()}`);
        }

        let { data } = await createReq.json();
        this.conduit_id = data[0].id;

        // and return the new conduit
        return data[0];
    }
    updateConduitShardCount = async (shard_count) => {
        let updateReq = await fetch(
            'https://api.twitch.tv/helix/eventsub/conduits',
            {
                method: 'PATCH',
                headers: {
                    ...twitchHeaders,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: this.conduit_id,
                    shard_count
                })
            }
        );
        if (updateReq.status != 200) {
            throw new Error(`Failed to update Conduit ${updateReq.status}//${await updateReq.text()}`);
        }

        let { data } = await createReq.json();
        // and return the update conduit
        return data[0];
    }
    deleteConduit = async () => {
        let deleteReq = await fetch(
            'https://api.twitch.tv/helix/eventsub/conduits',
            {
                method: 'DELETE',
                headers: {
                    ...twitchHeaders,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: this.conduit_id
                })
            }
        )

        if (deleteReq.status != 204) {
            throw new Error(`Failed to delete Conduit ${deleteReq.status}//${await deleteReq.text()}`);
        }

        return true;
    }

    findConduit = async () => {
        let conduitsReq = await fetch(
            'https://api.twitch.tv/helix/eventsub/conduits',
            {
                method: 'GET',
                headers: {
                    ...this.headers
                }
            }
        );
        if (conduitsReq.status != 200) {
            throw new Error(`Failed to Get Conduits ${conduitsReq.status}//${await conduitsReq.text()}`);
        }
        let { data } = await conduitsReq.json();
        for (var x=0;x<data.length;x++) {
            let { id } = data[x];

            if (id == this.conduit_id) {
                this.emit('conduitFound', data[x]);
                return data[x];
            }
        }

        throw new Error('Conduit Not Found');
    }

    getShards = async () => {
        // ommited for now
    }

    // you can update as many shards as you want in one request
    // that logic just doesn't makes sense in this lib
    updateShard = async () => {
        // is the shardID valid?

        // go for update
        let shardUpdate = await fetch(
            'https://api.twitch.tv/helix/eventsub/conduits/shards',
            {
                method: 'PATCH',
                headers: {
                    ...this.headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    conduit_id:     this.conduit_id,
                    shards: [
                        {
                            id:     this.shard_id,
                            transport: {
                                method:     'websocket',
                                session_id: this.session_id
                            }
                        }
                    ]
                })
            }
        );
        if (shardUpdate.status != 202) {
            // major fail
            throw new Error(`Failed to shardUpdate ${shardUpdate.status} - ${await shardUpdate.text()}`);
        }
        let { data, errors } = await shardUpdate.json();
        if (errors && errors.length > 0) {
            console.error(errors);
            throw new Error(`Failed to shardUpdate ${shardUpdate.status}`);
        }
        // all good shard Connected expecting data!
        this.emit('shardUpdate', 'ok');
    }


    /*
    subscription = {
        type: 'foo',
        version: "1",
        condition: {
            whatever
        }
    }
    */
    createSubscription = async (subscription) => {
        let subscriptionReq = await fetch(
            'https://api.twitch.tv/helix/eventsub/subscriptions',
            {
                method: 'POST',
                headers: {
                    ...this.headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...subscription,
                    transport: {
                        method: 'conduit',
                        conduit_id: this.conduit_id
                    }
                })
            }
        );
        if (subscriptionReq.status == 202) {
            return await subscriptionReq.json();
        }
        if (subscriptionReq.status == 409) {
            // its TECHNICALLY not an error....
            return await subscriptionReq.json();
        }

        // major fail
        throw new Error(`Failed to create Subscription ${subscriptionReq.status} - ${await subscriptionReq.text()}`);
    }
}

export { eventsubSocket, Twitch };
