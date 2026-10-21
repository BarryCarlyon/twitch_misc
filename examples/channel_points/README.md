## What is this example

A simple Channel Points tool to show rewards on the authenticating channel, create, update and delete those rewards.

It does two requests when Getting Custom reards, first to get and list _all_ rewards, then a second request to see which rewards the clientID can manage.

## Notes

The Rewards API only lets an API caller manage Rewards and Redemptions for Rewards that the Calling Client ID has created.

So if a streamer creates a reward via the dashboard, you an API consume will be able to see the reward exists and recieve redeems as they occur, but you won't be able to look up historical data, or refund a redeem for example.

## TRY THIS EXAMPLE NOW!

This example is also available via GitHub Pages!

Give it a [whirl here](https://barrycarlyon.github.io/twitch_misc/examples/channel_points/)

## Reference Documentation

- [Get Custom Rewards](https://dev.twitch.tv/docs/api/reference#get-custom-reward)
- [Create Custom Rewards](https://dev.twitch.tv/docs/api/reference#create-custom-rewards)
- [Delete Custom Rewards](https://dev.twitch.tv/docs/api/reference#delete-custom-reward)

## Running the example

If you have PHP installed

> sudo php -S 127.0.0.1:80

or just throw the code up on a webpage somewhere
