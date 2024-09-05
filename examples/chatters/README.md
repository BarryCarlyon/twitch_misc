## What is this example

A simple example to Demo the Chatters Endpoint

It uses Implicit auth to obtain a token, but this is just for the [GitHub pages demo](https://barrycarlyon.github.io/twitch_misc/examples/chatters/).

## TRY THIS EXAMPLE NOW!

This example is also available via GitHub Pages!

Give it a [whirl here](https://barrycarlyon.github.io/twitch_misc/examples/chatters/)

## Reference Documentation

- [Get Chatters](https://dev.twitch.tv/docs/api/reference/#get-chatters)

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
