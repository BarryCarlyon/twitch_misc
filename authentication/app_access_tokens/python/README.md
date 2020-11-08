## What is this example

This example covers a way to create an app access token in Python, then use that token to check a streams status.
It doesn't cover how to store/reuse that token which you should do

## Reference Documentation

- [oAuth Client Credentials Flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#oauth-client-credentials-flow)
- [Validating Requests](https://dev.twitch.tv/docs/authentication#validating-requests)

## Setting up the example

- Open `generate.py` in a text editor
- Visit [Twitch Dev Console](https://dev.twitch.tv/console/)
- Visit Applications
- Manage your Application, or create one if you don't have one
- Copy the Client ID into the `''` of `client_id`
- Hit `New Secret` and then Ok
- Then copy the now Displayed Client Secret into the `''` of `client_secret`
- Add a streamer name in the `''` of `streamer_name`

## Running the example

You may need to `pip install requests` first as a dependency

In a console/terminal, run `python generate.py`
