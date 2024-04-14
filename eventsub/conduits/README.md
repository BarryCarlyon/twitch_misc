# Twitch Conduits

Work in Progress free form notes

# Scaling

## Conduit Scale up

1. [Update Conduits](https://dev.twitch.tv/docs/api/reference/#update-conduits) to increase the shard count
2. [Assign the new shard(s)](https://dev.twitch.tv/docs/api/reference/#update-conduit-shards) to transports

## Conduit Scale Down

### Scale down from the end

#### WebScokets

1. Disconnect WebSockets from the end of the list
2. [Update Conduits](https://dev.twitch.tv/docs/api/reference/#update-conduits) to decrease the shard count

Steps could be done in either order here for websockets, as when you disconnect it will auto update that shard to dead. Where as Webhooks is problemtatic due to retry rules

#### Webhooks

1. [Update Conduits](https://dev.twitch.tv/docs/api/reference/#update-conduits) to decrease the shard count

### Scale down from the middle

For exmaple: If you have 10 shards and want to kill shard 5

0 index remember

1. Copy Shard 9 to shard 4 via [Update Conduit Shards](https://dev.twitch.tv/docs/api/reference/#update-conduit-shards)
2. [Update Conduits](https://dev.twitch.tv/docs/api/reference/#update-conduits) to decrease the shard count

# Maintenance

Webhooks - you wanna take shard 5 offline for a bit? Copy shard 10 to shard 5

Websockets - just disconnect the websocket Twitch will retry on another BUT ONLY ONCE

if you want to take more than one Websocket offline for maintenance you should Update Conduits to take the effected shards out/moved to another shard.

You can have multiple shards assigned to the same logical endpoint/sessionID.

# HandOver a socket

On a conduit of one shard, doing a hand over theres two approachs

1. Make a new Socket
2. Update the shard to the new socket

or

1. Make a new socket
2. Increas shard count by 1 (so 2 shards)
3. Assign new socket to shard 1
4. When happy swap shard 1 to shard 0 and shard 0 to shard 1 in the same PATCH request
5. When happy disconnect shard 1 and descrease shard count back to 1

The second method is more invasive but can mean you don't lose any events whilst handovering
