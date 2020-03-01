## What is this example

This example covers how to use the config service and pubsub service together to sensibly update configuration for an extension and update running versions of that extension.

Specifically covers setting configuration for _all_ channels the extension is active upon, not channel specific configurations, but modifications for specific channels is straight forward to make.

## Reference Documentation

- [Set Extension Configuration Segment](https://dev.twitch.tv/docs/extensions/reference#set-extension-configuration-segment)
- [Send Extension PubSub Message](https://dev.twitch.tv/docs/extensions/reference#send-extension-pubsub-message)
- [Helper: Configuration](https://dev.twitch.tv/docs/extensions/reference#helper-configuration)
- [Helper: Extensions - Listen](https://dev.twitch.tv/docs/extensions/reference#helper-extensions)

## Setting up the config

- Open `config_sample.json` in a text editor
- Visit [Twitch Dev Console](https://dev.twitch.tv/console/)
- Visit Extensions
- Manage your Extension, or create one if you don't have any
- Top right select "Extension Settings"
- Copy the "Client ID" from the top into the `""` of `client_id`
- Down the bottom under `Extension Client Configuration` hit the `show` button
- Copy the contents of the field into the `""` of `extension_secret`
- Set the `""` of `owner` to the TwitchID of the user that owns the extension, usually this is you but it might not be
- Save your modified file as `config.json`

If is *important* that the `owner` in the `config.json` is wrapped in `"`, as channelID's and userID's for extensions need to be cast as strings, not numerics.

## Setting up the extension

This'll be covered in another quick help example, but for now:

Your Extension front end will need to include the code similar to what is in `set_n_publish_frontend.js`

## Running the example

In a console/terminal, run these commands:

- `npm install`
- `node set_n_publish.js`
