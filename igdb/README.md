## What is this example

This is an example demonstrates how to utilise the [IGDB.com](http://igdb.com/) [API](https://api-docs.igdb.com/) without needing an external proxy.

IGDB.com's API requries the usage of an [App Access/Client Credentials Twitch API Token](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#client-credentials-grant-flow), as such you can't use it in the front end without leaking said token or leaking your client secret.

And the IGDB.com has employed CORS headers to prevent this misuse of a token.

So you need a proxy/relay to get the data to your front end.

So, this example is a PHP one pager to demostrate the workflow, it does HTTP POST request to itself, and then fetches and returns the data from IGDB.com's API.

## Notes

### Token

This example will generate a brand new token _each_ time you call the POST endpoint.

In production you would generate, retain and utilise a single token until it's close to expiration, to avoid giving an opinion on how to store a token, this example doesn't.

### Game Lookup

We call the Games endpoint but with a `search` filter instead.
We also use an expanded to collect additional data

## Reference Documentation

- [Generate Client Credentials](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#client-credentials-grant-flow)
- [Validate Client Credentials](https://dev.twitch.tv/docs/authentication/validate-tokens/)
- [IGDB.com API Games API](https://api-docs.igdb.com/#game) 
- [IGDB.com API Image Template URL's](https://api-docs.igdb.com/#images)
- [IGDB.com API Expander](https://api-docs.igdb.com/#expander)