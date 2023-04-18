## What is this Example?

This example covers a method to do Twitch Authentication inside a Desktop Application without leaking a Client Secret.

In theory you also could _not_ put your ClientID into the code, even though this is public.

This solution requires a page on your own server that acts as a valid "redirect" location, and then relays the token to the Electron Application via a custom application handler. Which are commonly referred to as Deep Links.

In this example, the redirect is set to the same place as most of the examples on this repo [GitHub Pages Landing Page](https://barrycarlyon.github.io/twitch_misc/).

Then a bit of javascript will detect the present of a token and then cause the webpage to redirect to the URI, and then the Electron App will pick it up.

This URL is hardcoded (along with the clientID) in the Electron View (index.html). But that URL could be `https://myserver/login/application/` and that then redirects to Twitch, so your Desktop App needs no ClientID or RedirectURI (stored within it), as the ClientID is extracted from the Access Token, via use of the Validation Endpoint.

## Reference Documentation

- [OAuth Implicit Code Flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#oauth-implicit-code-flow)
- [Validating Requests](https://dev.twitch.tv/docs/authentication#validating-requests)
- [Electron Deep Links](https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app)

## Running the example

This electron application uses a "single package.json" layout.

In a console/terminal, run these commands:

- `npm install`
- `npm start`

## Notes

Twitch recently changed what it supports in terms of browsers. And as such the magic Electron intercepts/not needing to open the users regular browser no longer work

https://twitter.com/TwitchSupport/status/1575571090994102272
