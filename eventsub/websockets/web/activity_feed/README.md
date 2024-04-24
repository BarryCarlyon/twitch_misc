## What is this example

This is an exmaple of how to setup a EventSub WebSockets connection inside a Web Browser utilising the Chat Over EventSub Topics to build an activity feed of sorts

It will use implicit auth to obtain an access token and then connect to EventSub WebSockets

## TRY THIS EXAMPLE NOW!

This example is also available via GitHub Pages!

Give it a [whirl here](https://barrycarlyon.github.io/twitch_misc/eventsub/websockets/web/activity_feed/)

## Reference Documentation

For what is used in this example

- [OAuth Implicit Code Flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#implicit-grant-flow)
- [EventSub](https://dev.twitch.tv/docs/eventsub)
- [EventSub WebSockets](https://dev.twitch.tv/docs/eventsub/handling-websocket-events)

## Notes

This example gives an opinion on how to prcocess and collect the relevant events that would be untilised to run an overlay or a notification program for example.

Specifically how to collect sub bombs (aka Community Gifts) into their groupings.

Note the use of trim in the processName function, some users can have a space in their display name (at the end)
Or in the middle such as `Riot Games` but you are not likely to see middle space names in the data.

## Running the example

This is so rough that you need to upload it somewhere or know how to start a WebServer on 127.0.0.1 port 80 locally

If you have PHP installed

> sudo php -S 127.0.0.1:80

Will get you going real quick

## Disconnecting the App

If you use the GitHub Live example to test, you can Disconnect the "Barry's GitHub Examples" Application on the [Connections page](https://www.twitch.tv/settings/connections)
