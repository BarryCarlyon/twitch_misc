## What is this example

A simple Poll Tool with _live ish_ results display.

This is an example on how to

- Obtain a Token
- Start a poll
- End a Poll
- Show Active Poll Results

## Notes

If you were running this in a "live" environment you would probaby use EventSub to draw the poll results.

See Poll Topics starting [here](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types#channelpollbegin)

If/When EventSub sockets arrive, this exmaple will move over to that for results drawing!


## TRY THIS EXAMPLE NOW!

This example is also available via GitHub Pages!

Give it a [whirl here](https://barrycarlyon.github.io/twitch_misc/examples/poll_tool/)

## Reference Documentation

- [Create Poll](https://dev.twitch.tv/docs/api/reference#create-poll)
- [End Poll](https://dev.twitch.tv/docs/api/reference#end-poll)
- [Get Polls](https://dev.twitch.tv/docs/api/reference#get-polls)

## Running the example

If you have PHP installed

> sudo php -S 127.0.0.1:80

or just throw the code up on a webpage somewhere
