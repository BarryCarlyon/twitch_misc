## What is this example

This example covers how to recieve Twitch Eventsub over the  Webhook Transport in PHP.

It's a super "get started" basic example.
Only covers how to verify/process EventSub messages over the Webhook Transport

## Reference Documentation

- [EvetnSub Documentation](https://dev.twitch.tv/docs/eventsub)

## Setting up the config

- Open `config_sample.php` in a text editor
- Change the `""` of `EVENTSUB_SECRET` to whatever you want. it's suggested to keep it between a-z (any case) and 0-9. Just for ease of use
- Save your modified file as `config.php`

## Running the example

This should be run on a server thats web accessable, but this example is designed as an example on how to read and validate the data from a Twitch EventSub Webhook rather than be used in production directly.

This example doesn't cover how to SSL termiante which you should do in production and is required for EventSub
