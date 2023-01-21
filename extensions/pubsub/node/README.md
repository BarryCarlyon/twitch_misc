## What is this example

This example describes a NodeJS Method to send a Twitch Extension PubSub message via NOde.


## Reference Documentation

- [Send Extension PubSub Message](https://dev.twitch.tv/docs/extensions/reference#send-extension-pubsub-message)

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
- In the file `send.js` add a channelID (again wrapped in `""`) on line 11

If is *important* that the `owner` in the `config.json` is wrapped in `"`, as channelID's and userID's for extensions need to be cast as strings, not numerics.

## Running the example

In a console/terminal, run these commands:

- `npm install`
- `node set_n_publish.js`

It'll either return, (the current rate limit may differ)

- Ok 99/100

or

- an error, and a description about that error
