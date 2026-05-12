function bindImporter(dropzone) {
    dropzone.addEventListener('drop', function(event) {
        if (event.preventDefault) {
            event.preventDefault();
        }

        var types = event.dataTransfer.types;
        filelist = event.dataTransfer.files;
        var file = event.dataTransfer.files[0];

        if (file.type !== 'text/csv') {
            alert('Uploaded file must be a RFC4180-compliant CSV file');
            return false;
        }

        // Init file reader
        first = true;
        var fileReader = new FileReader();
        fileReader.onload = function (e) {
            processCSV(fileReader.result);
        };
        fileReader.onerror = function (e) {
            throw 'Error reading CSV file';
        };

        // Start reading file
        fileReader.readAsText(file);

        return false;
    }, false);

    dropzone.addEventListener('dragstart', function(event) {
        return true;
    }, true);

    dropzone.addEventListener('dragend', function(event) {
        return true;
    }, true);

    dropzone.addEventListener('dragenter', function(event) {
        if (event.preventDefault) event.preventDefault();
        return false;
    }, false);

    dropzone.addEventListener('dragover', function(event) {
        if (event.preventDefault) event.preventDefault(); // allows us to drop
    }, false);

    dropzone.addEventListener('dragleave', function(event) {
        if (event.preventDefault) event.preventDefault(); // allows us to drop
        return false;
    }, false);
}


let lines = 0;
function processCSV(data) {
    let lines = CSVToArray(data);
    csvArrived(lines);
}

/*
https://www.bennadel.com/blog/1504-ask-ben-parsing-csv-strings-with-javascript-exec-regular-expression-command.htm
*/

	// This will parse a delimited string into an array of
	// arrays. The default delimiter is the comma, but this
	// can be overriden in the second argument.
	function CSVToArray( strData, strDelimiter ){
		// Check to see if the delimiter is defined. If not,
		// then default to comma.
		strDelimiter = (strDelimiter || ",");

		// Create a regular expression to parse the CSV values.
		var objPattern = new RegExp(
			(
				// Delimiters.
				"(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

				// Quoted fields.
				"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

				// Standard fields.
				"([^\"\\" + strDelimiter + "\\r\\n]*))"
			),
			"gi"
			);


		// Create an array to hold our data. Give the array
		// a default empty first row.
		var arrData = [[]];

		// Create an array to hold our individual pattern
		// matching groups.
		var arrMatches = null;


		// Keep looping over the regular expression matches
		// until we can no longer find a match.
		while (arrMatches = objPattern.exec( strData )){

			// Get the delimiter that was found.
			var strMatchedDelimiter = arrMatches[ 1 ];

			// Check to see if the given delimiter has a length
			// (is not the start of string) and if it matches
			// field delimiter. If id does not, then we know
			// that this delimiter is a row delimiter.
			if (
				strMatchedDelimiter.length &&
				(strMatchedDelimiter != strDelimiter)
				){

				// Since we have reached a new row of data,
				// add an empty row to our data array.
				arrData.push( [] );

			}


			// Now that we have our delimiter out of the way,
			// let's check to see which kind of value we
			// captured (quoted or unquoted).
			if (arrMatches[ 2 ]){

				// We found a quoted value. When we capture
				// this value, unescape any double quotes.
				var strMatchedValue = arrMatches[ 2 ].replace(
					new RegExp( "\"\"", "g" ),
					"\""
					);

			} else {

				// We found a non-quoted value.
				var strMatchedValue = arrMatches[ 3 ];

			}


			// Now that we have our value string, let's add
			// it to the data array.
			arrData[ arrData.length - 1 ].push( strMatchedValue );
		}

		// Return the parsed data.
		return( arrData );
	}