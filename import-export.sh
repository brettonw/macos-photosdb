#! /usr/bin/env bash

# import the images.json
unzip -q -o images.json.zip
mongoimport --drop --db photosdb --collection exif --file images.json --jsonArray
rm -f images.json

# export the desired fields
EXPORT_FIELDS="Orientation,GPSLatitude,GPSLongitude,GPSAltitude,SourceFile,FileName,FileSize,FileTypeExtension,ImageWidth,ImageHeight,Make,Model,ExposureTime,FNumber,CreateDate,ISO";
mongoexport --db photosdb --collection exif  --fields "$EXPORT_FIELDS" --out images-subset.json --jsonArray

# zip up the response for archiving
rm -f images-subset.json.zip
zip -q -o images-subset.json.zip images-subset.json

# maybe drop the database again
echo "db.dropDatabase()" | mongo photosdb
