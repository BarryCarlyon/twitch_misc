# Whats in this Repo

This repo contains a bunch of examples and bits and pieces that might be useful it might not.

[![CodeQL](https://github.com/BarryCarlyon/twitch_misc/actions/workflows/codeql.yml/badge.svg)](https://github.com/BarryCarlyon/twitch_misc/actions/workflows/codeql.yml)
[![Deploy statics](https://github.com/BarryCarlyon/twitch_misc/actions/workflows/publish-pages.yml/badge.svg)](https://github.com/BarryCarlyon/twitch_misc/actions/workflows/publish-pages.yml)
[![pages-build-deployment](https://github.com/BarryCarlyon/twitch_misc/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/BarryCarlyon/twitch_misc/actions/workflows/pages/pages-build-deployment)

## Languages

Most of these examples either use NodeJS or PHP or pure HTML (with Javascript) (using a dumb `php -S` to serve the demo, as apposed to file:// to avoid some oddities)

Aside from that the dependencies are supposed to be as lightweight as possible.

## LIVE EXAMPLES

These examples are testable on GitHub pages, and will prompt for implicit authentication to run the code.

<table>
    <thead><tr><th colspan="3">Auth Type Things</th></tr></thead>
    <tbody>
        <tr><td><a href="https://barrycarlyon.github.io/twitch_misc/authentication/implicit_auth/">How to Implicit auth</a></td><td><a href="https://github.com/BarryCarlyon/twitch_misc/tree/main/authentication/implicit_auth/">Source</a></td><td>For Client Side apps/websites</td></tr>
        <tr><td><a href="https://barrycarlyon.github.io/twitch_misc/examples/token_checker/">Token Checker and Killer</a></td><td><a href="https://github.com/BarryCarlyon/twitch_misc/tree/main/examples/token_checker">Source</a></td><td>Validate Tokens and revoke them, handy if you find stuff in the wild that shouldn't be there!</tr>
    </tbody>
    <thead><tr><th colspan="3">Examply Things</th></tr></thead>
    <tbody>
        <tr><td><a href="https://barrycarlyon.github.io/twitch_misc/examples/browse_categories/">Building a clone of the Directory view</a></td><td><a href="https://github.com/BarryCarlyon/twitch_misc/tree/main/examples/browse_categories">Source</a></td><td>Pretty simple, shows how to "chain" API's together</tr>
        <tr><td><a href="https://barrycarlyon.github.io/twitch_misc/examples/calendar_basic/">Some Basic Calendar/Schedule Stuff</a></td><td><a href="https://github.com/BarryCarlyon/twitch_misc/tree/main/examples/calendar_basic">Source</a></td><td></td></tr>
        <tr><td><a href="https://barrycarlyon.github.io/twitch_misc/examples/channel_information/">Channel Information Widget</a></td><td><a href="https://github.com/BarryCarlyon/twitch_misc/tree/main/examples/channel_information">Source</a></td><td></td></tr>
        <tr><td><a href="https://barrycarlyon.github.io/twitch_misc/examples/team/">Team Page</a></td><td><a href="https://github.com/BarryCarlyon/twitch_misc/tree/main/examples/team">Source</a></td><td>A clone of the team page, rougly, for showing how/where to get various data from</td></tr>
    </tbody>
    <thead><tr><th colspan="3">Player Things</th></tr></thead>
    <tbody>
        <tr><td><a href="https://barrycarlyon.github.io/twitch_misc/examples/vod_player/">A VOD Player that Skips Muted Segments</a></td><td><a href="https://github.com/BarryCarlyon/twitch_misc/tree/main/examples/vod_player">Source</a></td><td>Enough Said it plays VOD's</td></tr>
        <tr><td><a href="https://barrycarlyon.github.io/twitch_misc/player/html/">Twitch Player/parent</a></td><td><a href="https://github.com/BarryCarlyon/twitch_misc/tree/main/player/html">Source</a></td><td>Implements most of the Embed JS player functions for test/example purposes</td></tr>
        <tr><td><a href="https://sites.google.com/view/barry-twitch-embed-test/home">Twitch Player on Google Sites</a></td><td><a href="https://github.com/BarryCarlyon/twitch_misc/tree/main/player/googlesites">Source</a></td><td>A demo of how to do Players on Google Sites as they have nested iFrames and a dynamic URL on one of them...</a></td></tr>
    </tbody>
    <thead><tr><th colspan="3">Streamer Tool Type Things</th></tr></thead>
    <tbody>
        <tr><td><a href="https://barrycarlyon.github.io/twitch_misc/examples/channel_dashboard/">Near Clone of the Dashboard</a></td><td><a href="https://github.com/BarryCarlyon/twitch_misc/tree/main/examples/channel_dashboard">Source</a></td><td>The <a href="https://dashboard.twitch.tv/stream-manager">Dashboard</a> core parts (edit stream info) but via the API</td></tr>
        <tr><td><a href="https://barrycarlyon.github.io/twitch_misc/examples/blocked_terms/">Blocked Terms</a></td><td><a href="https://github.com/BarryCarlyon/twitch_misc/tree/main/examples/blocked_terms/">Source</a></td><td>Manage terms on any channel you are a moderator for and/or import/export as CSV</td></tr>
        <tr><td><a href="https://barrycarlyon.github.io/twitch_misc/examples/poll_tool/">Simple Poll Tool/Results Display</a></td><td><a href="https://github.com/BarryCarlyon/twitch_misc/tree/main/examples/poll_tool">Source</a></td><td>A simple tool to create a poll and monitor the results</td></tr>
        <tr><td><a href="https://barrycarlyon.github.io/twitch_misc/examples/channel_points/">Simple Channel Points Manager</a></td><td><a href="https://github.com/BarryCarlyon/twitch_misc/tree/main/examples/channel_points">Source</a></td><td>A simple tool to manage rewards</td></tr>
        <tr><td><a href="https://barrycarlyon.github.io/twitch_misc/examples/ban_request_manager/">Simple UnBan Requests Manager</a></td><td><a href="https://github.com/BarryCarlyon/twitch_misc/tree/main/examples/ban_request_manager">Source</a></td><td>A simple tool to manage unban requests</td></tr>
        <tr><td><a href="https://barrycarlyon.github.io/twitch_misc/examples/stream_key/">Get my Stream Key</a></td><td><a href="https://github.com/BarryCarlyon/twitch_misc/tree/main/examples/stream_key">Source</a></td><td>A simple demo to auth the user and show the user their own stream key.</td></tr>
        <tr><td><a href="https://barrycarlyon.github.io/twitch_misc/examples/clips_navigator/">Clips Navigator w/ Download</a></td><td><a href="https://github.com/BarryCarlyon/twitch_misc/tree/main/examples/clips_navigator">Source</a></td><td>A simple demo fetch and display clips using started_at and ended_at parameters w/ download</td></tr>
        <tr><td><a href="https://barrycarlyon.github.io/twitch_misc/examples/twitchemotes/">TwitchEmotes</a></td><td><a href="https://github.com/BarryCarlyon/twitch_misc/tree/main/examples/twitchemotes/">Source</a></td><td></td></tr>
        <tr><td><a href="https://barrycarlyon.github.io/twitch_misc/examples/calendar/">Showing Calendar Externally</a></td><td><a href="https://github.com/BarryCarlyon/twitch_misc/tree/main/examples/calendar/">Source</a></td><td></td></tr>
    </tbody>
    <thead><tr><th colspan="3">Guest Star</th></tr></thead>
    <tbody>
        <tr><td><a href="https://barrycarlyon.github.io/twitch_misc/examples/guest_star/controller/">Guest Star Controller</a></td><td><a href="https://github.com/BarryCarlyon/twitch_misc/tree/main/examples/guest_star/controller/">Source</a></td><td>WIP implementation of the Guest Star API/EventSub. Uses EventSub Websockets for real time updates.</td></tr>
        <tr><td><a href="https://barrycarlyon.github.io/twitch_misc/examples/guest_star/obs_assist/">Guest Star OBS Setup Assistant</a></td><td><a href="https://github.com/BarryCarlyon/twitch_misc/tree/main/examples/guest_star/obs_assist/">Source</a></td><td></td></tr>
    </tbody>
    <thead><tr><th colspan="3">EventSub WebSocket Transport Things</th></tr></thead>
    <tbody>
        <tr><td><a href="https://barrycarlyon.github.io/twitch_misc/eventsub/websockets/web/basic/">The Basics</a></td><td><a href="https://github.com/BarryCarlyon/twitch_misc/tree/main/eventsub/websockets/web/basic">Source</a></td><td>A basic EventSub WebSocket connector</td></tr>
        <tr><td><a href="https://barrycarlyon.github.io/twitch_misc/eventsub/websockets/web/chat/">The Chat Topics</a></td><td><a href="https://github.com/BarryCarlyon/twitch_misc/tree/main/eventsub/websockets/web/chat">Source</a></td><td>Testing the new Chat Topics</td></tr>
        <tr><td colspan="3">Notes about how Authentication works for Chat over EventSub <a href="https://github.com/BarryCarlyon/twitch_misc/tree/main/eventsub/websockets/web/chat#how-does-authentication-work">Found Here</a></td></tr>
        <tr><td><a href="https://barrycarlyon.github.io/twitch_misc/eventsub/websockets/web/activity_feed/">An Activity Feed</a></td><td><a href="https://github.com/BarryCarlyon/twitch_misc/tree/main/eventsub/websockets/web/activity_feed">Source</a></td><td>Processing chat.notif and chat.message to build an activity feed</td></tr>
        <tr><td><a href="https://barrycarlyon.github.io/twitch_misc/eventsub/websockets/web/creatorgoals/">Creator Goals EventSub WebSocket</a></td><td><a href="https://github.com/BarryCarlyon/twitch_misc/tree/main/eventsub/websockets/web/creatorgoals/">Source</a></td><td>A EventSub WebSocket CreatorGoals Example</td></tr>
        <tr><td><a href="https://barrycarlyon.github.io/twitch_misc/eventsub/websockets/web/charity/">Charity EventSub WebSocket</a></td><td><a href="https://github.com/BarryCarlyon/twitch_misc/tree/main/eventsub/websockets/web/charity/">Source</a></td><td>A EventSub WebSocket Charity Example</td></tr>
        <tr><td><a href="https://barrycarlyon.github.io/twitch_misc/examples/poll_tool/">Simple Poll Tool/Results Display</a></td><td><a href="https://github.com/BarryCarlyon/twitch_misc/tree/main/examples/poll_tool">Source</a></td><td>A simple tool to create a poll and monitor the results via EventSub WebSocket.</td></tr>
    </tbody>
    <thead><tr><th colspan="3">Extension Type Things</th></tr></thead>
    <tbody>
        <tr><td><a href="https://barrycarlyon.github.io/twitch_misc/examples/extension_config/">Extensions Config Tool</a></td><td><a href="https://github.com/BarryCarlyon/twitch_misc/tree/main/examples/extension_config">Source</a></td><td>A replacement for the Rig's tool - <a href="https://github.com/barrycarlyon/twitch_extension_tools">desktop version</a></td></tr>
    </tbody>
</table>

## Twitch Extensions

There are some useful bits for Twitch Extensions in this repo, mainly for the [API side of things](https://github.com/BarryCarlyon/twitch_misc/tree/main/extensions).

If you are after a demo of a Twitch Extension with an EBS that talks to the Twitch API, checkout the [Twitch Profile Extension](https://github.com/BarryCarlyon/twitch_profile_extension) Repository instead

Looking to get started wtih JWT auth, but you just want to start making requests. Try this [insomnia](https://insomnia.rest) plugin: ["twitch extension"](https://github.com/BarryCarlyon/insomnia-plugin-twitch-extension-barrycarlyon) which includes a "predefined" request collection to import too!

Or looking to get started with Extension Development and the various API calls outside of a Rest client in a Desktop Application Similar to the Developer Rig? Check out [BarryCarlyon's Twitch Extension Tools](https://github.com/barrycarlyon/twitch_extension_tools).

## Practical Examples

Most of the code in this repository is various bits and pieces for your to copy/paste in other projects.

However the [examples](examples) folder will contain self contained examples that demonstrate a more full "product".

## Further Help

Some options

- [TwitchDev Documentation](http://dev.twitch.tv/docs)
- [TwitchDev Support Forums](https://discuss.dev.twitch.tv/)
- [TwitchDev Discord](https://link.twitch.tv/devchat)
- [TwitchDev Other Help](https://dev.twitch.tv/support)

[![TwitchDev Discord](https://discordapp.com/api/guilds/504015559252377601/embed.png?style=banner2)](https://link.twitch.tv/devchat)

## OMGLIEKWUT OHMYGOODNESS U SO MUCH HELP

Thank you for the help I want to give you beer/coffee money -> Check the Funding/Sponsor details
