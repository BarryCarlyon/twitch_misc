
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

// OIDC FUN STUFF
const jwt = require('jsonwebtoken');

let oidc_data = {};
let verifier_options;
let verifier_keys;
let verifier_client;
const jwksClient = require('jwks-rsa');

// Fetch OpenID data

// Twitch provides a endpoint that contains information about openID
// This includes the relevant endpoitns for authentatication
// And the available scopes
// And the keys for validation JWT's
    got({
        url: 'https://id.twitch.tv/oauth2/.well-known/openid-configuration',
        method: 'GET',
        responseType: 'json'
    })
    .then(resp => {
        console.log('BOOT: Got openID config');
        oidc_data = resp.body;

        verifier_options = {
            algorithms: oidc_data.id_token_signing_alg_values_supported,
            audience: config.client_id,
            issuer: oidc_data.issuer
        }

        verifier_client = jwksClient({
            jwksUri: oidc_data.jwks_uri
        });
    })
    .catch(err => {
        console.log('OIDC Got a', err);
    });

    // https://github.com/auth0/node-jsonwebtoken
    function getKey(header, callback) {
        verifier_client.getSigningKey(header.kid, function(err, key) {
            var signingKey = key.publicKey || key.rsaPublicKey;
            callback(null, signingKey);
        });
    }

// Express basics
const app = express();
const http = require('http').Server(app);
http.listen(config.port, function() {
    console.log('Server raised on', config.port);
});

// For production see the node in the README.md
// ## Nginx and Cookie Security
// https://expressjs.com/en/advanced/best-practice-security.html#use-cookies-securely

// Setup a session manager
var session = require('express-session');
app.use(session({
    secret: crypto.randomBytes(4).toString('base64'),
    resave: true,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: (15 * 60 * 1000)
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
    .get((req, res) => {
        console.log('Incoming get request');

        if (req.session.token) {
            // probably logged in
            // and will suffice for this example

            // validate and return the token details
            got({
                url: 'https://id.twitch.tv/oauth2/validate',
                headers: {
                    Authorization: 'Bearer ' + req.session.token.access_token
                },
                responseType: 'json'
            })
            .then(resp => {
                console.log(req.session.user);
                console.log(req.session.payload);

                res.render(
                    'loggedin',
                    {
                        user: req.session.user,
                        payload: req.session.payload,
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
                "url": oidc_data.token_endpoint,
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
                // console.log(resp.body);

                jwt.verify(req.session.token.id_token, getKey, verifier_options, function(err, payload) {
                    if (err) {
                        if (err.Error) {
                            req.session.warning = 'Error: ' + err.Error;
                        } else if (err.body && err.body.message) {
                            req.session.warning = 'Error: ' + err.body.message;
                        } else {
                            console.log(err);
                        }

                        req.session.error = 'Twitch Hiccuped';
                        res.redirect('/');
                    } else {
                        console.log('Login From', payload.sub, payload);

                        req.session.payload = payload;

                        got({
                            url: oidc_data.userinfo_endpoint,
                            methd: 'GET',
                            headers: {
                                'Accept': 'application/json',
                                'Authorization': 'Bearer ' + req.session.token.access_token
                            },
                            responseType: 'json'
                        })
                        .then(resp => {
                            req.session.user = resp.body;

                            res.redirect('/');
                        })
                        .catch(err => {
                            console.log(err.body);
                            req.session.error = 'Twitch Hiccuped b';
                            if (err.body.message) {
                                req.session.warning = 'Error: ' + err.body.message;
                            }

                            res.redirect('/');
                        })
                    }
                });

                return;
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

        // this just passes a bunch of vairables to the view
        // and the view handles the display logic
        // it's a non exhaustive list of scopes tha exist
        res.render('login', {
            auth_error,
            state: req.session.state
        });
    })
    .post((req, res) => {
        console.log('Incoming post request');
        res.redirect('/');
    });

app
    .route('/login/')
    .get((req, res) => {
        console.log('Incoming login request');

        // We use state to defend against CSRF attacks.
        // We'll generate one and store it in the session
        // twitch will return it to us later
        req.session.state = crypto.randomBytes(16).toString('base64');

        // construct the linking URL
        var login_url = oidc_data.authorization_endpoint
            + '?client_id=' + config.client_id
            + '&redirect_uri=' + encodeURIComponent(config.redirect_uri)
            + '&response_type=code'
            + '&force_verify=true'
            + '&scope=' + oidc_data.scopes_supported.join('+')
            + '&state=' + encodeURIComponent(req.session.state)
            + '&claims=' + JSON.stringify({
                userinfo: {
                    email:null,
                    email_verified:null,
                    picture:null,
                    preferred_username:null
                }
            });

        console.log('Redirect to', login_url);
        res.redirect(login_url);
    });

app
    .route('/logout/')
    .get((req, res) => {
        console.log('Incoming logout request');

        // and dump
        req.session.destroy();
        res.redirect('/');
    });
