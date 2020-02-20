## What is this example

This example covers a way to create and maintain an app access token. And store that app access token in Redis to maintain/recover it between restarts and for use in other programs running on the same server.

It's written roughly like a node module

## Reference Documentation

- [oAuth Client Credentials Flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#oauth-client-credentials-flow)
- [Validating Requests](https://dev.twitch.tv/docs/authentication#validating-requests)

## Setting up the config

- Open `config_sample.json` in a text editor
- Visit [Twitch Dev Console](https://dev.twitch.tv/console/)
- Visit Applications
- Manage your Application, or create one if you don't have one
- Copy the Client ID into the `""` of `client_id`
- Hit `New Secret` and then Ok
- Then copy the now Displayed Client Secret into the `""` of `client_secret`
- Save your modified file as `config.json`

## Running the example

In a console/terminal, run these commands:

- `npm install`
- `node run.js`

## A note

The Redis storage is using a hash key, so access tokens are stored in a hash called `twitch_auth` and a key called `twitch_client_credentials_` and appending the ClientID, so you can feasiably store multiple app access tokens for different client ID's in the same Redis hash. If for example your Server serves multiple Extensions or Twitch Applications.
