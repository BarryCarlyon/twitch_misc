## What is this example

This example covers how to recieve Twitch Webhooks in NodeJS.

It's a super "get started" basic example. It doesn't touch on using routes to differentiate streamers/topics etc

## Reference Documentation

- [Webhooks Guide](https://dev.twitch.tv/docs/api/webhooks-guide)
- [Webhooks Reference](https://dev.twitch.tv/docs/api/webhooks-reference)

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
