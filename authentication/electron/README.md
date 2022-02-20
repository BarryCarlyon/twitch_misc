## What is this Example?

This example covers a method to do Twitch Authentication inside a Desktop Application without leaking a Client Secret.

In theory you also could _not_ put your ClientID into the code, even though this is public.

This solution requires a page on your own server that acts as a valid "redirect" location. But you could, in theory let it 404 and Electron can capture that. However you want to make sure that the access token is only capurable to your Desktop app and not whatever your redirect URL is (even more so if the redirect URL isn't owned by you, to prevent token leakage).

In this example, the redirect is set to the same place as my [GitHub Implicit Auth example](https://barrycarlyon.github.io/twitch_misc/authentication/implicit_auth/), Electron just intercepts the response and extracts the Access Token to use it locally instead. And in this case runs the same fetch code to fetch and display the user in the Electron App.

This URL is hardcoded (along with the clientID) in the Electron View (index.html). But that URL could be `https://myserver/login/application/` and that then redirects to Twitch, so your Desktop App needs no ClientID or RedirectURI (stored within it), as the ClientID is extracted from the Access Token, via use of the Validation Endpoint.

## Reference Documentation

- [OAuth Implicit Code Flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#oauth-implicit-code-flow)
- [Validating Requests](https://dev.twitch.tv/docs/authentication#validating-requests)

## Running the example

This electron application uses a "dual package.json" layout. So you will need to npm install twice, once in the main folder and once in the `app` folder

In a console/terminal, run these commands:

- `cd app`
- `npm install`
- `cd ..`
- `npm install`
- `npm start`
