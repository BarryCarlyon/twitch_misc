## What is this example

A User Token Generator/refresher for Server Interactive Scripts

## Reference Documentation

- [OAuth Authorization Code Flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#oauth-authorization-code-flow)
- [Validating Requests](https://dev.twitch.tv/docs/authentication#validating-requests)
- [Refreshing Tokens](https://dev.twitch.tv/docs/authentication#refreshing-access-tokens)
- [Available API Scopes](https://dev.twitch.tv/docs/authentication#scopes)

## Setting up the config

- Open `config_sample.json` in a text editor
- Visit [Twitch Dev Console](https://dev.twitch.tv/console/)
- Visit Applications
- Manage your Application, or create one if you don't have one
- Copy the Client ID into the `""` of `client_id`
- Hit New Secret then Ok
- Copy the new Client Secret into the `""` of `client_secret`
- Add or change the `OAuth Redirect URLs` to include one for `https://barrycarlyon.github.io/twitch_misc/examples/auth_code_no_server/` as Twitch now support multiples, or copy the HTML/JS of that example to your own server and use that URL
- Save your modified file as `config.json`

You can change the port in config if you want but remember to change it in the Redirect URL's as well, and update the configs `redirect_uri`

## Running the example

In a console/terminal, run these commands:

- `npm install`
- `node example_task.js`
- Follow the instructions

## Notes

This Example script requires the use of a WebPage to capture and Display the `?code` to be copy and pasted to the script.
An example of this is provided [in this report](../../main/examples/auth_code_no_server/)
