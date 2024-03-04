## What is this example

Some scripts that'll demo some ways to use ffmpeg to stream.

These are pretty basic/dumb examples so it just works TM

## Reference Documentation

- [API to get Ingest URLS](https://dev.twitch.tv/docs/video-broadcast)

## Gotcha

Twitch has a maximum stream length of 48 hours.

So make sure you are able to restart the stream automatically if needed if FFMPEG stops sending, and you didn't get review yet...

## Running the examples

First install ffmpeg, how to do this varies by platform.

### For generic.sh

- On your server/location do `curl https://ingest.twitch.tv/ingests | more` (or if JQ installed `curl https://ingest.twitch.tv/ingests | jq '.ingests[0]'`
- This will give you the "best"/"cloest" ingest to you server/location
- Using the `url_template` replace `{stream_key}` with your stream key and update `FROMTEMPLATE` with this value

Then just

> $ ./generic.sh

To run the ffmpeg test pattern

### For image.sh

This requires `jq` to be installed. (I'd list `curl` but if you don't have `curl` installed, is it even a server?)
image.sh will fetch the "best" ingest for you.
Then string subtitube in your stream key and forward the static image

> $ ./image.sh streamkey grid_1920.png

To stream this test image example. The provided test image is just a 1920x1080 screenshot from photoshop with gridlines enabled.

You might stream a test image if you are working on a video extension that needs to place things relative to a game screenshot or something.
