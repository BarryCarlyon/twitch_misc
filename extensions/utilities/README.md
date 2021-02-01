## What is this example

This example has some utilitiy scripts

Gotchas: when fetching global, Twitch returns it as `global:`

## Reference Documentation

- [Get Extension Configuration Segment](https://dev.twitch.tv/docs/extensions/reference#get-extension-channel-configuration)
- [Set Extension Configuration Segment](https://dev.twitch.tv/docs/extensions/reference#set-extension-configuration-segment)
- [Example: Set Config and PubSub Publish it to Extension Clients](https://github.com/BarryCarlyon/twitch_misc/tree/master/extensions/config_service)

## Setting up the config

- Open `config_sample.json` in a text editor
- Visit [Twitch Dev Console](https://dev.twitch.tv/console/)
- Visit Extensions
- Manage your Extension, or create one if you don't have any
- Top right select "Extension Settings"
- Copy the "Client ID" from the top into the `""` of `client_id`
- Down the bottom under `Extension Client Configuration` hit the `show` button
- Copy the contents of the field into the `""` of `extension_secret`
- Set the `""` of `user_id` to the TwitchID of the user that owns the extension, usually this is you but it might not be
- Save your modified file as `config.json`

If is *important* that the `user_id` in the `config.json` is wrapped in `"`, as channelID's and userID's for extensions need to be cast as strings, not numerics.

## Running the example

In a console/terminal, run these commands:

- `npm install`

To get the current global

- `node get_global.js`

This will populate `global_config.json` with the current global config for you extension. edit as needed.

To set the global using contents of `global_config.json`

- `node set_global.js`
