## What is this example

An example project to manage unban requests on any channel the logged in user is a moderator on

This is an example on how to

- Obtain a token
- Use that token to get the channels that logged in user is a moderator for
- Upon selecting a channel, get the unban requests for that channel
- Update/Resolve the unban requests

Resoling an unban request to "unban the user" will mark the request as accepted and unban the user, so you do not need to make a second API request to unban the user.

## TRY THIS EXAMPLE NOW!

This example is also available via GitHub Pages!

Give it a [whirl here](https://barrycarlyon.github.io/twitch_misc/examples/ban_request_manager/)

## Reference Documentation

- [Get Moderated Channels](https://dev.twitch.tv/docs/api/reference/#get-moderated-channels)
- [Get Unban Requests](https://dev.twitch.tv/docs/api/reference/#get-unban-requests)
- [Resolve Unban Request](https://dev.twitch.tv/docs/api/reference/#resolve-unban-requests)

## Running the example

If you have PHP installed

> sudo php -S 127.0.0.1:80

or just throw the code up on a webpage somewhere
