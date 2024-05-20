import { EventEmitter } from "events";
import WebSocket from "ws";

class eventsubSocket extends EventEmitter {
    counter = 0;
    closeCodes = {
        4000: "Internal Server Error",
        4001: "Client sent inbound traffic",
        4002: "Client failed ping-pong",
        4003: "Connection unused",
        4004: "Reconnect grace time expired",
        4005: "Network Timeout",
        4006: "Network error",
        4007: "Invalid Reconnect",
    };

    constructor(connect) {
        super();

        if (connect) {
            this.connect();
        }
    }

    connect(url, is_reconnect) {
        this.eventsub = {};
        this.counter++;

        url = url ? url : "wss://eventsub.wss.twitch.tv/ws";
        is_reconnect = is_reconnect ? is_reconnect : false;

        console.log(`Connecting to ${url}|${is_reconnect}`);
        this.eventsub = new WebSocket(url);
        this.eventsub.is_reconnecting = is_reconnect;
        this.eventsub.counter = this.counter;

        this.eventsub.addEventListener("open", () => {
            console.log(`Opened Connection to Twitch`);
            // tidy/reset flags
            this.eventsub.is_reconnecting = false;
        });
        // https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/close_event
        // https://github.com/Luka967/websocket-close-codes
        this.eventsub.addEventListener("close", (close) => {
            //console.log('EventSub close', close, this.eventsub);
            console.log(
                `${this.eventsub.twitch_websocket_id}/${this.eventsub.counter} Connection Closed: ${close.code} Reason - ${this.closeCodes[close.code]}`,
            );

            if (!this.eventsub.is_reconnecting) {
                console.log(
                    `${this.eventsub.twitch_websocket_id}/${this.eventsub.counter} Is not Twitch reconnecting, Websocket reconnect`,
                );
                //new initSocket();
                this.connect();
            }

            if (close.code == 1006) {
                // do a single retry
                // this is wrong?
                //this.eventsub.is_reconnecting = true;
            }
        });
        // https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/error_event
        this.eventsub.addEventListener("error", (err) => {
            console.log(err);
            console.log(
                `${this.eventsub.twitch_websocket_id}/${this.eventsub.counter} Connection Error`,
            );
        });
        // https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/message_event
        this.eventsub.addEventListener("message", (message) => {
            //console.log('Message');
            //console.log(this.eventsub.counter, message);
            let { data } = message;
            data = JSON.parse(data);

            let { metadata, payload } = data;
            let { message_id, message_type, message_timestamp } = metadata;
            //console.log(`Recv ${message_id} - ${message_type}`);

            switch (message_type) {
                case "session_welcome":
                    let { session } = payload;
                    let { id, keepalive_timeout_seconds } = session;

                    console.log(`${this.eventsub.counter} This is Socket ID ${id}`);
                    this.eventsub.twitch_websocket_id = id;

                    console.log(
                        `${this.eventsub.counter} This socket declared silence as ${keepalive_timeout_seconds} seconds`,
                    );

                    if (!this.eventsub.is_reconnecting) {
                        console.log("Dirty disconnect or first spawn");
                        this.emit("connected", id);
                        // now you would spawn your topics
                    } else {
                        this.emit("reconnected", id);
                        // no need to spawn topics as carried over
                    }

                    this.silence(keepalive_timeout_seconds);

                    break;
                case "session_keepalive":
                    //console.log(`Recv KeepAlive - ${message_type}`);
                    this.emit("session_keepalive");
                    this.silence();
                    break;

                case "notification":
                    //console.log('notification', metadata, payload);
                    let { subscription } = payload;
                    let { type } = subscription;

                    // chat.message is NOISY
                    if (type != "channel.chat.message") {
                        console.log(
                            `${this.eventsub.twitch_websocket_id}/${this.eventsub.counter} Recv notification ${type}`,
                        );
                    }

                    this.emit("notification", { metadata, payload });
                    this.emit(type, { metadata, payload });
                    this.silence();

                    break;

                case "session_reconnect":
                    this.eventsub.is_reconnecting = true;

                    let reconnect_url = payload.session.reconnect_url;

                    console.log("Connect to new url", reconnect_url);
                    console.log(
                        `${this.eventsub.twitch_websocket_id}/${this.eventsub.counter} Reconnect request ${reconnect_url}`,
                    );

                    //this.eventsub.close();
                    //new initSocket(reconnect_url, true);
                    this.connect(reconnect_url, true);

                    break;
                case "websocket_disconnect":
                    console.log(`${this.eventsub.counter} Recv Disconnect`);
                    console.log("websocket_disconnect", payload);

                    break;

                case "revocation":
                    console.log(`${this.eventsub.counter} Recv Topic Revocation`);
                    console.log("revocation", payload);
                    this.emit("revocation", { metadata, payload });
                    break;

                default:
                    console.log(`${this.eventsub.counter} unexpected`, metadata, payload);
                    break;
            }
        });
    }

    trigger() {
        // this function lets you test the disconnect on send method
        this.eventsub.send("cat");
    }
    close() {
        this.eventsub.close();
    }

    silenceHandler = false;
    silenceTime = 10; // default per docs is 10 so set that as a good default
    silence(keepalive_timeout_seconds) {
        if (keepalive_timeout_seconds) {
            this.silenceTime = keepalive_timeout_seconds;
            this.silenceTime++; // add a little window as it's too anal
        }
        clearTimeout(this.silenceHandler);
        this.silenceHandler = setTimeout(() => {
            this.emit("session_silenced"); // -> self reconnecting
            this.close(); // close it and let it self loop
        }, this.silenceTime * 1000);
    }
}

class Twitch extends EventEmitter {
    twitch_client_id = "";
    twitch_client_secret = "";

    twitch_token = "";
    twitch_refresh = "";

    allow_client_creds = true;
    allow_auto_maintain = true;

    headers = {};

    token_type = "";
    token_user_id = "";

    constructor({
        client_id,
        client_secret,

        token,
        refresh,

        conduit_id,
        shard_id,

        allow_client_creds,
        allow_auto_maintain,
    }) {
        super();

        this.allow_client_creds = allow_client_creds ? allow_client_creds : this.allow_client_creds;
        this.allow_auto_maintain = allow_auto_maintain
            ? allow_auto_maintain
            : this.allow_auto_maintain;

        if (conduit_id) {
            this.conduit_id = conduit_id;
        }
        // since it can be 0
        if (undefined !== shard_id) {
            this.shard_id = shard_id;
        }

        if (client_id && client_secret) {
            // self managing token
            this.twitch_client_id = client_id;
            this.twitch_client_secret = client_secret;
        }

        if (refresh) {
            if (!client_secret) {
                throw new Error("A refresh token was provided but without a secret");
            }
            this.twitch_refresh = refresh;
        }

        if (token) {
            // run with token
            this.twitch_token = token;
            // validate it
            this.validateToken();
            return;
        }

        if (client_id && client_secret) {
            // no token so generate
            this.generateToken();
            return;
        }

        throw new Error("Did not init with ClientID/Secret pair or a token");
    }

    infinityCheck = false;
    validateToken = async () => {
        if (this.twitch_token == "") {
            console.debug("No Token will generate");
            // can generate?
            this.generateToken();
            return;
        }

        let validateReq = await fetch("https://id.twitch.tv/oauth2/validate", {
            method: "GET",
            headers: {
                Authorization: `OAuth ${this.twitch_token}`,
            },
        });
        if (validateReq.status != 200) {
            console.debug("Token failed", validateReq.status);
            // the token is invalid
            // try to generate
            this.generateToken();
            return;
        }

        let validateRes = await validateReq.json();

        /*
        if (validateRes.hasOwnProperty('user_id')) {
            throw new Error('Token is NOT app access/client credentials');
        }
        */
        if (validateRes.hasOwnProperty("user_id")) {
            this.token_type = "user_token";
            this.token_user_id = validateRes.user_id;
            // enforce no drop
            this.allow_client_creds = false;

            if (this.conduit_id != "") {
                throw new Error(
                    "Token is NOT app access/client credentials. And declared a conduit ID",
                );
            }
        } else {
            this.token_type = "client_credentials";
        }

        if (this.twitch_client_id != "" && this.twitch_client_id != validateRes.client_id) {
            throw new Error("Token ClientID does not match specified client ID");
        }
        if (this.twitch_client_id == "") {
            // infer
            console.log("Inferring CID");
            this.twitch_client_id = validateRes.client_id;
        }

        // check the duration left on the token
        // account for legacy inifinity tokens
        console.log(`The Token has ${validateRes.expires_in}`);
        if (validateRes.expires_in < 30 * 60) {
            // need refresh
            if (!this.infinityCheck && validateRes.expires_in == 0) {
                this.infinityCheck = true;
                this.validateToken();
                return;
            }
            this.infinityCheck = false;

            if (this.allow_auto_maintain) {
                // generate
                this.generateToken();
                return;
            }
        }

        // token passed validation check
        this.generateHeaders();
        // we'll emit
        // as the program can force a generate if it wants
        // ie: close to expire lets go early
        this.emit("validated", validateRes);

        if (!this.allow_auto_maintain) {
            console.log("allow auto maitain is off");
            return;
        }
        console.log("allow auto maitain is on");
        console.log(this.twitch_refresh);
        console.log(this.twitch_client_secret);

        // initiate maintaince timer
        if (this.twitch_refresh != "" || this.twitch_client_secret != "") {
            var n = new Date();
            console.log("now maintian", n);
            n.setMinutes(n.getMinutes() + 15);
            console.log("next maintian", n);
            // we got here as a client secret exists as well
            // otherwise we threw earlier
            clearTimeout(this._maintainceTimer);
            // 15 miniutes
            this._maintainceTimer = setTimeout(this.validateToken, 15 * 60 * 1000);
        }
    };
    _maintainceTimer = false;
    //maintainToken = async () => {};

    generateHeaders = () => {
        this.headers = {
            "Client-ID": this.twitch_client_id,
            "Authorization": `Bearer ${this.twitch_token}`,
            "Accept": "application/json",
            "Accept-Encoding": "gzip",
        };
        console.log("headers", this.headers);
    };
    setToken = (token) => {
        this.twitch_token = token;
        this.validateToken();
    };

    generateToken = async () => {
        console.debug("Generating a token");
        if (
            this.twitch_client_id == null ||
            this.twitch_client_secret == null ||
            this.twitch_client_id == "" ||
            this.twitch_client_secret == ""
        ) {
            throw new Error("No Client ID/Secret, cannot generate token");
        }

        // refresh?
        if (this.twitch_refresh) {
            // we have a refresh
            return this.refreshToken();
        }

        // go for client credentials
        if (!this.allow_client_creds) {
            throw new Error("Dropped to Client Credentials and stopped as disallowed");
        }
        let tokenReq = await fetch("https://id.twitch.tv/oauth2/token", {
            method: "POST",
            body: new URLSearchParams([
                ["client_id", this.twitch_client_id],
                ["client_secret", this.twitch_client_secret],
                ["grant_type", "client_credentials"],
            ]),
        });
        if (tokenReq.status != 200) {
            throw new Error(`Failed to get a token: ${tokenReq.status}//${await tokenReq.text()}`);
        }
        let { access_token } = await tokenReq.json();
        this.twitch_token = access_token;
        // emit token as we don't handle storage the program does
        // the program might also need the token itself for whatever reason
        this.emit("access_token", this.twitch_token);
        // final check
        this.validateToken();
    };
    refreshToken = async () => {
        let tokenReq = await fetch("https://id.twitch.tv/oauth2/token", {
            method: "POST",
            body: new URLSearchParams([
                ["client_id", this.twitch_client_id],
                ["client_secret", this.twitch_client_secret],
                ["grant_type", "refresh_token"],
                ["refresh_token", this.twitch_refresh],
            ]),
        });
        if (tokenReq.status != 200) {
            throw new Error(
                `Failed to get refresh token: ${tokenReq.status}//${await tokenReq.text()}`,
            );
        }
        let { access_token, refresh_token } = await tokenReq.json();
        this.twitch_token = access_token;
        this.twitch_refresh = refresh_token;
        // emit token as we don't handle storage the program does
        // the program might also need the token itself for whatever reason
        this.emit("access_tokens", {
            access_token,
            refresh_token,
        });
        // final check
        this.validateToken();
    };

    conduit_id = "";
    shard_id = "";
    setConduitID = (conduit_id) => {
        this.conduit_id = conduit_id;
    };
    setShardID = (shard_id) => {
        if (this.conduit_id == "") {
            throw new Error("Tried to shard without a conduit ID");
        }
        this.shard_id = shard_id;
    };
    session_id = "";
    setSessionID = (session_id) => {
        this.session_id = session_id;
    };
    // for if using an app access to run tings
    setUserId = (user_id) => {
        this.token_user_id = user_id;
    };

    createConduit = async (shard_count) => {
        if (!shard_count) {
            shard_count = 1;
        }

        let createReq = await fetch("https://api.twitch.tv/helix/eventsub/conduits", {
            method: "POST",
            headers: {
                ...this.headers,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ shard_count: 1 }),
        });
        if (createReq.status != 200) {
            throw new Error(
                `Failed to create Conduit ${createReq.status}//${await createReq.text()}`,
            );
        }

        let { data } = await createReq.json();
        this.conduit_id = data[0].id;

        // and return the new conduit
        return data[0];
    };
    updateConduitShardCount = async (shard_count) => {
        let updateReq = await fetch("https://api.twitch.tv/helix/eventsub/conduits", {
            method: "PATCH",
            headers: {
                ...this.headers,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: this.conduit_id,
                shard_count,
            }),
        });
        if (updateReq.status != 200) {
            throw new Error(
                `Failed to update Conduit ${updateReq.status}//${await updateReq.text()}`,
            );
        }

        let { data } = await createReq.json();
        // and return the update conduit
        return data[0];
    };
    deleteConduit = async () => {
        let deleteReq = await fetch("https://api.twitch.tv/helix/eventsub/conduits", {
            method: "DELETE",
            headers: {
                ...this.headers,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: this.conduit_id,
            }),
        });

        if (deleteReq.status != 204) {
            throw new Error(
                `Failed to delete Conduit ${deleteReq.status}//${await deleteReq.text()}`,
            );
        }

        return true;
    };

    findConduit = async () => {
        let conduitsReq = await fetch("https://api.twitch.tv/helix/eventsub/conduits", {
            method: "GET",
            headers: {
                ...this.headers,
            },
        });
        if (conduitsReq.status != 200) {
            throw new Error(
                `Failed to Get Conduits ${conduitsReq.status}//${await conduitsReq.text()}`,
                { cause: "Fatal" },
            );
        }
        let { data } = await conduitsReq.json();
        for (var x = 0; x < data.length; x++) {
            let { id } = data[x];

            if (id == this.conduit_id) {
                this.emit("conduitFound", data[x]);
                return data[x];
            }
        }

        this.emit("conduitNotFound");
        //throw new Error("Conduit Not Found", { cause: "NotFound" });
        return false;
    };

    getShards = async () => {
        // ommited for now
    };

    // you can update as many shards as you want in one request
    // that logic just doesn't makes sense in this lib
    updateShard = async () => {
        // is the shardID valid?
        console.debug(`on ${this.conduit_id} setting ${this.shard_id} to ${this.session_id}`);

        // go for update
        let shardUpdate = await fetch("https://api.twitch.tv/helix/eventsub/conduits/shards", {
            method: "PATCH",
            headers: {
                ...this.headers,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                conduit_id: this.conduit_id,
                shards: [
                    {
                        id: this.shard_id,
                        transport: {
                            method: "websocket",
                            session_id: this.session_id,
                        },
                    },
                ],
            }),
        });
        if (shardUpdate.status != 202) {
            // major fail
            throw new Error(
                `Failed to shardUpdate ${shardUpdate.status} - ${await shardUpdate.text()}`,
            );
        }
        let { data, errors } = await shardUpdate.json();
        if (errors && errors.length > 0) {
            console.error(errors);
            this.emit("shardUpdate", { data, errors });
            throw new Error(`Failed to shardUpdate ${shardUpdate.status}`);
        }
        // all good shard Connected expecting data!
        this.emit("shardUpdate", { data });
        return data;
    };

    /*
    subscription = {
        type: 'foo',
        version: "1",
        condition: {
            whatever
        }
    }
    */
    createSubscription = async (subscription, method) => {
        let transport = {
            method: "websocket",
            session_id: this.session_id,
        };

        if (method == "conduit") {
            transport = {
                method: "conduit",
                conduit_id: this.conduit_id,
            };
        }

        let subscriptionReq = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
            method: "POST",
            headers: {
                ...this.headers,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ...subscription,
                transport,
            }),
        });
        if (subscriptionReq.status == 202) {
            return {
                status: subscriptionReq.status,
                json: await subscriptionReq.json(),
            };
        }
        if (subscriptionReq.status == 409) {
            // its TECHNICALLY not an error....
            return {
                status: subscriptionReq.status,
                json: await subscriptionReq.json(),
            };
        }

        // major fail
        throw new Error(
            `Failed to create Subscription ${subscriptionReq.status} - ${await subscriptionReq.text()}`,
        );
    };

    // messaging
    sendChat = async (broadcaster_id, message, reply_parent_message_id) => {
        let payload = {
            broadcaster_id,
            sender_id: this.token_user_id,
            message,
            reply_parent_message_id,
        };

        return await fetch("https://api.twitch.tv/helix/chat/messages", {
            method: "POST",
            headers: {
                ...this.headers,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
    };
    sendAnnouncement = async (broadcaster_id, message, color) => {
        let payload = {
            broadcaster_id,
            moderator_id: this.token_user_id,
            message,
            color: color ? color : "primary",
        };

        return await fetch("https://api.twitch.tv/helix/chat/announcements", {
            method: "POST",
            headers: {
                ...this.headers,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
    };

    logHelixResponse = (resp) => {
        console.log(
            `Helix: ${resp.status} - ${resp.headers.get("ratelimit-remaining")}/${resp.headers.get("ratelimit-limit")}`,
        );
    };
}

export { Twitch, eventsubSocket };
