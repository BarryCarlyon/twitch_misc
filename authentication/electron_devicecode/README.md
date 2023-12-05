## What is this Example?

This example covers a method to do Twitch Authentication inside a Desktop Application via DCF aka Device Code Flow

This method is how things like the Xbox/Playstation/SmartTV apps would authenticate a service account to an app that doesn't have a web browser.

It could also be using in games or other programs that cannot easily capture a resultant oAuth token.

This example stores the resultant access and refresh token using [Electron Store](https://github.com/sindresorhus/electron-store) at start up it checks for a pre-existing access and if still valid uses it, otherwise attempts to refresh using the refresh token and continue.

## Requirements

DCF requires a "Public" Client as apposed to a "Confidential" Client Type. And as such this type of Client ONLY has a ClientID, no client secret.

> Public Clients cannot maintain the confidentiality of their client credentials, eg. mobile applications, desktop applications, JavaScript applications or game engine plugins.

The above also works for anything where you can't or **shouldn't** open up a server to capture the result and/or open a browser UI "internally" to the application.

## Reference Documentation

- [Device code grant flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#device-code-grant-flow)
- [Public Client Type](https://datatracker.ietf.org/doc/html/rfc6749#section-2.1)
- [JS QR Code Generator](https://github.com/davidshimjs/qrcodejs)

## Running the example

Update the first line of `main.js` with your ClientID.
Update the second line of `main.js` with scopes

This electron application uses a "single package.json" layout.

In a console/terminal, run these commands:

- `cd program`
- `npm install`
- `npm start`
