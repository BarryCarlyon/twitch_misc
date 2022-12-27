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
// fetch is used for HTTP/API requests
// and can be swapped out for inbuild fetch in node19+

//esm
//const fetch = require('node-fetch');
// cjs
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));


// Express basics
const app = express();
const http = require('http').Server(app);
http.listen(config.port, function() {
    console.log('Server raised on', config.port);
});

/* Session */
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

// For production see the node in the README.md
// ## Nginx and Cookie Security
// https://expressjs.com/en/advanced/best-practice-security.html#use-cookies-securely

// Setup a session manager
app.use(session({
    secret: crypto.randomBytes(4).toString('base64'),
    resave: true,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: (30 * 60 * 1000)
    },
    rolling: true
}));

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
    .get(async (req, res) => {
        console.log('Incoming get request');

        if (req.session.token) {
            // probably logged in
            // and will suffice for this example

            console.log(`The server has a token: ${req.session.token.access_token}`);

            // validate and return the token details
            let validateResp = await fetch(
                'https://id.twitch.tv/oauth2/validate',
                {
                    headers: {
                        'Authorization': `Bearer ${req.session.token.access_token}`,
                        'Accept': 'application/json'
                    }
                }
            )
            if (validateResp.status != 200) {
                req.session.error = 'Token is invalid!';
                res.redirect('/');
                return;
            }
            let validateData = await validateResp.json();
            console.log('Ok', validateData);
            res.render(
                'loggedin',
                {
                    user: req.session.user,
                    token: validateData
                }
            );

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
            let tokenResp = await fetch(
                "https://id.twitch.tv/oauth2/token",
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json'
                    },
                    body: new URLSearchParams([
                        [ 'client_id',      config.client_id ],
                        [ 'client_secret',  config.client_secret ],
                        [ 'code',           code ],
                        [ 'grant_type',     'authorization_code' ],
                        [ 'redirect_uri',   config.redirect_uri ]
                    ])
                }
            );

            if (tokenResp.status != 200) {
                req.session.error = 'An Error occured: ' + await tokenResp.text();
                res.redirect('/');
                return;
            }

            // oAuth dance success!
            req.session.token = await tokenResp.json();

            // we'll go collect the user this token is for
            let userResp = await fetch(
                'https://api.twitch.tv/helix/users',
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Client-ID': config.client_id,
                        'Authorization': `Bearer ${req.session.token.access_token}`
                    }
                }
            );

            if (userResp.status != 200) {
                req.session.error = 'An Error occured: ' + await tokenResp.text();
                res.redirect('/');
                return;
            }

            let userData = await userResp.json();
            // malformed...
            if (!userData.hasOwnProperty('data')) {
                req.session.warning = 'We got a Token but failed to get your Twitch profile from Helix';
                res.redirect('/');
                return;
            }
            // not one user returned
            if (userData.data.length != 1) {
                req.session.warning = 'We got a Token but failed to get your Twitch profile from Helix';
                res.redirect('/');
                return;
            }
            req.session.user = userData.data[0];

            res.redirect('/');

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

        // how scopes are being fetched here is _bad_ but will suffice for this example
        res.render('generator', {
            client_id: config.client_id,
            redirect_uri: config.redirect_uri,
            auth_error,
            scopes: JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'scopes.json'))),
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
        fetch(
            'https://id.twitch.tv/oauth2/revoke'
                + '?client_id=' + config.client_id
                + '&token=' + req.session.token.access_token,
            {
                method: 'post'
            }
        )
        .then(resp => {
            console.log('KeyRevoke OK', resp.status);
        })
        .catch(err => {
            console.error('KeyRevoke Fail', err);
        });

        // and dump
        req.session.destroy();
        res.redirect('/');
    });
