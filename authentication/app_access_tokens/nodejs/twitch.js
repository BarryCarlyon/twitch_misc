import { createClient } from 'redis';
const redis_client = createClient();
await redis_client.connect();

export class twitch {
    constructor() {
        this.maintain();
        // setup a timer to validate
        // and recreate a new token if needed
        setInterval(() => {
            this.maintain();
        }, 15 * 60 * 1000);
        // maintain twitch token every 15 minutes
    }

    async maintain() {
        let token = await redis_client.HGET("twitch_auth", `twitch_client_credentials_${process.env.client_id}`);
        if (token) {
            // validate
            console.log("Recovered credentails, validating");
            try {
                token = JSON.parse(token);
                process.env.access_token = token.access_token;
                this.validate();
            } catch (e) {
                // failed to parse assume buggered
                this.makeClientCred();
            }
            return;
        }

        this.makeClientCred();
    }
    validate() {
        fetch(
            "https://id.twitch.tv/oauth2/validate",
            {
                method: "GET",
                headers: {
                    Authorization: "Bearer " + process.env.access_token
                }
            }
        )
        .then(r => r.json().then(data => ({ status: r.status, body: data })))
        .then(resp => {
            if (resp.status != 200) {
                console.log('Token Failed validation');
                this.makeClientCred();
                return;
            }
            if (resp.body.expires_in <= 3600) {
                console.log('Token is Ok but less than an hour left on it, will make a new one');
                this.makeClientCred();
            } else {
                // it"s ok
                let hours = Math.floor(resp.body.expires_in / 3600);
                console.log(`Token is Ok! Has ${hours} hours left`);
            }
        })
        .catch(err => {
            console.error('Token Validate Bad Error', err);
            this.makeClientCred();
        });
    }
    makeClientCred() {
        let token_url = new URL('https://id.twitch.tv/oauth2/token');
        token_url.search = new URLSearchParams([
            [ 'client_id',      process.env.client_id ],
            [ 'client_secret',  process.env.client_secret ],
            [ 'grant_type',     'client_credentials' ]
        ]).toString();

        fetch(
            token_url,
            {
                method: "POST",
                headers: {
                    "Accept": "application/json"
                }
            }
        )
        .then(r => r.json().then(data => ({ status: r.status, body: data })))
        .then(async resp => {
            if (resp.status != 200) {
                console.log('Failed to get a token', resp.body);
                // likely a _BAD_ error so we won't retry
                return;
            }

            console.log(resp.body);
            resp.body.client_id = process.env.client_id;
            await redis_client.HSET(
                "twitch_auth",
                `twitch_client_credentials_${process.env.client_id}`,
                JSON.stringify(resp.body)
            );
        })
        .catch(err => {
            console.error("Failed to get a clientCred", err);
        });
    }
}
