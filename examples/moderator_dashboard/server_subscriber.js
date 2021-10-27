const fs = require('fs');
const path = require('path');

const got = require('got');

const express = require('express');

const crypto = require('crypto');

/*
Configurations
Note: we don't bother error checking, coz if it errors you got bigger problems
*/
const config = JSON.parse(fs.readFileSync(path.join(
    __dirname,
    'config.json'
)));

/*
Server
*/
const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.locals.basedir = path.join(__dirname, 'views');

app.set('view options', {
   debug: false,
   compileDebug: false
})

app.use(express.static(path.join(__dirname, 'public')));

/* interfaces */
const http = require('http').Server(app);
http.listen(config.listen, function() {
    console.log('Server raised on', config.listen);
});

const redis = require('redis');
const redis_client = redis.createClient();
redis_client.on('error', (err) => {
    console.error('REDIS Error', err);
});
//const redis_subscribe = redis.createClient();
//redis_subscribe.on('error', function (err) {
//    console.error('REDIS Error', err);
//});

/*
Generate a random string at start up
To secure sessions with
This means when the server restarts, it'll generate a new string
*/
var secret = crypto.randomBytes(64).toString('hex');

/* Session */
const sess = require('express-session');
const RedisStore = require('connect-redis')(sess);
// for nginx/nrgok
app.set('trust proxy', 1) // trust first proxy
const session = sess({
    store: new RedisStore({
        client: redis_client
    }),
    secret,
    resave: true,
    saveUninitialized: false,
    saveUninitialized: true,
    cookie: {
        secure: true,
        secure: false
    },
    rolling: true
});
//cookie: {
//        maxAge: (30 * 60 * 1000)
app.use(session);

/*
Generic Error logger
*/
app.use((err, req, res, next) => {
    //console.log('in here');
    if (err) {
        console.log(err);
    }
    next(err);
});

/*
Lets load and setup the streamers authentication keys
*/
var keystate = false;
function loadKeys() {
    redis_client.hget(
        config.appname + '_broadcaster',
        'access_token',
        (e,access_token) => {
            if (e) {
                console.error('Redis Problem loading keys', e);
                // and crash bigger problems
                process.exit();
            }
            if (access_token) {
                // key exists validate it
                got({
                    url: 'https://id.twitch.tv/oauth2/validate',
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + access_token
                    },
                    responseType: 'json'
                })
                .then(resp => {
                    // token good
                    // check age/time left
                    // 30 minutes
                    if (resp.body.expires_id <= (30 * 60 * 1000)) {
                        // regnerate the key
                        regnerateKey();
                    } else {
                        keystate = access_token;
                    }
                })
                .catch(err => {
                    if (err.response) {
                        console.log('Validate error', err.response.statusCode, err.response.body);
                    } else {
                        console.log('Bad Validation error', err);
                    }
                    // need new keys
                });
            }
        }
    );
}
loadKeys();

function regenerateKey() {
    redis_client.hget(
        config.appname + '_broadcaster',
        'refresh_token',
        (e,refresh_token) => {
            if (e) {
                console.error('Redis Problem loading keys', e);
                // and crash bigger problems
                process.exit();
            }
            if (!refresh_token) {
                console.error('No Refresh Token on file, how did we get here');
                process.exit();
            }

            got({
                url: 'https://id.twitch.tv/oauth2/token',
                searchParams: {
                    grant_type: 'refresh',
                    refresh_token,
                    client_id: config.twitch.client_id,
                    client_secret: config.twitch.client_secret
                }
            })
            .then(resp => {
                storeKeys(resp.body.access_token, resp.body.refresh_token);
            })
            .catch(err => {
                if (err.response) {
                    console.log('Refresh error', err.response.statusCode, err.response.body);
                } else {
                    console.log('Bad Refresh error', err);
                }
                // need new keys
            })
        }
    );
}
function storeKeys(access_token, refresh_token, cb) {
    // got keys
    keystate = access_token;

    // store new  keys
    redis_client.hmset(
        config.appname + '_broadcaster',
        'access_token',
        access_token,
        'refresh_token',
        refresh_token,
        (e,r) => {
            if (e) {
                console.log('Error Storing new keys', e);
            }

            if (cb) {
                cb();
            }
        }
    );
}

/*
register some pug globals
*/
app.use((req, res, next) => {
    res.locals.twitch_client_id = config.twitch.client_id;
    if (req.session.error) {
        res.locals.error = req.session.error;
        delete req.session.error;
        console.log('Captured error', res.locals.error);
    }
    if (req.session.auth_error) {
        res.locals.auth_error = req.session.auth_error;
        delete req.session.auth_error;
        console.log('Captured auth error', res.locals.auth_error);
    }

    res.locals.user = false;
    if (req.session.user) {
        res.locals.user = req.session.user;
    }

    next();
});

/*
Logout super important
*/
app.get('/logout', (req,res) => {
    req.session.destroy();
    res.redirect('/');
});

/*
Interrupted handler for authentication
*/
app.use((req,res,next) => {
    let { code, error, error_description, scope, state } = req.query;
    if (code) {
        // first validate the state is valid
        state = decodeURIComponent(state);

        console.log(req.session.state, '!=', state);
        if (req.session.state != state) {
            console.log('state mismatch');
            req.session.auth_error = 'State does not match. Please try again!';
            res.redirect('/');
            return;
        }
        // done with the state params
        delete req.session.state;

        var access_keys = {};

        // start the oAuth dance
        got({
            "url": "https://id.twitch.tv/oauth2/token",
            "method": 'POST',
            "headers": {
                "Accept": "application/json"
            },
            "form": {
                "client_id": config.twitch.client_id,
                "client_secret": config.twitch.client_secret,
                code,
                "grant_type": "authorization_code",
                "redirect_uri": config.twitch.redirect_uri
            },
            "responseType": 'json'
        })
        .then(resp => {
            // oAuth dance success!
            access_keys = resp.body;

            // we need to know for whome the access token is for
            return got({
                url: 'https://api.twitch.tv/helix/users',
                method: 'GET',
                headers: {
                    'Client-ID': config.twitch.client_id,
                    'Authorization': 'Bearer ' + access_keys.access_token
                },
                responseType: 'json'
            })
        })
        .then(resp => {
            if (resp.body && resp.body.data && resp.body.data.length == 1) {
                // we got an id
                // is it the same ID as the broadcaster
                // as the broadcaster is not a moderator on their own channel
                req.session.user = resp.body.data[0];

                if (scope == 'moderation:read') {
                    // check that it's the configured broadcaster authenticate to prevent take over attacks
                    if (resp.body.data[0].id != config.twitch.broadcaster_id) {
                        // wrong broadcaster auth
                        req.session.auth_error = 'broadcaster Auth for wrong broadcaster';
                        res.redirect('/');
                        return;
                    }

                    // it's the correct casters key
                    storeKeys(access_keys.access_token, access_keys.refresh_token, () => {
                        res.redirect('/');
                    });
                } else if (resp.body.data[0].id == config.twitch.broadcaster_id) {
                    // the broadcaster logged in
                    req.session.permitted = true;
                    res.redirect('/');
                } else {
                    // user loging call moderator check
                    accessChecks(resp.body.data[0].id, req, res, next);
                }
            } else {
                req.session.error = 'Failed to get your User from Twitch';
                res.redirect('/');
            }
        })
        .catch(err => {
            if (err.response) {
                console.error('Code exchange Error:', err.response.body);
                // the oAuth dance failed
                req.session.auth_error = 'An Error occured: ' + ((err.response && err.response.body.message) ? err.response.body.message : 'Unknown');
            } else {
                req.session.error = 'Code exchange Bad Error',
                console.log('Errror', err);
            }
            res.redirect('/');
        });
    } else if (error) {
        req.session.auth_error = 'An Error occured: ' + error_description;
        res.redirect('/');
    } else {
        next();
    }
});

function accessChecks(user_id, req, res, next) {
    got({
        url: 'https://api.twitch.tv/helix/subscriptions',
        method: 'GET',
        headers: {
            'Client-ID': config.twitch.client_id,
            'Authorization': 'Bearer ' + keystate
        },
        searchParams: {
            broadcaster_id: config.twitch.broadcaster_id,
            user_id
        },
        responseType: 'json'
    })
    .then(resp => {
        if (resp.body.data && resp.body.data.length == 1) {
            req.session.permitted = true;
            req.session.subscriber = true;
        }

        return got({
            url: 'https://api.twitch.tv/helix/moderation/moderators',
            method: 'GET',
            headers: {
                'Client-ID': config.twitch.client_id,
                'Authorization': 'Bearer ' + keystate
            },
            searchParams: {
                broadcaster_id: config.twitch.broadcaster_id,
                user_id
            },
            responseType: 'json'
        })
    })
    .then(resp => {
        if (resp.body.data && resp.body.data.length == 1) {
            // yay
            req.session.permitted = true;
            req.session.moderator = true;
        }
    })
    .catch(err => {
        console.error('Error body:', err.response.body);
        // the oAuth dance failed
        req.session.error = 'An Error occured: ' + ((err.response && err.response.body.message) ? err.response.body.message : 'Unknown');
    })
    .finally(() => {
        if (!req.session.permitted) {
            req.session.error = 'You are not a subscriber or moderator, access denied';
        }
        res.redirect('/');
    });
}

/*
Interrupted handler for caster keys needed
*/
app.use((req,res,next) => {
    // stupidity check
    if (req.originalUrl.indexOf('.') >= 0) {
        res.status(404);
        return;
    }
    // end stupidity check

    if (!keystate) {
        // need broadcaster keys
        // interrupt all page loads for the key request

        // setup a nonce/state
        req.session.state = crypto.randomBytes(16).toString('base64');

        // build the URL
        var authenticate = 'https://id.twitch.tv/oauth2/authorize'
            + '?client_id=' + config.twitch.client_id
            + '&redirect_uri=' + encodeURIComponent(config.twitch.redirect_uri)
            + '&response_type=code'
            + '&scope=moderation:read+channel:read:subscriptions'
            + '&state=' + encodeURIComponent(req.session.state);

        res.render('broadcaster_keys_needed', {
            authenticate
        });
    } else if (!req.session.permitted) {
        req.session.state = crypto.randomBytes(16).toString('base64');

        var authenticate = 'https://id.twitch.tv/oauth2/authorize'
            + '?client_id=' + config.twitch.client_id
            + '&redirect_uri=' + encodeURIComponent(config.twitch.redirect_uri)
            + '&response_type=code'
            + '&state=' + encodeURIComponent(req.session.state);
            //+ '&scope=' // no scopes we just need userID
            // there is an argument to use OIDC here

        // login
        res.render('moderator_login', {
            authenticate
        });
    } else {
        next();
    }
});

app.get('/', (req,res) => {
    res.render('moderator_valid');
});
