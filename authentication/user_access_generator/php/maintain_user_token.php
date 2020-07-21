<?php

/*
Maintianing a users token

This doesn't give an "opinion" on where to store the users token

But we will use a flat file for simplicity of the example

Assumption: you used a website, perhaps using index.php to obtain and store a token

*/

// Load API Keys
include(__DIR__ . '/config.php');

// Load existing authentication
$keys = json_decode(file_get_contents(__DIR__ . '/auth.json'));

// check validity
$ch = curl_init('https://id.twitch.tv/oauth2/validate');
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Authorization: OAuth ' . $keys->access_token
));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$r = curl_exec($ch);
$i = curl_getinfo($ch);
curl_close($ch);

$generate_token = false;
if ($i['http_code'] != 200) {
    echo 'Failed token invalid. Attempt refresh';
    $generate_token = true;
} else {
    $data = json_decode($r);
    if (json_last_error() == JSON_ERROR_NONE) {
        if ($data->expires_in < 600) {
            // less than ten minutes left
            // make a new token
            echo 'Token close to expire. Regenerate';
            $generate_token = true;
        }
    } else {
        echo 'Failed to parse JSON. Assume dead token';
        $generate_token = true;
    }
}

if ($generate_token) {
    // make new token using the refresh token
    $ch = curl_init('https://id.twitch.tv/oauth2/token');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, array(
        'grant_type' => 'refresh_token',
        'refresh_token' => $keys->refresh_token,
        'client_id' => CLIENT_ID,
        'client_secret' => CLIENT_SECRET
    ));

    $r = curl_exec($ch);
    $i = curl_getinfo($ch);
    curl_close($ch);

    if ($i['http_code'] != 200) {
        echo 'Failed token regen';
        echo $r;
        exit;
    }

    // save the new key back to the flat file
    file_put_contents(__DIR__ . '/auth.json', $r);

    $keys = json_decode($r);
}

// $keys contains the keys to use
// example: checking the user for this token
$ch = curl_init('https://api.twitch.tv/helix/users');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Client-ID: ' . CLIENT_ID,
    'Authorization: Bearer ' . $keys->access_token
));

$r = curl_exec($ch);
$i = curl_getinfo($ch);

curl_close($ch);

print_r(json_decode($r));
