## What is this example

This is a very rough example of using implicit auth to auth.
It provides two authentication links, one that'll just get public data, and a second that'll return public + the users email.

## TRY THIS EXAMPLE NOW!

This example is also available via GitHub Pages!

Give it a [whirl here](https://barrycarlyon.github.io/twitch_misc/authentication/implicit_auth/)

## Reference Documentation

- [OAuth Implicit Code Flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#oauth-implicit-code-flow)

## Setting up the config

- Visit [Twitch Dev Console](https://dev.twitch.tv/console/)
- Visit Applications
- Manage your Application, or create one if you don't have one
- Copy the Client ID into `client_id` JavaScript Variable
- You'll need to throw this webpage into a website somewhere, and update the `redirect` in the html file and on the dev console accordingly.

## Running the example

This is so rough that you need to upload it somewhere or know how to start a WebServer on 127.0.0.1 port 80 locally

If you have PHP installed

> sudo php -S 127.0.0.1:80

Will get you going real quick

## Disconnecting the App

If you use the GitHub Live example to test, you can Disconnect the "Barry's GitHub Examples" Application on the [Connections page](https://www.twitch.tv/settings/connections)
