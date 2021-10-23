const got = require('got');
const redis = require('redis');
const redis_client = redis.createClient();

module.exports = function(config) {
    // maintain twitch
    let twitch = {
        client: {},
        maintain: () => {
            redis_client.hget("twitch_auth", "twitch_client_credentials_" + config.client_id, (e,r) => {
                if (e) {
                    console.error(e);
                    twitch.makeClientCred();
                } else if (r) {
                    // validate
                    console.log("Recovered credentails, validating");
                    twitch.client = JSON.parse(r);
                    twitch.validate();
                } else {
                    twitch.makeClientCred();
                }
            });
        },
        validate: () => {
            got({
                url: "https://id.twitch.tv/oauth2/validate",
                method: "GET",
                headers: {
                    Authorization: "OAuth " + twitch.client.access_token
                },
                responseType: "json"
            })
            .then(resp => {
                if (resp.body.expires_in <= 3600) {
                    console.log('Token is Ok but less than an hour left on it, will remake');
                    twitch.makeClientCred();
                } else {
                    // it"s ok
                    console.log('Token is Ok!');
                }
            })
            .catch(err => {
                if (err.response) {
                    console.log('Token Validate Error', err.response.statusCode, err.response.body);
                } else {
                    console.error('Token Validate Bar Error', err);
                }
                twitch.makeClientCred();
            });
        },
        makeClientCred: () => {
            got({
                url: "https://id.twitch.tv/oauth2/token",
                method: "POST",
                headers: {
                    "Accept": "application/json"
                },
                form: {
                    client_id: config.client_id,
                    client_secret: config.client_secret,
                    grant_type: "client_credentials"
                },
                responseType: "json"
            })
            .then(resp => {
                console.log(resp.body);
                twitch.client = resp.body;
                twitch.client.client_id = config.client_id;
                redis_client.hset(
                    "twitch_auth",
                    "twitch_client_credentials_" + config.client_id,
                    JSON.stringify(twitch.client),
                    (e,r) => {
                        if (e) {
                            console.error("Failed to store creds", e);
                        } else {
                            console.log("Stored Credentials", r);
                        }
                    }
                );
            })
            .catch(err => {
                if (err.response) {
                    console.log("Failed to get a clientCred", err.response.statusCode, err.response.body);
                } else {
                    console.error("Failed to get a clientCred", err);
                }
            });
        }
    }

    twitch.maintain();
    // setup a timer to validate
    // and recreate a new token if needed
    setInterval(() => {
        twitch.maintain();
    }, 15 * 60 * 1000);
    // maintain twitch token every 15 minutes

    return twitch;
}
