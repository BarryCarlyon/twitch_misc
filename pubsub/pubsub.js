const fs = require('fs');
const path = require('path');

const WebSocket = require('ws');

// setup pubsub
var pubsub;
const myname = '';

var ping = {}
ping.pinger = false;
ping.start = function() {
    if (ping.pinger) {
        clearInterval(ping.pinger);
    }
    ping.sendPing();

    ping.pinger = setInterval(function() {
        setTimeout(function() {
            ping.sendPing();
            //jitter
        }, Math.floor((Math.random() * 1000) + 1));
    }, (4 * 60 * 1000));
}// at least ever 5 minutes
ping.sendPing = function() {
    try {
        pubsub.send(JSON.stringify({
            type: 'PING'
        }));
        ping.awaitPong();
    } catch (e) {
        console.log(e);

        pubsub.close();
        start();
    }
}
ping.awaitPong = function() {
    ping.pingtimeout = setTimeout(function() {
        console.log('WS Pong Timeout');
        pubsub.close();
        //start();
    }, 10000)
}
ping.gotPong = function() {
    clearTimeout(ping.pingtimeout);
}


var requestListen = function(topics, token) {
    let pck = {}
    pck.type = 'LISTEN';
    pck.nonce = myname + '-' + new Date().getTime();

    pck.data = {};
    pck.data.topics = topics;
    if (token) {
        pck.data.auth_token = token;
    }

    pubsub.send(JSON.stringify(pck));
}


var start = function() {
    // make new ws connection
    pubsub = new WebSocket('wss://pubsub-edge.twitch.tv');

    pubsub.on('close', function() {
        console.log('disconnected');
        start();
    }).on('open', function() {
        ping.start();

        runAuth();
    });

    pubsub.on('message', function(raw_data, flags) {
        fs.appendFileSync(__dirname + '/pubsub_messages.log', raw_data);

        var data = JSON.parse(raw_data);
        if (data.type == 'RECONNECT') {
            console.log('WS Got Reconnect');
            // restart
            pubsub.close();
        } else if (data.type == 'PONG') {
            ping.gotPong();

        } else if (data.type == 'RESPONSE') {
            console.log(data);
            console.log('RESPONSE: ' + (data.error ? data.error : 'OK'));
        } else if (data.type == 'MESSAGE') {
            var msg = JSON.parse(data.data.message);
            console.log(msg);
        } else {
            console.log(data);
        }
    });
}

// collect and start
var runAuth = function() {
    requestListen([
        'topic.a',
        'topic.c'
    ], 'auth_a');

    requestListen([
        'topic.b'
    ], 'auth_b');

    requestListen([
        'topic.another'
    ]);
}

start();
