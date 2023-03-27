## What is this example

A User Token Generator/refresher for Server Interactive Scripts.

This is similar to how the Google NodeJS API's examples work.

- You start a script, it shows a URL to open.
- You Google oAuth
- A code is displayed
- User/You copy and paste the code back into the interactive script
- Away we go

When you (re)start the script again, it will validate the token, refresh if it can and if needed prompt for a fresh set of keys/tokens.

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

There are two examples.

- `example_task.js` is a interactive script for doing a task after getting auth and handling refresh, could be interative/shell based chnanel points or title managment
- `simple.js` which I commonly call `seeder.js` will do a code for token exchange and store the access and refresh into redis. Something else will use and manage the refresh of that token, this could be a chat bot where you didn't want to expose port 80 or 443

In a console/terminal, run these commands:

- `npm install`
- `node example_task.js`
- Follow the instructions

## Notes

This Example script requires the use of a WebPage to capture and Display the `?code` to be copy and pasted to the script.
An example of this is provided elsewhere [in this repo](https://github.com/BarryCarlyon/twitch_misc/tree/main/examples/auth_code_no_server)
