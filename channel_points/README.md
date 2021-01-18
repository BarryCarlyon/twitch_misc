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

## Reference Documentation

- [Channel Points Endpoints](https://dev.twitch.tv/docs/api/reference#create-custom-rewardse)

## Running the example

Copy the sample jsons to the same name but remove `_sample` and populate them.

For the access token (`config_user.json`) you will need an access token with the following scopes

- `channel:manage:redemptions`
- `channel:read:redemptions`

In a console/terminal, run these commands:

- `npm install`
- `node scriptofchoice.js`

Follow any prompts if any.

## A note

Just some dumb reference scripts, that might be of use
