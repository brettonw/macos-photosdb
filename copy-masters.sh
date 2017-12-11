#!/usr/bin/env bash

MASTERS_SRC_DIR="/Volumes/ExtY-4T/Photos Library.photoslibrary/Masters/";
PHOTOS_DB_DIR="/Volumes/ExtXa-8T/PhotosDb";
MASTERS_DIR="$PHOTOS_DB_DIR/Masters/";
THUMBNAILS_DIR="$PHOTOS_DB_DIR/Thumbnails/";

# clean out the targets
echo "cleaning .DS_Store files...";
dotclean.js "$MASTERS_SRC_DIR";

# back up the files
echo "Synchronizing Masters...";
rsync --chmod=ugo=rwX --archive --progress --delete --exclude=".*" "$MASTERS_SRC_DIR" "$MASTERS_DIR";

# update permissions
echo "Updating Permissions...";
chmod -R ugo+w "$MASTERS_DIR";

# build thumbnails
make-thumbnails.pl "$MASTERS_DIR" "$THUMBNAILS_DIR";

echo "DONE!"
