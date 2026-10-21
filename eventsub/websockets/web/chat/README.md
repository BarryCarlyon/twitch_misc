## What is this example

This is an exmaple of how to setup a EventSub WebSockets connection inside a Web Browser utilising the Chat Over EventSub Topics.

It will use implicit auth to obtain an access token and then connect to EventSub WebSockets

## TRY THIS EXAMPLE NOW!

This example is also available via GitHub Pages!

Give it a [whirl here](https://barrycarlyon.github.io/twitch_misc/eventsub/websockets/web/chat/)

## How Does Authentication work

### If you are using EventSub over Websockets:

For example you are making a third party chat client, or you are a game client running from the game.

Just generated user access token with the following scopes

- `user:read:chat` from the user you wish to read chat as

You then use that user access token to create subscriptions to your socket.

Thats it

### If you are using EventSub over Webhooks/Conduits:

For example you are a channel bot that handles moderation

Prior generated user access token with the following scopes or permissions:

- `user:read:chat` from the user account you wish to read chat as (usually the bot)
- `user:bot` from the user account you wish to act as a bot as
- moderator status in the channel you wish to connect to

You then ignore the user access token(s) and use an [App Access/Client Credentials](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#client-credentials-grant-flow) token to create subscriptions to your Webhook.

### If you are using EventSub over Webhooks/Conduits (more common approach):

For example you are the channel bot that just sends/reads chat, such as a game (where a control server is in use) or hydrationBot (as water bot doesn't and shouldn't be given perms)

Prior generated user access token with the following scopes or permissions:

- `user:read:chat` from the user account you wish to read chat as (usually the bot)
- `user:bot` from the user account you wish to act as a bot as
- `channel:bot` from the channel you wish to connect to

You then ignore the user access token(s) and use an [App Access/Client Credentials](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#client-credentials-grant-flow) token to create subscriptions to your Webhook.

## Reference Documentation

For what is used in this example

- [OAuth Implicit Code Flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#implicit-grant-flow)
- [EventSub](https://dev.twitch.tv/docs/eventsub)
- [EventSub WebSockets](https://dev.twitch.tv/docs/eventsub/handling-websocket-events)

## What this example doesn't do

This example doesn't handle "long periods of silence where something has gone wrong and you need to reconnect".
So make sure you honor the returned value in the welcome message of `keepalive_timeout_seconds`

## Running the example

This is so rough that you need to upload it somewhere or know how to start a WebServer on 127.0.0.1 port 80 locally

If you have PHP installed

> sudo php -S 127.0.0.1:80

Will get you going real quick

## Disconnecting the App

If you use the GitHub Live example to test, you can Disconnect the "Barry's GitHub Examples" Application on the [Connections page](https://www.twitch.tv/settings/connections)
