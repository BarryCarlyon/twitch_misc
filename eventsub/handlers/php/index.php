<?php

/*

Twitch Eventsub using a Webhook transport are great for real time data
This example will handle receiving the data of an eventsub hook

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

    $input_headers = getallheaders();
    // save our soul headers
    // HTTP Spec suggests they should be lower case always
    // so we'll convert to save some sanity
    $headers = [];
    foreach ($input_headers as $header => $value) {
        $headers[strtolower($header)] = $value;
    }
    // save our soul headers
    
    // next lets validate the Signature
    if (!isset($headers['twitch-eventsub-message-signature'])) {
        // the security header is missing
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
    $raw_twitch_signature = $headers['twitch-eventsub-message-signature'];
    mylog($raw_twitch_signature);

    [ $protocol, $twitch_signature ] = explode('=', $raw_twitch_signature, 2);

    mylog($protocol . '----' . $twitch_signature);
  
    // grab the other headers we need
    $twitch_message_id = $headers['twitch-eventsub-message-id'];
    $twitch_event_timestamp = $headers['twitch-eventsub-message-timestamp'];

    $our_signature = hash_hmac($protocol, $twitch_message_id . $twitch_event_timestamp . $raw_data, EVENTSUB_SECRET);

    mylog($twitch_signature);
    mylog($our_signature);

    if ($our_signature == $twitch_signature) {
        // passes test

        if ($headers['twitch-eventsub-message-type'] == 'webhook_callback_verification') {
            // it's a verification request
            $data = json_decode($raw_data);
            // and check the data parse
            if (json_last_error() == JSON_ERROR_NONE) {
                mylog('Returning the challenge: ' . $data['challenge']); 
                echo rawurlencode($data['challenge']);
                exit;
            }
            mylog('Failed to parse the JSON to vierification');
            echo 'Failed to parse JSON';
            exit;
        }
        if ($headers['twitch-eventsub-message-type'] == 'revocation') {
            // the eventsub subscription was revoked
            echo 'Ok';
            exit;
        }
        if ($headers['twitch-eventsub-message-type'] == 'notification') {
            // lets parse the data from the notification into an object
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
        
        // an eventsub weird if you go here
        echo 'Ok';
        exit;
    }

    mylog('Mismatch');

    // the JSON didn't parse
    // so we'll 400 out
    http_response_code(400);
    echo 'Bad Request';
} else {
    // Its not a POST request
    // and it's not a verification request
    // someone just loaded the Endpoint
    echo 'Ok';
}
