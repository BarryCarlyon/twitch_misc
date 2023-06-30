## What is this example

This is an example for just poking the [Calendar/Schedule](https://dev.twitch.tv/docs/api/reference#get-channel-stream-schedule) part of the Twitch API

It uses Implicit auth to obtain a token, but this is just for the [GitHub pages demo](https://barrycarlyon.github.io/twitch_misc/examples/calendar/).

If you are building this yourself and as a "server" application, you can use any kind of token as it's all public data.

Normally for a server solution (you first wouldn't be doing it client side or with fetch), you'd normally use a [Client Credentaisl/App Access/Server to Server token](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#oauth-client-credentials-flow)

This example generates a QR code to the iCalendar URL, the Javascript library [davidshimjs/qrcodejs](https://github.com/davidshimjs/qrcodejs) is used for this.

## TRY THIS EXAMPLE NOW!

This example is also available via GitHub Pages!

Give it a [whirl here](https://barrycarlyon.github.io/twitch_misc/examples/calendar/)

## Reference Documentation

- [OAuth Implicit Code Flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#oauth-implicit-code-flow)
- [Get Channel Stream Schedule](https://dev.twitch.tv/docs/api/reference#get-channel-stream-schedule)
- [Get Channel iCalendar](https://dev.twitch.tv/docs/api/reference#get-channel-icalendar)
- [Get Users](https://dev.twitch.tv/docs/api/reference#get-users) - For Converting `logins` to `user_ids`

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

## Screenshot

![Example](example.png)
