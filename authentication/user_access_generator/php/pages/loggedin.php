<!DOCTYPE html>
<html lang="en">
<head>
    <title>Twitch User Access Generator Example | Logged In</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous">
    <script src="https://code.jquery.com/jquery-3.4.1.slim.min.js" integrity="sha384-J6qa4849blE2+poT4WnyKhv5vZF5SrPo0iEjwBvKU7imGFAV0wwj1yYfoRSJoZ+n" crossorigin="anonymous">
    </script>
    <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js" integrity="sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo" crossorigin="anonymous">
    </script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js" integrity="sha384-wfSDF2E50Y2D1uUdj0O3uMBJnjuUD4Ih7YwaYd1iqfktj0Uod8GCExl3Og8ifwB6" crossorigin="anonymous">
    </script>
</head>
<body>
    <div class="container">
        <div class="row">
            <div class="col">
                <h2>Logged in</h2>
                <p>You are logged in. Unlike the <a href="https://barrycarlyon.github.io/twitch_misc/authentication/implicit_auth/">Implicit Auth example</a>, we don't show you you own token, thats held securely on the server.</p>
                <p>You can <a href="?logout=1">Logout</a> Which will also revoke the stored/server side token.</p>

                <h2>User from session</h2>
                <p>We fetched and cached this when you logged in, from the New API <a href="https://dev.twitch.tv/docs/api/reference#get-users">Users</a> Endpoint, so if you reload the page, you'll still be logged in!
                <p>If you selected the <code>user:read:email</code> scope, you'll also get your Email returned, otherwise it'll be omitted.</p>


                <table class="table table-striped table-hover">
                <?php
                    foreach ($user as $key => $value) {
                        echo '<tr>';
                        echo '<td>' . $key . '</td>';
                        echo '<td>' . $value . '</td>';
                        echo '</tr>';
                    }
                ?>
                </table>

                <h2>Token Details from <a href="https://dev.twitch.tv/docs/authentication#validating-requests">Validate</a> endpoint</h2>
                <table class="table table-striped table-hover">
                <?php
                    foreach ($validation as $key => $value) {
                        echo '<tr>';
                        echo '<td>' . $key . '</td>';
                        echo '<td>' . print_r($value, true) . '</td>';
                        echo '</tr>';
                    }
                ?>

            </div>
        </div>
    </div>
    </script>
</body>
</html>
