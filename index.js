"use strict;"

let makeStyleNameFromColumnName = function (name) {
    // collapse any spaces
    return name.replace (/ /g, "-").toLowerCase ();
};

let Http = Bedrock.Http;
let Html = Bedrock.Html;
let now = new Date ().getTime ();
Http.get ("images-subset.json?" + now, function (records) {
    console.log ("loaded images");

    let fieldsAs = {
        "ImageWidth": "Width",
        "ImageHeight": "Height",
        "FileSize": "Size",
        "FileTypeExtension": "Type",
        "FileName": "Name",
        "ExposureTime": "Exp",
        "FNumber": "f-stop",
        "GPSLatitude": "Latitude",
        "GPSLongitude": "Longitude",
        "GPSAltitude": "Altitude"
    };

    // identify all the fields, and make a few adjustments
    let fields = Object.create (null);
    for (let record of records) {
        let keys = Object.keys(record);
        for (let key of keys) {
            if (key in fieldsAs) {
                let replaceKey = fieldsAs[key];
                record[replaceKey] = record[key];
                delete record[key];
                key = replaceKey;
            }
            fields[key] = key;
        }

        // now extract a date of some sort based on options (in order of preference)
        let dateOptions = ["GPSDateTime","SubSecCreateDate","CreateDate","ModifyDate"];
        let dateTime;
        for (let dateOption of dateOptions) {
            if (dateOption in record) {
                dateTime = record[dateOption];//.replace(/z$/i, "");
                break;
            }
        }
        if (dateTime === undefined) {
            // try to set a date from the directory name
            let d = record["Directory"].split ("/")[4].split("-");
            if (d.length == 2) {
                let t = d[1];
                d = d[0];
                if ((d.length == 8) && (t.length == 6)) {
                    dateTime = d.substr(0, 4) + ":" + d.substr(4, 2) + ":" + d.substr(6, 2);
                    dateTime += " " + t.substr(0, 2) + ":" + t.substr(2, 2) + ":" + t.substr(4, 2) + "Z";
                }
            }
        }
        dateTime = dateTime.split (" ");
        record["Date"] = dateTime[0].replace (/:/g, "/");
        record["Time"] = dateTime[1];
    }

    // sort the database
    let CF = Bedrock.CompareFunctions;
    records = Bedrock.DatabaseOperations.Sort.new ({ fields:[
            { name:"Date", asc:true, type: CF.ALPHABETIC },
            { name:"Time", asc:true, type: CF.ALPHABETIC },
            { name:"Width", asc:true, type: CF.NUMERIC },
            { name:"Height", asc:true, type: CF.NUMERIC },
            { name:"Size", asc:true, type: CF.ALPHABETIC },
            { name:"Name", asc:true, type: CF.ALPHABETIC }
        ] }).perform (records);

    // identify potential duplicates
    let recordComparable = Bedrock.Comparable.RecordComparable.new ({ fields:[
            { name:"Date", asc:true, type: CF.ALPHABETIC },
            { name:"Time", asc:true, type: CF.ALPHABETIC },
            { name:"Width", asc:true, type: CF.NUMERIC },
            { name:"Height", asc:true, type: CF.NUMERIC },
            { name:"Size", asc:true, type: CF.ALPHABETIC }
        ] });
    for (let i = 1, end = records.length; i < end; ++i) {
        let recordA = records[i - 1];
        let recordB = records[i];
        if (recordComparable.compare (records[i - 1], records[i]) == 0) {
            // tag the second as a duplicate of the first
            recordB["Duplicate"] = { Directory: recordA["Directory"], Name: recordA["Name"] };
            fields["Duplicate"] = "Duplicate";
        }
    }

    // add a header row from the fields
    let fieldKeys = Object.keys (fields).sort();
    fieldKeys = [ "Date","Time","Width","Height","Size","Type","Name","Make","Model","Exp","f-stop","ISO" ];

    // add the header to the display
    let bedrockDatabaseDisplay = document.getElementById ("bedrock-database-display");
    let headerLineElement = Html.addElement (bedrockDatabaseDisplay, "div", { id: "bedrock-header-line" });
    for (let key of fieldKeys) {
        let headerElement = Html.addElement (headerLineElement, "div", { class: "bedrock-header-entry" });
        Html.addElement (headerElement, "div", { classes: [key.replace (/ /g, "-").toLowerCase (), "bedrock-header-entry-text" ] }).innerHTML = key;
    }
    let bedrockDatabaseDisplayList = Html.addElement (bedrockDatabaseDisplay, "div", { id:"bedrock-database-display-list", onscroll: function (event) { scrollView (event.srcElement); } });


    // function to populate a page
    let populatePage = function (pageElement) {
        let pageInfo = pageElement.id.split (/-/);
        let start = parseInt (pageInfo[1]);
        let end = parseInt (pageInfo[2]);
        for (let j = start; j < end; ++j) {
            try {
                let record = currentDb[j];
                let lineElement = Html.addElement(pageElement, "div", {classes: ((j & 0x01) == 1) ? ["bedrock-database-line", "odd"] : ["bedrock-database-line"]});
                for (let key of fieldKeys) {
                    let value = (key in record) ? record[key] : "";
                    let styleName = makeStyleNameFromColumnName(key);
                    let entryElement = Html.addElement(lineElement, "div", {class: "bedrock-database-entry"});
                    Html.addElement(entryElement, "div", {classes: [styleName, "bedrock-database-entry-text"]}).innerHTML = value;
                }

                // add a file link
                let entryElement = Html.addElement (lineElement, "div", { class: "bedrock-database-entry" });
                let linkDivElement = Html.addElement (entryElement, "div", { classes: ["file", "bedrock-database-entry-text"] });
                let fileName = record["Directory"].substr (2) + "/" + record["Name"];
                let linkElement = Html.addElement (linkDivElement, "a", { href: "/photosdb-images/Masters/" + fileName });
                let thumbnailFileName = "/photosdb-images/Thumbnails/" + fileName;
                if ("Orientation" in record) {
                    switch (record.Orientation) {
                        case "Horizontal (normal)":
                            Html.addElement (linkElement, "img", { src: thumbnailFileName, class: "thumbnail" });
                            break;
                        case "Rotate 90 CW":
                            Html.addElement (linkElement, "img", { src: thumbnailFileName, classes: ["thumbnail", "rotate90CW"] });
                            break;
                        case "Rotate 180":
                            Html.addElement (linkElement, "img", { src: thumbnailFileName, classes: ["thumbnail", "rotate180"] });
                            break;
                        case "Rotate 270 CW":
                            Html.addElement (linkElement, "img", { src: thumbnailFileName, classes: ["thumbnail", "rotate270CW"] });
                            break;
                    }
                } else {
                    Html.addElement (linkElement, "img", { src: thumbnailFileName, class: "thumbnail" });
                }
            } catch (exception) {
                console.log(exception);
            }
        }
    };

    // build the database filter
    Bedrock.Database.Container.new ({
        database: records,
        onUpdate: function (db) {
            Bedrock.PagedDisplay.makeTable (bedrockDatabaseDisplayList, db, fields);

            // save the result as a CSV file
            /*
            let a = document.body.appendChild (document.createElement ("a"));
            a.download = "export.csv";
            a.setAttribute ("href", "data:text/plain;charset=utf-8," + encodeURIComponent (bedrockDatabaseDisplayList.innerText));
            a.click ();
            document.body.removeChild(a);
            */

        }
    });
});
