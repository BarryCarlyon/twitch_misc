# Twitch Conduits

Work in Progress free form notes

# Documentation

- [Get Conduits](https://dev.twitch.tv/docs/api/reference/#get-conduits)
- [Create Conduits](https://dev.twitch.tv/docs/api/reference/#create-conduits)
- [Update Conduits](https://dev.twitch.tv/docs/api/reference/#update-conduits)
- [Delete Conduits](https://dev.twitch.tv/docs/api/reference/#delete-conduit)
- [Get Conduit Shards](https://dev.twitch.tv/docs/api/reference/#get-conduit-shards)
- [Update Conduit Shards](https://dev.twitch.tv/docs/api/reference/#update-conduit-shards)

- [Create EventSub Subscription](https://dev.twitch.tv/docs/api/reference/#create-eventsub-subscription)
- [Delete EventSub Subscription](https://dev.twitch.tv/docs/api/reference/#delete-eventsub-subscription)
- [Get EventSub Subscriptions](https://dev.twitch.tv/docs/api/reference/#get-eventsub-subscriptions)

# Tools

[Barry's Twitch Conduit Tools](https://github.com/barrycarlyon/twitch_conduit_tools) can help you visualise your Conduits and Shards

# Whats here

It's all Websocket examples:

## `auto_shard.js`

- Creates a WebSocket
- If set to auto will create a Conduit if one doesn't exist OR will use the ONLY conduit that exists
- It assigns itself to the `SHARD_ID` assinged from env, which generally is gonna be shard 0 as if it auto creates it only makes a conduit of 1 shard.

It assumes another process handles subscription creation.

It's not _that_ practical but theres use cases for this. As after connect and the conduit/single shard is ready then the same process can create (or check) that all needed subscriptions are created and assigned to the conduit.

Or you just need to spawn a socket against the ONLY created conduit you have.

## `shard.js`

This one is more practical/expected use cases.

You define the `TWITCH_CONDUIT_ID` and `TWITCH_SHARD_ID` then it creates a WebSocket and assigns itself to the defined Shards.

You might do a auto scale up version, where it iterates the shards on the conduit to find a disconnected/available slot and self assigns itself.
And if it doesn't find a shard self creates a shard and self assigns.

But if you have multiple disconnected shards you have missed events as Twitch only retries on the message on another shard once, so if the second shard is also dead, RIP the entire message

## `simple_shard.js`

This one has most of the logic moved into `eventsub.js` so it just invokves the class and away it goes.

Feed in a token, a conduit ID and a shard ID from `.env` and it connects, self updates the shard of the specified index on the conduit, and does stuff with incoming `notification`s.

# Flow Notes

## A practical flow

For a NEW setup

1. Create a conduit, with Y shards
2. Create Y websocket processes each assigned the `CONDUIT_ID` and a `SHARD_ID` to go on, on `welcome` they do the PATCH call themself for their `SHARD_ID`
3. Create Subscriptions to your Conduit

This should ensure you are ready to recieve messages, before messages occur, but sure you could create conduit of 1 shard, connect 1 shard and then create subscriptions on the Conduit and from there scale up if you get a lot of traffic.

## Practical Flow example

Another process handles token gernation and conduit create and subscription assign

1. Externally create a conduit
2. Assign subscriptions to that conduit
3. `TWITCH_ACCESS_TOKEN="TOKEN" TWITCH_CONDUIT_ID="conduit-id" TWITCH_SHARD_ID="0" node shard_simple.js`

It would logically follow that 3 would really be

3. `TWITCH_SHARD_ID="0" node shard_simple.js`

And the other info is inferred from `.env`

And away you go, so the bare minimum data is to tell the process a token to use, a conduit to go on and which shard it is. If you were loading a token and "active conduit ID" from storage that can be done in file.

So it just needs a shard, or if you are just filling for dead shards, iterate shards till you find a disconnect shard to self assign to.

And you don't even need to pass in the ClientID as the ClientID is obtained from validating the App Access Token. But if you did it would check they both matched

## Alternative flow

Conceptually you'd also want to approach it where the shard connects to the socket.

Broadcasts the socketID it's using to another service, and that service handles the shard update request.

So you pass noting to the shard, other than it's shard ID, so that when it relays data to other services you know the source shard.

# Sharding

When you update the shard count subscriptions are rebalanced between the shards, you have no control over whose subscriptions go where.

Subscription to Shard balancing is done via the broadcaster ID in the condition of the subscription.

So all Subscription types for a given broadcaster will/should be sent to the same shard, but you the developer have no control over broadcaster/shard assignment.

If a shard dies due to websocket disconnection/webhook death, it doesn't rebalance the shards, the message is just retried once on another shard.

So in a two shard conduit, where one of the shards is state `websocket_disconnected` all messages will end up on the other shard.

In a three shard contuit, where two of the shards is state `websocket_disconnected` you might lose messages if messages for shard 3 go to shard 2 and both shard 3 and 2 are dead but shard 1 is the alive one.

So you would want to be consuming [Conduit Shard Disabled](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#conduitsharddisabled) and possibly auto updating your shards to take out the dead shards from the stack by an [PATCH to update shards](https://dev.twitch.tv/docs/api/reference/#update-conduit-shards) and decrease the (shard count on the conduit](https://dev.twitch.tv/docs/api/reference/#update-conduits)

# Limits and Death notes

A given Client ID can have to up 5 Conduits

A given Conduit can have between 1 and 20,000 shards

You assign a Conduit x shards but remember they are 0 indexed, so a Conduit of 1 shard the shard ID is 0

Subscription limits and costings is the same as "regular" EventSub

A Subscription Type exists to help track a Shard dying unexpectedly, [Conduit Shard Disabled](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#conduitsharddisabled)

As per the [Guide](https://dev.twitch.tv/docs/eventsub/handling-conduit-events/)

> NOTE A Webhook shard follows the same disabling logic as a normal Webhook, and is only disabled after an extended outage of consecutive failures. If a notification is sent to an active Webhook shard and the Webhook callback fails, the notification will not be resent to another shard.

For a Shard assigned to a WebSocket it dies the moment the WebSocket Disconnects.

If a message fails to send to a given shard it is retried _ONLY ONCE_ on another Shard.

IMO the general use case of a Conduit is to attach the shards to WebSockets, generally utilising the Chat topics to instantly reconnect a chat bot to the rooms the chat bot needs to be in.

But it works real nice to anything you want to connect a lot of subscriptions to even a single socket connection ala Deprecated PubSub

# Scaling

## Conduit Scale up

1. [Update Conduits](https://dev.twitch.tv/docs/api/reference/#update-conduits) to increase the shard count
2. [Assign the new shard(s)](https://dev.twitch.tv/docs/api/reference/#update-conduit-shards) to transports

## Conduit Scale Down

### Scale down from the end

#### WebSockets

1. Disconnect WebSockets from the end of the list
2. [Update Conduits](https://dev.twitch.tv/docs/api/reference/#update-conduits) to decrease the shard count

Steps could be done in either order here for websockets, as when you disconnect it will auto update that shard to dead. Where as Webhooks is problemtatic due to retry rules

#### Webhooks

1. [Update Conduits](https://dev.twitch.tv/docs/api/reference/#update-conduits) to decrease the shard count

### Scale down from the middle

For Example: If you have 10 shards and want to kill shard 5

> 0 index remember

1. Copy Shard 9 to shard 4 via [Update Conduit Shards](https://dev.twitch.tv/docs/api/reference/#update-conduit-shards)
2. [Update Conduits](https://dev.twitch.tv/docs/api/reference/#update-conduits) to decrease the shard count

# Maintenance

## Webhooks

you wanna take shard 5 offline for a bit? Copy shard 10 to shard 5, the decrease shard count, when done increase shard count again.

If you take a webhook offline, Twitch will retry on the same shard, due to the webhook retry logic, rather than retrying on another shard.

## Websockets

just disconnect the websocket Twitch will retry on another BUT ONLY ONCE

If you want to take more than one Websocket offline for maintenance you should Update Conduits to take the effected shards out/moved to another shard.

You can have multiple shards assigned to the same logical endpoint/sessionID.

### HandOver a socket

On a conduit of one shard, doing a hand over theres two approaches

1. Make a new Socket
2. Update shard 0 to the new socket

This shouldn't incur any downtime/missed events

or

1. Make a new socket
2. Increase shard count by 1 (so 2 shards)
3. Assign the new socket to shard 1
4. When happy new socket is read swap shard 1 to shard 0 and shard 0 to shard 1 in the same PATCH request
5. When happy disconnect (the new shard 1 that was originall shard 0) shard 1 and descrease shard count back to 1

The second method is more invasive but can mean you don't lose any events whilst handovering

# Userland

Since a conduit uses App Access Tokens to operate generally you wouldn't expose them in userland.

But theres nothing really stopping you doing it in a way that protects the App Access Token from visiblity.

And you can connect a given Transport to a Conduit _and_ also susbcribe non conduit events to the transport.

I run a WebSocket consumer on my home machine that at boot connects to a Shard _and_ connects non conduit/shard topics to the same transport.

In this case it's some chat topics where I don't have the relevant ["Conduit Scopes"](https://github.com/BarryCarlyon/twitch_misc/tree/main/eventsub/websockets/web/chat#how-does-authentication-work) on the target channels.
