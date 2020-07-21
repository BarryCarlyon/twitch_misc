## What is this example

This example covers a way to create and maintain an app access token in PHP. And store that app access token in a Flat file to maintain/recover it between restarts and for use in other programs running on the same server.

There are three examples

- Generating app access token via form post
- Generating app access token via query string post (like the docs)
- A script to load an existing token and regenerate if it's close to expiration

## Reference Documentation

- [oAuth Client Credentials Flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#oauth-client-credentials-flow)
- [Validating Requests](https://dev.twitch.tv/docs/authentication#validating-requests)

## Setting up the config

- Open `config_sample.php` in a text editor
- Visit [Twitch Dev Console](https://dev.twitch.tv/console/)
- Visit Applications
- Manage your Application, or create one if you don't have one
- Copy the Client ID into the `""` of `CLIENT_ID`
- Hit `New Secret` and then Ok
- Then copy the now Displayed Client Secret into the `""` of `CLIENT_SECRET`
- Save your modified file as `config.php`

## Running the example

In a console/terminal, run php and the script you want to test.
