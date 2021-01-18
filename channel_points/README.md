## What is this example

This example covers some basic and uncommented script, that takes an access token (and client config) from a flat JSON file storage.
Validate and regenerate the access token if needed.

And then do something depending on the script called

- interactive_basic_create.js - using readline ask some questions and create a basic reward
- fetch_and_dump_rewards.js - will fetch the "manageable" rewards for this ClientID for the authenticating user
- fetch_and_nail.js - will fetch the "manageable" rewards and delete them all

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

## A note

Just some dumb reference scripts
