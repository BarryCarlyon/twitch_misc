#!/bin/bash

args=("$@")

url=$(curl https://ingest.twitch.tv/ingests | jq '.ingests[0].url_template')

temp="${url%\"}"
temp="${temp#\"}"
url=$temp

url="${url/\{stream_key\}/"${args[0]}"}"

ffmpeg -nostdin -framerate 15 -re -loop 1 \
-i ${args[1]} \
-f flv -vcodec libx264 -pix_fmt yuv420p -preset slow \
-r 15 -g 30 \
${url}
