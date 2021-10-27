<?php

// Start a sesstion mangler
session_start();

// load in the Configuration
include(__DIR__ . '/config.php');

$error = false;

// bad router, but easier to one file this for the example
if (isset($_GET['logout'])) {
    if (isset($_SESSION['access_token'])) {
        $ch = curl_init(''
            . 'https://id.twitch.tv/oauth2/revoke'
            . '?client_id=' . client_id
            . '&token=' . $_SESSION['access_token']);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $r = curl_exec($ch);

        // note: not testing the HTTP response codes,
        // since we don't care too much as logging out
        curl_close($ch);
    }

    session_destroy();
    header('Location: /');

    exit;
} else if (isset($_GET['code']) && $_GET['code']) {
    // we have a code on the address line so lets parse and exchange

    // validate the state/nonce
    if (isset($_SESSION['nonce']) && isset($_GET['state']) && $_SESSION['nonce'] == $_GET['state']) {
        // lets exchange the code for an access token
        $ch = curl_init('https://id.twitch.tv/oauth2/token');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, array(
            'client_id' => CLIENT_ID,
            'client_secret' => CLIENT_SECRET,
            'code' => $_GET['code'],
            'grant_type' => 'authorization_code',
            'redirect_uri' => REDIRECT_URI
        ));

        // fetch the data
        $r = curl_exec($ch);
        // get the information about the result
        $i = curl_getinfo($ch);
        // close the request
        curl_close($ch);

        if ($i['http_code'] == 200) {
            $token = json_decode($r);

            // always a good idea to check the JSON parsed correctly
            if (json_last_error() == JSON_ERROR_NONE) {
                // looks good
                $_SESSION['token'] = $token;
                // file_put_contents(__DIR__ . '/auth.json', $r, JSON_PRETTY_PRINT);

                // login is complete
                // now we'll redirect home for the "main" viewer
                // so we can remove the ?code= from the URL
                // so users can't F5 the page and get an error
                // since codes are one use

                header('Location: /');
                exit;
            } else {
                $error = 'Failed to parse the JSON at code for token exchange';
            }
        } else {
            // spit out an error
            // we are throwing the result on the end here
            // you wouldn't normally do this in production
            $error = 'An Error Occured at code for token exchange: ' . print_r($r, true);
        }
    } else {
        $error = 'State invalid, please try again';
    }
} else if (isset($_SESSION['token'])) {
    // we already have a token
    // lets validate and render
    $ch = curl_init('https://id.twitch.tv/oauth2/validate');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Authorization: Bearer ' . $_SESSION['token']->access_token
    ));

    $r = curl_exec($ch);
    $i = curl_getinfo($ch);

    curl_close($ch);

    if ($i['http_code'] == 200) {
        $validation = json_decode($r);

        if (json_last_error() == JSON_ERROR_NONE) {
            // token is good
            // lets get the user this token is for

            $ch = curl_init('https://api.twitch.tv/helix/users');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                'Client-ID: ' . CLIENT_ID,
                'Authorization: Bearer ' . $_SESSION['token']->access_token
            ));

            $r = curl_exec($ch);
            $i = curl_getinfo($ch);

            curl_close($ch);

            if ($i['http_code'] == 200) {
                $user = json_decode($r);

                if (json_last_error() == JSON_ERROR_NONE) {
                    // we'll do a single helix sanity check here
                    if (isset($user->data) && count($user->data) == 1 && $user->data[0]) {
                        $user = $user->data[0];

                        include(__DIR__ . '/pages/loggedin.php');
                        exit;
                    }

                    $error = 'Helix returned not one user';
                } else {
                    $error = 'An Error ocucred at Parsing the User response';
                }
            } else {
                $error = 'An Error occured fetching the user';
            }
        } else {
            $error = 'An Error ocucred at Parsing the Validation response';
        }
    } else {
        $error = 'An Error occured validating the token';
    }

    unset($_SESSION['token']);// token error so dump it
}

// we'll create a nonce/one use token to prevent CSRF attacks
$_SESSION['nonce'] = base64_encode(random_bytes(10));

// if we got here we need to Show the login "page"
include(__DIR__ . '/pages/loggedout.php');
