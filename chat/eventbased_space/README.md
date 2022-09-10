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

## Reference Documentation

- [Chat Guide](https://dev.twitch.tv/docs/irc/guide)

## General Notes/Usage

- All IRC commands are emitted as `EVENTNAME` and `eventname`, so you can listen on `PRIVMSG` or `privmsg`
- Any `PRIVMSG` that are cheers will also riase a `cheer` avent in addition to `PRIVMSG`
- All `USERNOTICE`s are also sent as `usernotice_tagName` so `usernotice_resub` for example

- All Tags exist as their `hypen-name` and `hypen_name` so JS objects can destructure magically
