## What is this example

This is a very rough channel information example.

It uses Implicit auth to obtain a token, but this is just for the [GitHub pages demo](https://barrycarlyon.github.io/twitch_misc/examples/channel_information/).

If you are building this yourself and as a "server" application, you can use any kind of token as it's all public data. But you would need to have a way to get the users username (or ID) from the user (input field) or prompt the user to login and use a user access token, like this demo does with Implict auth.

## TRY THIS EXAMPLE NOW!

This example is also available via GitHub Pages!

Give it a [whirl here](https://barrycarlyon.github.io/twitch_misc/examples/channel_information/)

## Reference Documentation

- [Get Users](https://dev.twitch.tv/docs/api/reference#get-users)
- [Get Channel Information](https://dev.twitch.tv/docs/api/reference#get-channel-information)
- [Get Channel Teams](https://dev.twitch.tv/docs/api/reference#get-channel-teams)
- [Get Streams](https://dev.twitch.tv/docs/api/reference#get-streams)
- [Get Videos](https://dev.twitch.tv/docs/api/reference#get-videos)
- [Get User Active Extensions](https://dev.twitch.tv/docs/api/reference#get-user-active-extensions)
- [Get Channel Emotes](https://dev.twitch.tv/docs/api/reference#get-channel-emotes)
- [Get Cheermotes](https://dev.twitch.tv/docs/api/reference#get-cheermotess)
- [Get Channel Chat Badges](https://dev.twitch.tv/docs/api/reference#get-channel-chat-badges)

## But what about rate limits?

This example runs in a browser and we are using implicit auth to get a token to use.
As a result we are using frontend JS to make the API calls, and browsers will limit the number of requests made to the same domain (api.twitch.tv in this example), so we can't "hammer" enough to get close to the rate limit.

But that is something to consider if you are making these calls server side.

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
