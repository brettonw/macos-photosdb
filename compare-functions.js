"use strict;"

// CompareFunctions are interfaces that take two values (a, b), and return a number as
// follows:
//     a < b : negative
//     a = b : zero
//     a > b : positive
Bedrock.CompareFunctions = function () {
    let _ = Object.create (null);

    // constants for the interface
    _.NUMERIC = "numeric";
    _.ALPHABETIC = "alphabetic";
    _.CHRONOLOGIC = "chronologic";
    _.AUTO = "auto";
    _.WILDCARD = "*";

    let compareNumeric = function (a, b, ascending) {
        // compare the values as numeric entities
        return ascending ? (a - b) : (b - a);
    };

    _.numeric = function (a, b, ascending) {
        // boilerplate null check
        if ((a === undefined) || (a === null)) {
            return ((b !== undefined) && (b !== null)) ? (ascending ? -1 : 1) : 0;
        }
        if ((b === undefined) || (b === null)) {
            return (ascending ? 1 : -1);
        }

        return compareNumeric (a, b, ascending);
    };

    let compareAlphabetic = function (a, b, ascending) {
        // compare case-insensitive strings with no spaces
        let ra = a.replace (/\s*/g, "").toLowerCase ();
        let rb = b.replace (/\s*/g, "").toLowerCase ();
        return ascending ? ra.localeCompare (rb) : rb.localeCompare (ra);
    };

    _.alphabetic = function (a, b, ascending) {
        // boilerplate null check
        if ((a === undefined) || (a === null)) {
            return ((b !== undefined) && (b !== null)) ? (ascending ? -1 : 1) : 0;
        }
        if ((b === undefined) || (b === null)) {
            return (ascending ? 1 : -1);
        }

        return compareAlphabetic (a, b, ascending);
    };

    _.chronologic = function (a, b, ascending) {
        // boilerplate null check
        if ((a === undefined) || (a === null)) {
            return ((b !== undefined) && (b !== null)) ? (ascending ? -1 : 1) : 0;
        }
        if ((b === undefined) || (b === null)) {
            return (ascending ? 1 : -1);
        }

        // convert the dates/timestamps to numerical values for comparison
        return compareNumeric (new Date (a).valueOf (), new Date (b).valueOf ());
    };

    _.auto = function (a, b, ascending) {
        // boilerplate null check
        if ((a === undefined) || (a === null)) {
            return ((b !== undefined) && (b !== null)) ? (ascending ? -1 : 1) : 0;
        }
        if ((b === undefined) || (b === null)) {
            return (ascending ? 1 : -1);
        }

        // try to compare the values as numerical if we can
        let na = Number (a).toString ();
        let nb = Number (b).toString ();
        if ((na === a.toString ()) && (nb === b.toString ())) {
            return compareNumeric (na, nb, ascending);
        }

        // otherwise do it alphabetic
        return compareAlphabetic (a, b, ascending);
    };

    _.get = function (type) {
        switch (type.toLowerCase ()) {
            case _.NUMERIC:
            case "number":
            case "digits":
                return this.numeric;

            case _.ALPHABETIC:
            case "text":
            case "string":
                return this.alphabetic;

            case _.CHRONOLOGIC:
            case "date":
            case "timestamp":
                return this.chronologic;

            case _.AUTO:
            case "any":
            case _.WILDCARD:
                return this.auto;
        }
        throw "Unknown type (" + type + ")";
    };

    _.compare = function (a, b, ascending, type) {
        return this.get (type) (a, b, ascending);
    };

    _.mask = function (compareResult) {
        return (compareResult < 0) ? 0b0001 : (compareResult > 0) ? 0b0100 : 0b0010;
    };

    _.operationMask = function (operation) {
        switch (operation.toLowerCase ()) {
            case "lt": case "<":
            return 0b0001;

            case "lte": case "<=":
            return 0b0011;

            case "eq": case "=": case "==":
            return 0b0010;

            case "gte": case ">=":
            return 0b0110;

            case "gt": case ">":
            return 0b0100;

            case "ne": case "neq": case "<>": case "!=": case "!":
            return 0b0101;
        }
        throw "Unknown operation (" + operation + ")";
    };

    return _;
} ();
