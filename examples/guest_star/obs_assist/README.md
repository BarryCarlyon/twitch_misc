## What is this example

This is an example tool to help streamers interact Guest Start with OBS 29+

## Instruction for Use

- Connect to OBS

First it'll ask you to connect to OBS 29+ via OBS WebSocket.
So you will need to have configured the OBS WebSocket if you have not already.

- Select a Scene

Then Select a Scene to operate against

- Login with Twitch

Click on Connect with Twitch to autheticate, it'll request Read Only permission for your channels Guest Star settings.

- Add/Remove Slots

It'll see how many Slots you have configured on Guest Star, and provide Add/Remove buttons for each slot.

- Click Add or Remove

This button will then add (or remove) a browser source to the selected OBS scene.
It'll be 640x360 with "OBS Controls Volume" enabled.

You'll then want to move it in OBS as needed (or resize)

## TRY THIS EXAMPLE NOW!

This example is also available via GitHub Pages!

Give it a [whirl here](https://barrycarlyon.github.io/twitch_misc/examples/guest_star/obs_assist/)

## Reference Documentation

### Twitch

- [Implict Authentication](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#implicit-grant-flow) - to get a Twitch Token to use
- [Get Users](https://dev.twitch.tv/docs/api/reference#get-users) - we need to know who you are on Twitch
- [Get Channel Guest Star Settings](https://dev.twitch.tv/docs/api/reference/#get-channel-guest-star-settings) - to get the Slots and Layout configured

### OBS

The following Requests from [OBS Websocket Protocol](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md)

- [GetSceneList](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#getscenelist) - to get what scenes you have
- [GetInputList](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#getinputlist) - to see what inputs you have
- [CreateInput](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#createinput) - to add/create a Guest Star Slot into OBS
- [RemoveInput](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#removeinput) - to remove/delete a Guest Star Slot into OBS
