## What is this example

This is a very rough example of how to build a page to fetch a user Stream Key/display the stream key to the user logging in.

It uses Implicit auth to obtain a token, but this is just for the [GitHub pages demo](https://barrycarlyon.github.io/twitch_misc/examples/stream_key/).

If you are building this yourself and as a "server" application, you'd normally use a [Authorization code grant flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#authorization-code-grant-flow). To allow you to refetch the StreamKey ad infinitum.

## TRY THIS EXAMPLE NOW!

This example is also available via GitHub Pages!

Give it a [whirl here](https://barrycarlyon.github.io/twitch_misc/examples/stream_key/)

## Reference Documentation

- [OAuth Implicit Code Flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#oauth-implicit-code-flow)
- [Get Streams Key](https://dev.twitch.tv/docs/api/reference#get-stream-key)

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