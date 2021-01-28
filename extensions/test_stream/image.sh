#!/bin/bash

args=("$@")

ffmpeg -nostdin -framerate 15 -re -loop 1 \
-i ${args[0]} \
-f flv -vcodec libx264 -pix_fmt yuv420p -preset slow \
-r 15 -g 30 \
rtmp://INGEST/app/STREAMKEY
