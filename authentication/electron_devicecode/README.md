## What is this Example?

This example covers a method to do Twitch Authentication inside a Desktop Application via DCF aka Device Code Flow

This method is how things like the Xbox/Playstation/SmartTV apps would authenticate a service account to an app that doesn't have a web browser.

It could also be using in games or other programs that cannot easily capture a resultant oAuth token.

This example stores the resultant access and refresh token using [Electron Store](https://github.com/sindresorhus/electron-store) at start up it checks for a pre-existing access and if still valid uses it, otherwise attempts to refresh using the refresh token and continue.

## How for Device Code Flow Work

A simplified overview

### Step 1
You initiate a Device Code Flow Entry

### Step 2
This returns a URL + a code

### Step 3
Users then open that URL on another device or program sperate to the application or tool you wish to login on.

So for example, if your application is a console, you'd display a website and the code for the user to visit on their PC/computer/mobile to visit and complete the next step.
Or in the case of a game which doesn't (and shouldn't have a browser, or able to launch a method to capture a regular oAuth flow response) invoke the users default Web browser.
Often this would display a QR code to scan to do the same thing which is handy for TV/Console based apps so a user can whip out their phone and scan that QR.

The Application then starts polling, for "did the user complete auth yet"

### Step 4
Users are then at Twitch and enter the code (this may be pre-filled into the box)

### Step 5

If the user is not already logged into Twitch then they are asked to login

### Step 6

The user is then taken around a "regular" Twitch oAuth flow to accept (or decline) the requested permissions

### Step 7

If accepted then yay!

The polling that started in Step 3 will now return a token (and refresh token) instead of a "please wait" payload.

You now have a token to work with. Hooray!

## Requirements

DCF is recommended to use a "Public" Client as apposed to a "Confidential" Client Type. As such this type of Client ONLY has a ClientID, no client secret.

> Public Clients cannot maintain the confidentiality of their client credentials, eg. mobile applications, desktop applications, JavaScript applications or game engine plugins.

The above also works for anything where you can't or **shouldn't** open up a server to capture the result and/or open a browser UI "internally" to the application. (Internal browsers have their own issues with Twitch and should be avoided, hence DCF Exists)

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
