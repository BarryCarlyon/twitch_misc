## What is this example

This is a very rough example of how to build a page which collects the data needed to generate [The Directory](https://www.twitch.tv/directory)

It uses Implicit auth to obtain a token, but this is just for the [GitHub pages demo](https://barrycarlyon.github.io/twitch_misc/examples/browse_categories/).

You can use any kind of token

## TRY THIS EXAMPLE NOW!

This example is also available via GitHub Pages!

Give it a [whirl here](https://barrycarlyon.github.io/twitch_misc/examples/browse_categories/)

## Reference Documentation

- [OAuth Implicit Code Flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#oauth-implicit-code-flow)

## Setting up the config

- Visit [Twitch Dev Console](https://dev.twitch.tv/console/)
- Visit Applications
- Manage your Application, or create one if you don't have one
- Copy the Client ID into the `""` of `client_id`
- You'll need to throw this webpage into a website somewhere, and update the `redirect` in the html file and on the dev console accordingly.

## Running the example

This is so rough that you need to upload it somewhere or know how to start a WebServer on 127.0.0.1 port 80 locally

If you have PHP installed

> sudo php -S 127.0.0.1:80

Will get you going real quick

## Screenshot

![Example](example.png)
