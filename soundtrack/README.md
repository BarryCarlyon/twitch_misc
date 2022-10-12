## What is this example

This is an example of using the API to get the Authenticated Users Soundtrack Current Track.

To test it, login to the Example on GH Pages and then open [SoundTrack Web](https://soundtrack.twitch.tv/) and play a song!

It uses Implicit auth to obtain a token, but this is just for the [GitHub pages demo](https://barrycarlyon.github.io/twitch_misc/examples/soundtrack/).

If you are building this yourself and as a "server" application, you can use any kind of token as it's all public data.

## TRY THIS EXAMPLE NOW!

This example is also available via GitHub Pages!

Give it a [whirl here](https://barrycarlyon.github.io/twitch_misc/examples/soundtrack/)

## Reference Documentation

- [Get Users (for user Lookup)](https://dev.twitch.tv/docs/api/reference#get-users)
- [Get Soundtrack Current Track](https://dev.twitch.tv/docs/api/reference#get-soundtrack-current-track)

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
