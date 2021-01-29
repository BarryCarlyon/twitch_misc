## What is this example

Some scripts that'll demo some ways to use ffmpeg to stream.

These are pretty basic/dumb examples so it just works TM

## Reference Documentation

- [API to get Ingest URLS](https://dev.twitch.tv/docs/video-broadcast)

## Running the examples

First install ffmpeg, how to do this varies by platform.

- Pick a ingest to use
- update the file(s) to replace `INGEST` with the URL
- Fetch your stream key for the channel
- update the file(s) to replace `STREAMKEY` with the StreamKey

Then just

> $ ./generic.sh

To run the ffmpeg test pattern

Or

> $ ./image.sh grid_1920.png

To stream this test image example. The provided test image is just a 1920x1080 screenshot from photoshop with gridlines enabled.

You might stream a test image if you are working on a vidoe extension that needs to place things relative to a game screenshot or something.
