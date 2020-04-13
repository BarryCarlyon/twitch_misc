
const fs = require('fs');
const path = require('path');

// Load configuation
const config = JSON.parse(fs.readFileSync(path.join(
    __dirname,
    'config.json'
)));

// Require depedancies
// express is used for handling incoming HTTP requests "like a webserver"
const express = require('express');
// bodyparser is for reading incoming data
const bodyParser = require('body-parser');
// cypto handles Crpytographic functions, sorta like passwords (for a bad example)
const crypto = require('crypto');
// got is used for HTTP/API requests
const got = require('got');

// Express basics
const app = express();
const http = require('http').Server(app);
http.listen(config.port, function() {
    console.log('Server raised on', config.port);
});

// Setup a session manager
var esess = require('express-session');
var session = esess({
    secret: crypto.randomBytes(4).toString('base64'),
    resave: true,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: (30 * 60 * 1000)
    },
    rolling: true
});
app.use(session);

// Using Pug to make rendering easier
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.locals.basedir = path.join(__dirname, 'views');

app.set('view options', {
   debug: false,
   compileDebug: false
});

// need a script
app.use(express.static(path.join(__dirname, 'public')));

/* Flash Warnings/Error handler */
app.use(function(req,res,next) {
    var flash = {
        error:      (req.session.error ? req.session.error : false),
        warning:    (req.session.warning ? req.session.warning : false),
        success:    (req.session.success ? req.session.success : false)
    }
    res.locals.flash = flash;

    if (req.session.error) { req.session.error = ''; }
    if (req.session.warning) { req.session.warning = ''; }
    if (req.session.success) { req.session.success = ''; }

    next();
});

// Routes
app
    .route('/')
    .get((req, res) => {
        console.log('Incoming get request');

        if (req.session.token) {
            // probably logged in
            // and will suffice for this example

            // validate and return the token details
            got({
                url: 'https://id.twitch.tv/oauth2/validate',
                headers: {
                    Authorization: 'OAuth ' + req.session.token.access_token
                },
                responseType: 'json'
            })
            .then(resp => {
                console.log('Ok', resp.body);

                res.render(
                    'loggedin',
                    {
                        user: req.session.user,
                        token: resp.body
                    }
                );
            })
            .catch(err => {
                console.error(err);
                req.session.error = 'An Error occured: ' + ((err.response && err.response.message) ? err.response.message : 'Unknown');
                res.redirect('/');
            });

            return
        }

        // test for query string parameters
        let { code, error, error_description, scope, state } = req.query;

        if (code) {
            // do the oAuth dance and exchange the token for a user token

            // first validate the state is valid
            state = decodeURIComponent(state);

            if (req.session.state != state) {
                req.session.error = 'State does not match. Please try again!';
                res.redirect('/');
                return;
            }
            // done with the state params
            delete req.session.state;

            // start the oAuth dance
            got({
                "url": "https://id.twitch.tv/oauth2/token",
                "method": 'POST',
                "headers": {
                    "Accept": "application/json"
                },
                "form": {
                    "client_id": config.client_id,
                    "client_secret": config.client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": config.redirect_uri
                },
                "responseType": 'json'
            })
            .then(resp => {
                // oAuth dance success!
                req.session.token = resp.body;

                // we'll go collect the user this token is for
                return got({
                    "url": "https://api.twitch.tv/helix/users",
                    "method": "GET",
                    "headers": {
                        "Accept": "application/json",
                        "Client-ID": config.client_id,
                        "Authorization": "Bearer " + req.session.token.access_token
                    },
                    "responseType": 'json'
                })
            })
            .then(resp => {
                if (resp.body && resp.body.data && resp.body.data[0]) {
                    req.session.user = resp.body.data[0];
                } else {
                    req.session.warning = 'We got a Token but failed to get your Twitch profile from Helix';
                }
                res.redirect('/');
            })
            .catch(err => {
                // the oAuth dance failed
                req.session.error = 'An Error occured: ' + ((err.response && err.response.message) ? err.response.message : 'Unknown');
                res.redirect('/');
            });

            return;
        }

        var auth_error = '';
        if ( error ) {
            auth_error = 'oAuth Error ' + error_description;
        }

        // We use state to defend against CSRF attacks.
        // We'll generate one and store it in the session
        // twitch will return it to us later
        req.session.state = crypto.randomBytes(16).toString('base64');

        // this just passes a bunch of vairables to the view
        // and the view handles the display logic
        // it's a non exhaustive list of scopes tha exist
        res.render('generator', {
            client_id: config.client_id,
            redirect_uri: config.redirect_uri,
            auth_error,
            scopes: {
                "helix": {
                    "analytics:read:extensions":    "View analytics data for your extensions.",
                    "analytics:read:games":         "View analytics data for your games.",
                    "bits:read":                    "View Bits information for your channel.",
                    "channel:read:redemptions":     "View your channel points custom reward redemptions",
                    "channel:read:subscriptions":   "Get a list of all subscribers to your channel and check if a user is subscribed to your channel",
                    "clips:edit":                   "Manage a clip object.",
                    "user:edit":                    "Manage a user object.",
                    "user:edit:broadcast":          "Edit your channel’s broadcast configuration, including extension configuration. (This scope implies user:read:broadcast capability.)",
                    "user:read:broadcast":          "View your broadcasting configuration, including extension configurations.",
                    "user:read:email":              "Read authorized user’s email address."
                },
                "kraken": {
                    "channel_check_subscription":   "Read whether a user is subscribed to your channel.",
                    "channel_commercial":           "Trigger commercials on channel.",
                    "channel_editor":               "Write channel metadata (game, status, etc).",
                    "channel_read":                 "Read nonpublic channel information, including email address and stream key.",
                    "channel_stream":               "Reset a channel’s stream key.",
                    "channel_subscriptions":        "Read all subscribers to your channel.",
                    "collections_edit":             "Manage a user’s collections (of videos).",
                    "user_blocks_edit":             "Turn on/off ignoring a user. Ignoring users means you cannot see them type, receive messages from them, etc.",
                    "user_blocks_read":             "Read a user’s list of ignored users.",
                    "user_follows_edit":            "Manage a user’s followed channels.",
                    "user_read":                    "Read nonpublic user information, like email address.",
                    "user_subscriptions":           "Read a user’s subscriptions."
                },
                "drops": {
                    "viewing_activity_read":        "Turn on Viewer Heartbeat Service ability to record user data."
                },
                "chat": {
                    "channel:moderate":             "Perform moderation actions in a channel. The user requesting the scope must be a moderator in the channel.",
                    "chat:edit":                    "Send live stream chat and rooms messages.",
                    "chat:read":                    "View live stream chat and rooms messages.",
                    "whispers:read":                "View your whisper messages.",
                    "whispers:edit":                "Send whisper messages."
                }
            },
            state: req.session.state
        });
    })
    .post((req, res) => {
        console.log('Incoming post request');
        res.redirect('/');
    });

app
    .route('/logout/')
    .get((req, res) => {
        console.log('Incoming logout request');
        // as well as dumoing the session lets revoke the token
        got({
            url: 'https://id.twitch.tv/oauth2/revoke'
                + '?client_id=' + config.client_id
                + '&token=' + req.session.token.access_token,
            method: 'post'
        })
        .then(resp => {
            console.log('KeyRevoke OK', resp.body);
        })
        .catch(err => {
            console.error('KeyRevoke Fail', err);
        });

        // and dump
        req.session.destroy();
        res.redirect('/');
    });
