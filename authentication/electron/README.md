## What is this Example?

This example covers a method to do Twitch Authentication inside a Desktop Application without leaking a Client Secret.

In theory you also could _not_ put your ClientID into the code, even though this is public.

This solution requires a page on your own server that acts as a valid "redirect" location, and then relays the token to the Electron Application via a custom application handler. Which are commonly referred to as Deep Links.

An example [capture page](webpage) is provided, it uses a bit of javascript will detect the present of a token and then cause the webpage to redirect to the Deep Link URI, and then the Electron App will pick it up, determine the ClientID and away it goes!

## Device Code Flow

Since Twitch has now made available [Device Code Flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#device-code-grant-flow) this approach is redundant as the DCF flow is much preferred.

For a DCF example pop over to [here](../electron_devicecode/) instead!

## Methods

There are two methods you can use here.

- Launch the users default web browser to your capture page and redirect to Twitch.
- Launch the users default web browser directly to Twitch.

The second method will need your ClientID to be stored in the Application, where as the first needs your capture page instead.

Both methods will need the [capture page](webpage) stored in your program in order to relay the token from the web browser to your application regardless.

You can use the Validate endpoint to get the ClientID that a token uses, so why have two config parameters when you only need one!

## Deep link

This example uses `twitch-misc-example` as the Deep Link "protocol".

If you intend to use this example make sure to refer to the [Packaging Instructions](https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app#packaging) to ensure your Application correctly defines the Deep Link, and this will vary depending on what packaging method you use.

## Reference Documentation

- [OAuth Implicit Code Flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#oauth-implicit-code-flow)
- [Validating Requests](https://dev.twitch.tv/docs/authentication/validate-tokens/)
- [Electron Deep Links](https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app)

## Running the example

This electron application uses a "single package.json" layout.

In a console/terminal, run these commands:

- `cd program`
- `npm install`
- `npm start`

## Notes

Twitch recently changed what it supports in terms of browsers. And as such the magic Electron intercepts/not needing to open the users regular browser no longer work.

https://twitter.com/TwitchSupport/status/1575571090994102272
