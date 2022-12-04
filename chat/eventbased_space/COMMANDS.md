## Chat Commands that are API Calls

# timeout

Timeout a user in a chat

## Arguments
- `room_id`
- `user_id`
- `duration` - in seconds
- `reason`

# ban

Ban a user from a chat

## Arguments
- `room_id`
- `user_id`
- `reason`


# delete

Delete a single message fomr a chat

## Arguments
- `room_id`
- `message_id`

# clear

Clears a whole channel chat

## Arguments
- `room_id`

# announcement

Send an announcement to a chat

## Arguments
- `room_id`
- `message`
- `color` - defaults to `primary` which will match the `room_id` accent channel color.


# emoteOnly

Set emote only on or off based on var

## Arguments
- `room_id`
- `emote_mode` - boolean true/false

# emoteOn
# emoteOff

Set emote only on or off based on function name called

## Arguments
- `room_id`



# followersOn

Enable followers only mode

## Arguments
- `room_id`
- `follower_mode_duration` - in seconds

# followersOff

Disable followers only mode

## Arguments
- `room_id`


# slowOn

Enable followers only mode

## Arguments
- `room_id`
- `slow_mode_wait_time` - in seconds

# slowOff

Disable followers only mode

## Arguments
- `room_id`


# subscribersOn
# subscribersOff
# uniqueOn
# uniqueOff

Set subscribers or unique chat (aka [R9k](https://blog.xkcd.com/2008/01/14/robot9000-and-xkcd-signal-attacking-noise-in-chat/)) on or off based on function name called

## Arguments
- `room_id`

# Custom

An operatior/devloper could call `_updateChatSettings` directly with a `room_id` and `payload` to update whatever rules in one go. See [Update Chat Settings](https://dev.twitch.tv/docs/api/reference#update-chat-settings) for the full possible payload.


# shieldsUp
# sheildsDown

Turn on or off Shield Mode

## Arguments
- `room_id`
