## What is this example

This is an "example" server that will hamdle EventSub for Channel Points.
Won't do anything when an event arrives.
But will setup the subscriptions

## Reference Documentation

- [Channel Points Endpoints](https://dev.twitch.tv/docs/api/reference#create-custom-rewardse)
- [Event Sub](https://dev.twitch.tv/docs/eventsub)

## Running the example

Copy the sample jsons (up a directoy) to the same name but remove `_sample` and populate them.

For the access token (`config_user.json`) you will need an access token with the following scopes

- `channel:manage:redemptions`
- `channel:read:redemptions`

For the "secret" *DO NOT USES YOUR APPLICATION `client_secret`* it should be any random string.

The callback URL needs to be SSL Secured!

In a console/terminal, run these commands:

- `npm install`
- `node server.js`

The server will then boot up.

- Validate or generate an app access token (`app_access.json`)
- Validate (and regenerate if needed) the user access Token (`config_user.json`)
- Pull the active EventSub subscriptions for this (`config_client.json`) ClientID
- Compare that list against the needed Topics for Channel Point items and redemptions of
- Create any subscriptions that are "non existant" (example doesn't handle failed subs)
- Setup a server to capture and process subscription creation and payloads.

The utility script of `delete_subscriptions.js`

Run via

- `node delete_subscriptions.js`

Will delete the created subscriptions.

## A note

Just some dumb reference scripts, that might be of use

Normally I would seperate my "reciever server" and "subscription management" scripts. This example is just nice to make a "one scripter"
