<?php

include(__DIR__ . '/config.php');

$ch = curl_init('https://id.twitch.tv/oauth2/token');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, array(
    'client_id' => CLIENT_ID,
    'client_secret' => CLIENT_SECRET,
    'grant_type' => "client_credentials"
));

$r = curl_exec($ch);
$i = curl_getinfo($ch);
curl_close($ch);

if ($i['http_code'] == 200) {
    $data = json_decode($r);
    if (json_last_error() == JSON_ERROR_NONE) {
        echo 'Got token';
        print_r($data);
    } else {
        echo 'Failed to parse JSON';
    }
} else {
    echo 'Failed with ' . $i['http_code'] . ' ' . $r;
}
