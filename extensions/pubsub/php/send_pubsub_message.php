<?php

include(__DIR__ . '/config.php');
include(__DIR__ . '/vendor/autoload.php');

use \Firebase\JWT\JWT;

// the channelID we are sending a message to
// as a string
$channel_id = '';
$message_to_send = 'here is the message we are sending to the extension';

$payload = array(
    'exp' => time() + 10,
    'user_id' => EXTENSION_OWNER,
    'channel_id' => $channel_id,
    'role' => 'external',
    'pubsub_perms' => array(
        'send' => array(
            'broadcast'
        )
    )
);

// We need to base64 decode the secret before we can use it
$secret = base64_decode(EXTENSION_SECRET);

// generate a JWT token
$token = JWT::encode($payload, $secret);

// build curl to make request
$ch = curl_init('https://api.twitch.tv/extensions/message/' . $channel_id);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Client-ID: ' . EXTENSION_CLIENT_ID,
    'Authorization: Bearer ' . $token,
    'Content-Type: application/json'
));
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(array(
    'message' => $message_to_send,
    'content_type' => 'application/json',
    'targets' => array('broadcast')
)));

// run the request
$resp = curl_exec($ch);
$info = curl_getinfo($ch);
curl_close($ch);

// lets do some basic parsing
$header_size = $info['header_size'];
$header = substr($resp, 0, $header_size);
$body = substr($resp, $header_size);

// process headers
$header = explode("\r\n", $header);
$headers = [];
foreach ($header as $k => $v) {
    $v = explode(': ', $v, 2);
    if (count($v) == 2) {
        $headers[$v[0]] = $v[1];
    }
}

// display a response
if ($info['http_code'] == 204) {
    echo 'OK ' . $headers['ratelimit-ratelimitermessagesbychannel-remaining'] . '/' . $headers['ratelimit-ratelimitermessagesbychannel-limit'];
} else {
    echo 'An Error Occured ' . $info['http_code'] . ' Twitch: ' . $body;
}
