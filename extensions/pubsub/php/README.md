## What is this example

This example describes a PHP Method to send a Twitch Extension PubSub message via PHP.

It uses [Firebase JWT](https://github.com/firebase/php-jwt) to handle Encoding.

## Reference Documentation

- [Send Extension PubSub Message](https://dev.twitch.tv/docs/extensions/reference#send-extension-pubsub-message)

## Setting up the config

- Open `config_sample.php` in a text editor
- Visit [Twitch Dev Console](https://dev.twitch.tv/console/)
- Visit Extensions 
- Manage your Extension, or create one if you don't have any
- Top right select "Extension Settings"
- Copy the "Client ID" from the top into the `''` of `EXTENSION_CLIENT_ID`
- Down the bottom under `Extension Client Configuration` hit the `show` button
- Copy the contents of the field into the `''` of `EXTENSION_SECRET`
- Set the `''` of `EXTENSION_OWNER` to the TwitchID of the user that owns the extension, usually this is you but it might not be
- Save your modified file as `config.php`

## Running the example

Run componser install in this directory.

If you don't have Composer, refer to [GetComposer](https://getcomposer.org/)

- `composer install`
- `php send_pubsub_message.php`

It'll either return, (the current rate limit may differ)

- Ok 99/100

or

- an error, and a description about that error
