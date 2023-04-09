<?php

include(__DIR__ . '/config.php');

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $game_name = $_POST['game_name'];

    /*
    Generate a token

    Normally you would generate and store a token.
    And use the recalled token until it expires (or is near to expire)
    This example will generate a token each call
    */

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
    
    if ($i['http_code'] != 200) {
        echo json_encode([
            'error' => true,
            'message' => 'Failed to get Token: ' . $i['http_code'] . ' message: ' . $r
        ]);
        exit;
    }

    $tokenData = json_decode($r);
    if (json_last_error() != JSON_ERROR_NONE) {
        echo json_encode([
            'error' => true,
            'message' => 'Failed to parse token JSON'
        ]);
        exit;
    }

    $access_token = $tokenData->access_token;

    // we have a token to use lets call IGDB
    $ch = curl_init('https://api.igdb.com/v4/games/');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        "Client-ID: " . CLIENT_ID,
        "Authorization: Bearer " . $access_token
    ));
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, ''
        . 'fields name, summary, cover.*, screenshots.*; '
        . 'search "' . $_POST['game_name'] . '";'
    );
    //. 'where name = "' . $_POST['game_name'] . '";'
    
    $r = curl_exec($ch);
    $i = curl_getinfo($ch);
    curl_close($ch);

    if ($i['http_code'] != 200) {
        echo json_encode([
            'error' => true,
            'message' => 'Failed to call IGDB: ' . $i['http_code'] . ' message: ' . $r
        ]);
        exit;
    }

    $IGDBData = json_decode($r);
    if (json_last_error() != JSON_ERROR_NONE) {
        echo json_encode([
            'error' => true,
            'message' => 'Failed to parse IGDB JSON'
        ]);
        exit;
    }

    // and pass it back
    echo json_encode([
        'error' => false,
        'games' => $IGDBData
    ]);

    exit;
}

?><!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
    <title>IGDB Example</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-KK94CHFLLe+nY2dmCWGMq91rCGa5gtU4mk92HdvYe+M/SXH301p5ILy+dN9+nJOZ" crossorigin="anonymous">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/js/bootstrap.bundle.min.js" integrity="sha384-ENjdO4Dr2bkBIFxQpeoTz1HIcje39Wm4jDKdf19U8gI4ddQ3GYNS7NTKfAdVQSZe" crossorigin="anonymous"></script>

    <style>
.a_game {
    padding: 20px;
    margin: 5px;
    border-radius: 20px;
    border: 1px solid black;
}
    </style>
</head>
<body>
    <div class="container">
        <div class="container-fluid">
            <div id="messages"> </div>

            <form action="" method="post" id="game_lookup">
                <fieldset>
                    <legend>Lookup a Game</legend>
                    <div class="input-group">
                        <label for="game_name" class="input-group-text">Game Name</label>
                        <input type="text" name="game_name" id="game_name" class="form-control" />
                        <input class="btn btn-outline-primary" type="submit" value="Lookup">
                    </div>
                </fieldset>
            </form>

            <div id="game_output"></div>
        </div>
    </div>

    <script>
        game_lookup.addEventListener('submit', async (e) => {
            e.preventDefault();

            messages.textContent = ' ';

            let resp = await fetch(
                '',
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams([
                        [ 'game_name', game_name.value ]
                    ])
                }
            );
            if (resp.status != 200) {
                messages.textContent = 'Failed to Call myself';
                return;
            }
            let data = await resp.json();
            if (data.error) {
                messages.textContent = `Error loading: ${data.message}`;
                return;
            }

            game_output.textContent = `Found: ${data.games.length} Results`;

            // build display
            data.games.forEach(game => {
                let { id, name, summary, cover, screenshots } = game;

                let g = document.createElement('div');
                game_output.append(g);
                g.classList.add('a_game');

                var d = document.createElement('div');
                g.append(d);
                d.textContent = `ID: ${id} Name: ${name}`;

                var d = document.createElement('div');
                g.append(d);
                d.textContent = summary;

                var c = document.createElement('img');
                g.append(c);
                c.setAttribute('alt', `Cover ${name}`);
                c.setAttribute('title', `Cover ${name}`);
                c.setAttribute('src', `https://images.igdb.com/igdb/image/upload/t_cover_big/${cover.image_id}.jpg`);

                var sc = document.createElement('div');
                g.append(sc);

                screenshots.forEach(shot => {
                    var s = document.createElement('img');
                    sc.append(s);
                    s.setAttribute('alt', `Screenshot ${name}`);
                    s.setAttribute('title', `Screenshot ${name}`);
                    s.setAttribute('src', `https://images.igdb.com/igdb/image/upload/t_cover_big/${shot.image_id}.jpg`);
                });
            });
        });
    </script>
</body>
</html>