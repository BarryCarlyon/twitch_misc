## What is this example

This is a tool for looking at a Channels Art. Such as Emotes and Badges.

It uses Implicit auth to obtain a token, generally for a Server Side Solution you'd use an App Access/Client Credentials Token

## TRY THIS EXAMPLE NOW!

This example is also available via GitHub Pages!

Give it a [whirl here](https://barrycarlyon.github.io/twitch_misc/examples/twitchemotes/)

## Reference Documentation


- [Get Users](https://dev.twitch.tv/docs/api/reference#get-users) - We need the User ID to call other endpoints
- [Get Channel Chat Badges](https://dev.twitch.tv/docs/api/reference/#get-channel-chat-badges)
- [Get Channel Emotes](https://dev.twitch.tv/docs/api/reference/#get-channel-emotes)

## But what about rate limits?

This example runs in a browser and we are using implicit auth to get a token to use.
As a result we are using frontend JS to make the API calls, and browsers will limit the number of requests made to the same domain (api.twitch.tv in this example), so we can't "hammer" enough to get close to the rate limit.

But that is something to consider if you are making these calls server side to many users.

## Setting up the config

- Visit [Twitch Dev Console](https://dev.twitch.tv/console/)
- Visit Applications
- Manage your Application, or create one if you don't have one
- Copy the Client ID into `client_id` JavaScript Variable
- You'll need to throw this webpage into a website somewhere, and update the `redirect` in the html file and on the dev console accordingly.

## Running the example

If you have PHP installed

> sudo php -S 127.0.0.1:80

or just throw the code up on a webpage somewhere
