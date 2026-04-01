## What is this example

This is an exmaple of how to setup a EventSub WebSockets connection inside a Web Browser.

It will use implicit auth to obtain an access token and then connect to EventSub WebSockets

## TRY THIS EXAMPLE NOW!

This example is also available via GitHub Pages!

Give it a [whirl here](https://barrycarlyon.github.io/twitch_misc/eventsub/websockets/web/basic/)

## Reference Documentation

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
