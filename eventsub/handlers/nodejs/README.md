## What is this example

This example covers how to recieve Twitch EventSub via the Webhook transport in NodeJS.

It's a super "get started" basic example. It doesn't cover how to create subscriptions.

The primary intent here is to demonstrate a basic handler and how to handle the verification of payloads via the shared secret.

## Reference Documentation

- [EvetnSub Documentation](https://dev.twitch.tv/docs/eventsub)

## Setting up the config

- Open `config_sample.json` in a text editor
- Change the 8000 to whatever port you want, or leave it be
- Change the `""` of `hub_secret` to whatever you want. it's suggested to keep it between a-z (any case) and 0-9. Just for ease of use
- Save your modified file as `config.json`

## Running the example

In a console/terminal, run these commands:

- `npm install`
- `node receive.js`

This should be run on a server thats web accessable, but this example is designed as an example on how to read and validate the data from a Twitch webhook rather than be used in production directly.

This example doesn't cover how to SSL termiante which you should do in production
