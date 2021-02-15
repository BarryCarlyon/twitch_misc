## What is this example

This example covers some basic and uncommented script, that takes an access token (and client config) from a flat JSON file storage.
Validate and regenerate the access token if needed.

Note: Normally you probably wouldn't store the user access tokens in a flat JSON file. It's just done for simplicity of the examples

The Rewards API only lets you modify/change/update rewards and redemtpions of those rewards, for rewards created by the ClientID in `jsons/config_client.json`, so most of these scripts will utilise `only_manageable_rewards` to talk to the rewards that the authenticating user can control.

Thsi ignores things like "Hightlight my Message" which is "not" a Custom reward. And rewards created by the broadcaster in the dashboard.

And then do something depending on the script called

- `interactive_basic_create.js` - using readline ask some questions and create a basic reward (starts disabled)
- `fetch_and_dump_rewards.js` - will fetch the "manageable" rewards for this ClientID for the authenticating user and store them in a json in the `jsons` folder
- `fetch_and_nail.js` - will fetch the "manageable" rewards and delete them all
- `fetch_and_toggle.js` - will ask to enable or disable all "manageable" rewards (via an update/`PATCH` request) on the channel, the ClientID owns.

Check the EventSub folder for a "rough" example of a Server to setup and recieve EventSub Events relating to Channel Points

## Reference Documentation

- [Channel Points Endpoints](https://dev.twitch.tv/docs/api/reference#create-custom-rewards)
- [User Authentication](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#oauth-authorization-code-flow)
- [Server/Server Authentication](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#oauth-client-credentials-flow)

# Authentication Notes

This example uses a "dual authentication" token method.
As EventSub _only_ uses App Access Tokens (aka Server to Server tokens)
But in order to subscribe to the Channel Points Topics, you need to have authenticated the Broadcaster (aka User Tokens) at least once to your application (Client ID) with the relevant scopes. (You could even have no "valid" access tokens on file (just valid refresh tokens)).

IE if you can call the Helix API endpoints (with a User Access Token), so you can catch up when your app is down/restarting, then you can subscribe to the same topics on EventSub (with your App Access Token)

## Running the example

Copy the sample jsons to the same name but remove `_sample` and populate them.

For the access token (`config_user.json`) you will need a [User access token](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#oauth-authorization-code-flow) with the following scopes

- `channel:manage:redemptions`
- `channel:read:redemptions`

In a console/terminal, run these commands:

- `npm install`
- `node scriptofchoice.js`

Follow any prompts if any.

## A note

Just some dumb reference scripts, that might be of use
