## What is this example

This example covers a way to make a Twitch Chat client/bot in node.js

This example defines functions to handle Chat Commands and token managment.

This example uses tokenization via space rather than tokenization via regex

This example differs from the Example one folder up, as this uses a "template/library" file so the Chat Parsing logic is in a seperate file and emits events.

So you can run a lot of bots out of one folder without copy/pasting all the parsing logic into multiple files and a single change to the central libray updates all bots.

A rising tide lifts all boats?

I'm not one for libraries too much but I'll shunt the parse logic into a includable.

## Notes

This example requires node.js 18+ as it uses the native fetch implementation in node.js 18

It's relatively in progess/incomplete....

## Operation

The `.env` file is populated as follows

- `access_token` - a Twitch access token with a _BUNCH_ of Twitch Scopes needed for the bot to function
- `channels` - a CSV of channels to initially connect to

The `.env` items are passed to the ChatBot constructor as the options.

At bot start, the bot calls the Twitch API to validate the token, and determine the `client_id` of that token, the `client_id` is needed for Chat Command calls.

If the `.env` file provides a `refresh_token` the bot will attempt to refresh the token when needed/close to expire. This will require the `client_secret` to be provided as well. So you may as well include the `client_id` in `.env` and bot construct. Even though it will be fetched from the validate endpoint.

So, the minimum setup is

```javascript
    bot = new ChatBot({
        access_token: process.env.access_token,

        channels: process.env.channels.split(',')
    });
```

But recommened

```javascript
    bot = new ChatBot({
        client_id: process.env.client_id,
        client_secret: process.env.client_secret,

        access_token: process.env.access_token,

        channels: process.env.channels.split(',')
    });
```

At `validation` the account UserID and UserName are determined so these do not need to be provided as the `validate` endpoint will determine.

If you were to provide an implict token, or a token without refresh. When the token dies the bot will no longer be able to run moderation tasks or chat commands. And if the Twitch Chat Service restarts or the bot needs to reconnect. It won't be able to go/run/reconnect.

## Helper Functions

### join

Tells the bot to join channel(s)

#### Arguments
- `rooms` - an array (or string) of rooms to join.

The function will auto add `#` and auto convert to lowercase

### send

Send messages to a chat root

#### Arguments
- `room` - the room to PRIVMSG in (will auto append `#` if ommited)
- `message` - words to send

### reply

Reply to/create a thread in a chat room

#### Arguments
- `room` - the room to PRIVMSG in (will auto append `#` if ommited)
- `id` - the ID to reply thread against
- `messaage` - the message to send

## Chat Command Helper Functions

Note that PRIVMSG based stuff above uses `#channelname` and `usernames` but all the Chat Command stuff uses `channel_id` and `user_id` instead.

See [COMMANDS.md](COMMANDS.md)

## Generating a token

Using the [Twitch CLI](https://dev.twitch.tv/docs/cli)

This _should_ cover all the scopes needed for the various functions implemented

```
twitch token -u -s 'channel:moderate chat:edit chat:read moderation:read moderator:manage:announcements moderator:manage:banned_users moderator:manage:chat_messages moderator:read:chat_settings moderator:manage:chat_settings moderator:manage:shield_mode'
```

A fuller set of scopes

```
twitch token -u -s 'channel:moderate chat:edit chat:read whispers:read whispers:edit user:manage:chat_color user:manage:whispers moderation:read moderator:manage:announcements moderator:manage:automod moderator:read:automod_settings moderator:manage:automod_settings moderator:manage:banned_users moderator:read:blocked_terms moderator:manage:blocked_terms moderator:manage:chat_messages moderator:read:chat_settings moderator:manage:chat_settings moderator:read:chatters moderator:read:shield_mode moderator:manage:shield_mode'
```

Notably we do not ask for `channel:moderate` which will be a dead scope when the Chat Commands APIs are the only way to Chat Commands.

## Sources

Utilises the Performant stuff from [osslate](https://github.com/osslate)

- [IRC "Space based" Parser](https://github.com/osslate/irc-message/blob/master/index.js)
- [IRC Prefix Parser](https://github.com/osslate/irc-prefix-parser/blob/master/index.js)

## Twitch Reference Documentation

This exmaples offers helper functions for Twitch Chat Commands as you can no longer send a chat command as a PRIVMSG

- [Chat Guide](https://dev.twitch.tv/docs/irc/guide)
- [Refresh Token](https://dev.twitch.tv/docs/authentication/refresh-tokens)
- [Validate Token](https://dev.twitch.tv/docs/authentication/validate-tokens)
- [Chat Command Migration Guide](https://dev.twitch.tv/docs/irc/chat-commands#migration-guide)

## General Notes/Usage

- All IRC commands are emitted as `EVENTNAME` and `eventname`, so you can listen on `PRIVMSG` or `privmsg`
- Any `PRIVMSG` that are cheers will also riase a `cheer` avent in addition to `PRIVMSG`
- All `USERNOTICE`s are also sent as `usernotice_tagName` so `usernotice_resub` for example

- All Tags exist as their `hypen-name` and `hypen_name` so JS objects can destructure magically
