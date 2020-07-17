<?php

/*

Twitch Webhooks are great for real time data
This example will handle receiving the data of a hook

This is a PHP example

*/

include(__DIR__ . '/config.php');

// disabled logging functions to dump data
// un comment if you want to see whats going on
//file_put_contents(__DIR__ . '/get_data', print_r($_GET, true));
//file_put_contents(__DIR__ . '/post_data', print_r($_POST, true));
//file_put_contents(__DIR__ . '/head_data', print_r(getallheaders(), true));
//file_put_contents(__DIR__ . '/body_data', file_get_contents('php://input'));

// a utility function to log information for debugging purposes
function mylog($s) {
    file_put_contents(__DIR__ . '/log', $s . "\n", FILE_APPEND);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // we have data incoming from Twitch

    mylog('Starting a POST processing');

    $headers = getallheaders();
    // next lets validate the Signature
    if (!isset($headers['X-Hub-Signature'])) {
        // the header is missing
        mylog('Missing sig');
        http_response_code(400);
        echo 'Bad Request';
        exit;
    }

    // the data is NOT in the $_POST varible
    // since it is a JSON Body
    $raw_data = file_get_contents('php://input');

    // lets process the raw data
    // and determine the signature
    $raw_twitch_signature = $headers['X-Hub-Signature'];
    mylog($raw_twitch_signature);

    [ $protocol, $twitch_signature ] = explode('=', $raw_twitch_signature, 2);

    mylog($protocol . '----' . $twitch_signature);

    $our_signature = hash_hmac($protocol, $raw_data, WEBHOOKS_SECRET);

    mylog($twitch_signature);
    mylog($our_signature);

    if ($our_signature == $twitch_signature) {
        // passes

        // lets parse the data into an object
        $data = json_decode($raw_data);
        // and check the data parse
        if (json_last_error() == JSON_ERROR_NONE) {
            // we passed all the checks
            // tell Twitch it's OK
            echo 'Ok';
            // and now do something with the $data

            // $data is an object, not an array

            // end doing something with the $data
            exit;
        }
    }

    mylog('Mismatch');

    // the JSON didn't parse
    // so we'll 400 out
    http_response_code(400);
    echo 'Bad Request';
} else if (isset($_GET['hub_challenge']) && $_GET['hub_challenge']) {
    // PHP convers periods in query string arguments to underscores
    // Normally you'll run some validation
    // to check the topic is one you are expecting

    // example of inbound data
    /*
    Array
    (
        [hub_challenge] => SOMECHALLENGE
        [hub_lease_seconds] => 86400
        [hub_mode] => subscribe
        [hub_topic] => https://api.twitch.tv/helix/SNIP
    )
    */

    // return the challenge to complet the handshake
    echo $_GET['hub_challenge'];
} else {
    // Its not a POST request
    // and it's not a verification request
    // someone just loaded the Endpoint
    echo 'Ok';
}
