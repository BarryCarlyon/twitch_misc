## What is this example

A Token Generator of sorts. To demonstrate how to perform Scoped User oAuth authentication in PHP

Also included is `maintain_user_token.php` a script to demonestrate how to maintain and refresh if needed a user token.

## Reference Documentation

- [OAuth Authorization Code Flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#oauth-authorization-code-flow)
- [Validating Requests](https://dev.twitch.tv/docs/authentication#validating-requests)
- [Revoking Access Tokens](https://dev.twitch.tv/docs/authentication#revoking-access-tokens)
- [Available API Scopes](https://dev.twitch.tv/docs/authentication#scopes)

## Setting up the config

- Open `config_sample.php` in a text editor
- Visit [Twitch Dev Console](https://dev.twitch.tv/console/)
- Visit Applications
- Manage your Application, or create one if you don't have one
- Copy the Client ID into the `""` of `client_id`
- Hit New Secret then Ok
- Copy the new Client Secret into the `""` of `client_secret`
- Add or change the `OAuth Redirect URLs` to include one for `http://localhost:8000/` as Twitch now support multiples
- Save your modified file as `config.php`

You can change the port in config if you want but remember to change it in the Redirect URL's as well, and update the configs `redirect_uri`

## Running the example

In a console/terminal, run these commands:

- `php -S 127.0.0.1:8000`
- Open [http://localhost:8000](http://localhost:8000) in a browser

To run the `maintain_user_token.php` example, first you need a token in an `auth.json` file.
You can make one in this example by uncommenting line [index.php#63] and running the 8080 server.
Then just `php maintain_user_token.php` after you have a token in `auth.json`

## Notes

The `logout` function makes use of the [Token Revoke](https://dev.twitch.tv/docs/authentication#revoking-access-tokens) end point to kill a server stored token. Normally you probably wouldn't call this as you would store the Token and it's Refresh token in a database to maintain "offline access" to the users account, say for keeping a Subscriber list up to date, or for use in other things like [Twitch PubSub](https://dev.twitch.tv/docs/pubsub)

The `validate` endpoint returns some important information, such as when the token expires, you'll need to refresh the token as needed if the token expires using the refresh token, thats not covered in this example, but you can read about [refreshing on the docs](https://dev.twitch.tv/docs/authentication#refreshing-access-tokens)

Also note the `validate` endpoint uses `OAuth` instead of `Bearer` in the `Authorization` header.

An oAuth example such as this, will work for most services that provide oAuth, you just have to swap out the three oAuth URLs (and how to validate a token/fetch a user from the service), for the relevant URL's for that service

- https://id.twitch.tv/oauth2/authorize - where to send a User to to authorize yoru applications access to the users account
- https://id.twitch.tv/oauth2/token - where you POST/exchange the CODE to to get an Access Token
- https://id.twitch.tv/oauth2/revoke - where to POST to, to logout/kill a token

And

- https://id.twitch.tv/oauth2/validate - where to validate a token, if the service supports it
