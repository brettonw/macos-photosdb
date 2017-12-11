let makeStyleNameFromColumnName = function (name) {
    // collapse any spaces
    return name.replace (/ /g, "-").toLowerCase ();
};

let Http = Bedrock.Http;
let Html = Bedrock.Html;
let now = new Date ().getTime ();
Http.get ("images-subset.json?" + now, function (transactions) {
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
    for (let transaction of transactions) {
        let keys = Object.keys(transaction);
        for (let key of keys) {
            if (key in fieldsAs) {
                let replaceKey = fieldsAs[key];
                transaction[replaceKey] = transaction[key];
                delete transaction[key];
                key = replaceKey;
            }
            fields[key] = key;
        }

        // now extract a date of some sort: GPSDateTime,SubSecCreateDate,CreateDate
        if ("GPSDateTime" in record) {
            record["Date"] = record["GPSDateTime"];
        } else if("SubSecCreateDate" in record) {
            record["Date"] = record["SubSecCreateDate"];
        } else if("CreateDate" in record) {
            record["Date"] = record["CreateDate"];
        } else {
            console.log("No date found for " + record["Directory"] + record["Name"]);
        }
    }

    transactions = SimpleDatabase.sort (transactions, [ { name:"Date", type:"string", asc:true }, { name: "Name", type:"string", asc:true } ]);

    // add a header row from the fields
    let fieldKeys = Object.keys (fields).sort();
    fieldKeys = [ "Date","Width","Height","Size","Type","Name","Make","Model","Exp","f-stop","ISO" ];

    // add the header to the display
    let bedrockDatabaseDisplay = document.getElementById ("bedrock-database-display");
    let headerLineElement = Html.addElement (bedrockDatabaseDisplay, "div", { id: "bedrock-header-line" });
    for (let key of fieldKeys) {
        let headerElement = Html.addElement (headerLineElement, "div", { class: "bedrock-header-entry" });
        Html.addElement (headerElement, "div", { classes: [ makeStyleNameFromColumnName (key), "bedrock-header-entry-text" ] }).innerHTML = key;
    }
    let bedrockDatabaseDisplayList = Html.addElement (bedrockDatabaseDisplay, "div", { id:"bedrock-database-display-list", onscroll: function (event) { scrollView (event.srcElement); } });

    let scrolledIntoView = function (element, list) {
        let height = list.clientHeight;
        let halfHeight = height / 2;
        let coords = element.getBoundingClientRect ();
        return (coords.bottom >= -halfHeight) && (coords.top <= (height + halfHeight));
    };

    // deal with displaying the database
    let currentDb;
    let recordCount;
    const displayLineSize = 64;
    const pageSize = Math.floor (bedrockDatabaseDisplayList.offsetHeight / displayLineSize) * 2;
    const pageHeight = displayLineSize * pageSize;
    let pageCount;

    let pageIsInView = function (page, view) {
        let pageInfo = page.id.split (/-/);
        let start = (parseInt (pageInfo[1]) * displayLineSize) - view.scrollTop;
        let end = (parseInt (pageInfo[2]) * displayLineSize) - view.scrollTop;
        return (end >= 0) && (start <= view.clientHeight);
    };

    let lastVisiblePages = [];

    let scrollView = function (view) {
        let visibleViews = [];

        // clear the lastVisiblePages
        for (let page of lastVisiblePages) {
            if (pageIsInView (page, view)) {
                visibleViews.push (page);
            } else {
                Html.removeAllChildren (page);
            }
        }

        // figure out which pages to make visible
        let start = Math.floor (view.scrollTop / pageHeight);
        let end = Math.min (pageCount, start + 2);
        let pages = view.children;
        for (let page of pages) {
            if (pageIsInView (page, view)) {
                visibleViews.push (page);
                if (page.children.length == 0) {
                    populatePage (page);
                }
            }
        }

        // reset the visible pages for the next time
        lastVisiblePages = visibleViews;
    };

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
                let fileName = record["File"].substr (2);
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
        database: transactions,
        filterValues: [{ "field": "Type" }],
        onUpdate: function (db) {
            // reset everything
            currentDb = db;
            bedrockDatabaseDisplayList.scrollTop = 0;

            Html.removeAllChildren (bedrockDatabaseDisplayList);

            // build out the paging flow, computing the page height such that it would be impossible to have more than 2
            // pages visible at any one time
            recordCount = currentDb.length;
            pageCount = Math.floor (recordCount / pageSize) + (((recordCount % pageSize) > 0) ? 1 : 0);

            // loop over all of the records, page by page
            for (let pageIndex = 0; pageIndex < pageCount; ++pageIndex) {
                let start = pageIndex * pageSize;
                let end = Math.min(start + pageSize, recordCount);
                let count = end - start;
                Html.addElement (bedrockDatabaseDisplayList, "div", { id: "page-" + start + "-" + end, style: { height: (count * displayLineSize) + "px" } });
            }
            scrollView (bedrockDatabaseDisplayList);

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
