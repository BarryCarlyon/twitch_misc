## What is this example

A Token Generator of sorts. To demonstrate how to perform Scoped User oAuth authentication

## Reference Documentation

- [OAuth Authorization Code Flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#oauth-authorization-code-flow)
- [Validating Requests](https://dev.twitch.tv/docs/authentication#validating-requests)
- [Revoking Access Tokens](https://dev.twitch.tv/docs/authentication#revoking-access-tokens)

## Setting up the config

- Open `config_sample.json` in a text editor
- Visit [Twitch Dev Console](https://dev.twitch.tv/console/)
- Visit Applications
- Manage your Application, or create one if you don't have one
- Copy the Client ID into the `""` of `client_id`
- Hit New Secret then Ok
- Copy the new Clietn Secret into the `""` of `client_secret`
- Add or change the `OAuth Redirect URLs` to include one for `http://localhost:8000/` as Twitch now support multiples
- Save your modified file as `config.json`

You can change the port in config if you want but remember to change it in the Redirect URL's as well, and update the configs `redirect_uri`

## Running the example

In a console/terminal, run these commands:

- `npm install`
- `node server.js`
- Open [http://localhost:8000](http://localhost:8000) in a browser
