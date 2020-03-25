## What is this example

This example covers a bad way to make a Twitch Chat client in nodeJS

It's basically identical to the [pubsub client](https://github.com/BarryCarlyon/twitch_misc/tree/master/pubsub) as it uses the same Connectivity logic, and both PubSub and this Chat example connect over Websockets (as apposed to the Twitch IRC ports, and IRC logic)

The Regex'es and some of the message parsing was inspired form [Modch.at](https://github.com/CBenni/mt2), (and theres only so many ways to write a IRC parser)

## Reference Documentation

- [Chat Guide](https://dev.twitch.tv/docs/irc/guide)

## Running the example

In a console/terminal, run these commands:

- `npm install`
- `node chat.js`

Send messages in `#twitch` and see what happens

## A note

It's just a simple/bad example on how to connect to Twitch Chat and maintain a Ping Pong.

It uses the oft used but undocumented justinfan connection method, so the "bot" is readonly
