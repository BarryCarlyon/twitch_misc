<!DOCTYPE html>
<html lang="en">
<head>
    <title>Twitch User Access Generator Example</title>
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
        <div class="container-fluid">
            <div id="messages">
                <?php
                    if (isset($_GET['error_description'])) {
                        echo '<div class="alert alert-danger" role="alert">' . $_GET['error_description'] . '</div>';
                    }
                    if ($error) {
                        echo '<div class="alert alert-danger" role="alert">' . $error . '</div>';
                    }
                ?>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <h2>Construct a custom auth</h2>
                <p>You <i>could</i> pick some scopes but you don't have to</p>
                <table class="table table-striped table-hover">
                    <?php
                        $scopes = json_decode(file_get_contents(__DIR__ . '/../../scopes.json'));
                        foreach ($scopes as $group => $aset) {
                            echo '<tr><th>' . $group . '</th></tr>';

                            foreach ($aset as $scope => $desc) {
                                echo '<tr><td>' . $scope . '</td><td>' . $desc . '</td><td>';
                                echo '<input type="checkbox" name="' . $scope . '" />';
                                echo '</td></tr>';
                            }
                        }
                    ?>
                    <tr>
                        <th>Extra</th>
                    </tr>
                    <tr>
                        <td>Enable Force Verify</td>
                        <td>Specifies whether the user should be re-prompted for authorization. If this is true, the user always is prompted to confirm authorization. This is useful to allow your users to switch Twitch accounts, since there is no way to log users out of the API. Default: false (a given user sees the authorization page for a given set of scopes only the first time through the sequence).</td>
                        <td>
                            <input type="checkbox" name="force_verify">
                        </td>
                    </tr>
                </table>
                <h3>And Go</h3>
                <ul>
                    <li>Client: <?php echo CLIENT_ID; ?></li>
                    <li>Redirect: <?php echo REDIRECT_URI; ?></li>
                </ul>
                <textarea style="width:100%;" rows="5" id="auth_url_preview">
                </textarea>
                <a href="" id="auth_url">Go Auth</a>
            </div>
        </div>
    </div>
    <script type="text/javascript">var client_id = "<?php echo CLIENT_ID; ?>"; var redirect_uri = encodeURIComponent("<?php echo REDIRECT_URI; ?>"); var state = encodeURIComponent("<?php echo $_SESSION['nonce'] ?>");</script>
    <script type="text/javascript" src="script.js">
    </script>
</body>
</html>
