## What is this example

This example covers a simple way to get Chatters from a chat and convert those logins to ID's in as few requests as possible.

## Reference Documentation

- [Get Chatters](https://dev.twitch.tv/docs/api/reference#get-chatters);
- [Get Users](https://dev.twitch.tv/docs/api/reference#get-users)
- [Token Validation](https://dev.twitch.tv/docs/authentication/validate-tokens)

## Running the example

In a console/terminal, run these commands:

Requires node.js v18 for inbuilt `fetch`

- `cp sample.env .env`
- Provide a token in the `.env` with the required scope of `moderator:read:chatters`, and the `user` that the token is for needs to be a moderator in the channel identified by the ID you specify in `TWITCH_STREAMER_CHANNEL`
- `npm install`
- `node chat.js`
