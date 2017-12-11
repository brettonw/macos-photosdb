#!/usr/bin/env bash

MASTERS_SRC_DIR="/Volumes/ExtY-4T/Photos Library.photoslibrary/Masters/";

find "$MASTERS_SRC_DIR" -iname *.jpg -exec exiftool -j {} + > images.json

# the result needs to be fixed up a bit

# XXX need to make a version of this that identifies new images... maybe by looking in the
# XXX served copy...
