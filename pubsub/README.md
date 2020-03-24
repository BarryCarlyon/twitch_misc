## What is this example

This example covers a bad way to make a Twitch PubSub client in nodeJS

It describes a basic code loop with the ability to connect to various topics, using separate Auth's or no auth at all, not that any Topic's support no auth anymore!

## Reference Documentation

- [PubSub Guide](https://dev.twitch.tv/docs/pubsub)
- [PubSub Topics](https://dev.twitch.tv/docs/pubsub#topics)

## Running the example

In a console/terminal, run these commands:

- `npm install`
- `node pubsub.js`

It'll error as the topics are invalid!

## A note

It's just a simple/bad example on how to connect to Twitch PubSub and maintain a Ping Pong and reconnect when requested
