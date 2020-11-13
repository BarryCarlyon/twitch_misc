/*

Twitch Eventsub is great for real time data
This example will handle receiving the data of a payload

This is a NodeJS example

*/

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

// Express basics
const app = express();
const http = require('http').Server(app);
http.listen(config.port, function() {
    console.log('Server raised on', config.port);
});

// Middleware!
// Express allows whats called middle ware
// it runs before (or after) other parts of the route runs
app.use(bodyParser.json({
    verify: function(req, res, buf, encoding) {
        // is there a hub to verify against
        req.twitch_hub = false;
        if (req.headers && req.headers.hasOwnProperty('twitch-eventsub-message-signature')) {
            req.twitch_hub = true;

            // id for dedupe
            var id = req.headers['twitch-eventsub-message-id'];
            // check age
            var timestamp = req.headers['twitch-eventsub-message-timestamp'];

            var xHub = req.headers['twitch-eventsub-message-signature'].split('=');

            req.twitch_hex = crypto.createHmac(xHub[0], config.hook_secret)
                .update(id + timestamp + buf)
                .digest('hex');
            req.twitch_signature = xHub[1];

            if (req.twitch_signature != req.twitch_hex) {
                console.error('Signature Mismatch');
            } else {
                console.log('Signature OK');
            }
        }
    }
}));

// Routes
app
    .route('/')
    .get((req, res) => {
        console.log('Incoming Get request on /');
        res.send('There is no GET Handler');
    })
    .post((req, res) => {
        console.log('Incoming Post request on /');

        // handle the subscriptions callback/setup
        if (req.body.hasOwnProperty('subscription') && req.headers.hasOwnProperty('twitch-eventsub-message-type')) {
            // it's a webhook
            if (req.body.hasOwnProperty('challenge') && req.headers['twitch-eventsub-message-type'] == 'callback-verification') {
                console.log('Got a challenge, return the challenge');
                res.send(req.body.challenge);
                return;
            }
        }

        // the middleware above ran
        // and it prepared the tests for us
        // so check if we event generated a twitch_hub
        if (req.twitch_hub) {
            if (req.twitch_hex == req.twitch_signature) {
                console.log('The signature matched');
                // the signature passed so it should be a valid payload from Twitch
                // we ok as quickly as possible
                res.send('Ok');

                // you can do whatever you want with the data
                // it's in req.body

                // write out the data to a log for now
                fs.appendFileSync(path.join(
                    __dirname,
                    'webhooks.log'
                ), JSON.stringify({
                    body: req.body,
                    headers: req.headers
                }) + "\n");
                // pretty print the last webhook to a file
                fs.appendFileSync(path.join(
                    __dirname,
                    'last_webhooks.log'
                ), JSON.stringify({
                    body: req.body,
                    headers: req.headers
                }, null, 4));
            } else {
                console.log('The Signature did not match');
                // the signature was invalid
                res.send('Ok');
                // we'll ok for now but there are other options
            }
        } else {
            console.log('It didn\'t seem to be a Twitch Hook');
            // again, not normally called
            // but dump out a OK
            res.send('Ok');
        }
    });
