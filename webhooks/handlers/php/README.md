## What is this example

This example covers how to recieve Twitch Webhooks in PHP.

It's a super "get started" basic example. It doesn't touch on using routes to differentiate streamers/topics etc

## Reference Documentation

- [Webhooks Guide](https://dev.twitch.tv/docs/api/webhooks-guide)
- [Webhooks Reference](https://dev.twitch.tv/docs/api/webhooks-reference)

## Setting up the config

- Open `config_sample.php` in a text editor
- Change the `""` of `hub_secret` to whatever you want. it's suggested to keep it between a-z (any case) and 0-9. Just for ease of use
- Save your modified file as `config.php`

## Running the example

This should be run on a server thats web accessable, but this example is designed as an example on how to read and validate the data from a Twitch webhook rather than be used in production directly.

This example doesn't cover how to SSL termiante which you should do in production and is required for some topics
