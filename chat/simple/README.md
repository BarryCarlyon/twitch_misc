## What is this example

This example covers a way to make a Twitch Chat client in nodeJS

It's basically identical to the [pubsub client](https://github.com/BarryCarlyon/twitch_misc/tree/master/pubsub) as it uses the same Connectivity logic, and both PubSub and this Chat example connect over Websockets (as apposed to the Twitch IRC ports, and IRC logic)

The Regex'es and some of the message parsing was inspired form [Modch.at](https://github.com/CBenni/mt2), (and theres only so many ways to write a IRC parser)

This example will connect to the channel Twitch, and will be in the "readonly"/justinfan/anon user configuration. As if you were on the Twitch.tv/twitch channel and you were logged on in the browser.

## Reference Documentation

- [Chat Guide](https://dev.twitch.tv/docs/irc/guide)

## Notes

If you were to use this script and use a "real" user with the right scopes.
In order to send a chat message you would do something like

    socket.send('PRIVMSG #targetchnanel :Your message here');
    
Which matches the IRC Protocol formatting for sending a message to a channel.

## Running the example

In a console/terminal, run these commands:

- `npm install`
- `node chat.js`

Send messages in `#barrycarlyon` and see what happens

## A note

It's just a simple/bad example on how to connect to Twitch Chat and maintain a Ping Pong.

It uses the oft used but undocumented justinfan connection method, so the "bot" is readonly

## Another Notes

Technically the Host Parsing regex, is suspecitable to [ReDoS](https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS) but there is a level of trust attached to the input text to a script connected to Twitch Chat.

So if a given `host` in a Twitch Chat message can trigger a ReDoS there are bigger issues afoot than killing some chat bots connected to chat.
