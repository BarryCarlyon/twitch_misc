## What is this example

This example is similar to the [user_access_generator](https://github.com/BarryCarlyon/twitch_misc/tree/master/authentication/user_access_generator) but covers a single scope and how to verify it. Specifically the [OIDC](https://dev.twitch.tv/docs/authentication/getting-tokens-oidc)

It works both "Authorization Code Flow" and "Implicit Code Flow", but this only covers "Authorization Code Flow"

This uses JWT's so you should read up about what a JWT is on [JWT.io](https://jwt.io/)

## Reference Documentation

- [Getting Tokens: OIDC](https://dev.twitch.tv/docs/authentication/getting-tokens-oidc)
- [JWTs](https://jwt.io/)

## Setting up the config

- Open `config_sample.json` in a text editor
- Visit [Twitch Dev Console](https://dev.twitch.tv/console/)
- Visit Applications
- Manage your Application, or create one if you don't have one
- Copy the Client ID into the `""` of `client_id`
- Hit New Secret then Ok
- Copy the new Client Secret into the `""` of `client_secret`
- Add or change the `OAuth Redirect URLs` to include one for `http://localhost:8000/` as Twitch now support multiples
- Save your modified file as `config.json`

You can change the port in config if you want but remember to change it in the Redirect URL's as well, and update the configs `redirect_uri`

## Running the example

In a console/terminal, run these commands:

- `npm install`
- `node server.js`
- Open [http://localhost:8000](http://localhost:8000) in a browser

## Notes

JWTs have a really short valid time, around 15 minutes, and also cannot be refreshed!

A Twitch OpenID call, can be combined with other "regular" scopes, and will return a "regular" API access token for use. Uncomment [server.js Line 193](server.js#L193) to see what you get!

The `validate` endpoint returns some important information, such as when the token expires, you'll need to refresh the token as needed if the token expires using the refresh token, thats not covered in this example, but you can read about [refreshing on the docs](https://dev.twitch.tv/docs/authentication#refreshing-access-tokens)

Also note the `validate` endpoint uses `OAuth` instead of `Bearer` in the `Authorization` header.
