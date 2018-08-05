let db = null;
let isbnList = [];

document.addEventListener('deviceready', function () {

    $('#barcodeScanButton').prop('disabled', true).addClass('ui-disabled');
    $('#comicButton').prop('disabled', true).addClass('ui-disabled');
    $('#exportListButton').prop('disabled', true).addClass('ui-disabled');
    $('#importListButton').prop('disabled', true).addClass('ui-disabled');

    databaseInit();

});

function databaseInit() {
    db = window.sqlitePlugin.openDatabase({ name: 'usercomics.db', location: 'default', androidDatabaseImplementation: 2 });

    db.transaction(function (transaction) {
        transaction.executeSql('CREATE TABLE IF NOT EXISTS ComicDB (isbn, title, boxnumber, publisher, description, thumbnail)');
        displayDatabseRecords();
    },
        function (error) {
            console.log(error);
            navigator.notification.alert("Could not open or create database", function () { }, "Error");
            navigator.notification.beep(1);
        },
        function () {
            console.log("Database Populated");
        });
}

function saveRecord(isbn, title, boxnumber, publisher, description, thumbnail) {
    db.transaction(function (transaction) {
        let query = "INSERT INTO ComicDB (isbn, title, boxnumber, publisher, description, thumbnail) VALUES (?,?,?,?,?,?)"
        transaction.executeSql(query, [isbn, title, boxnumber, publisher, description, thumbnail]
            , function (tx, result) {
                console.log("Entry saved in databse");
            },
            function (error) {
                navigator.notification.alert("Comic not saved in database", function () { }, "Error");
                navigator.notification.beep(1);

            });
    });
}

function removeRecord(isbn) {
    db.transaction(function (transaction) {
        var executeQuery = "DELETE FROM ComicDB where isbn=?";
        transaction.executeSql(executeQuery, [isbn],
            //On Success
            function (tx, result) {
                let isbnListIndex = isbnList.indexOf(isbn);
                if (isbnListIndex >= 0) {
                    isbnList.splice(isbnListIndex, 1);
                }
                navigator.notification.alert("Comic deleted successfully", function () { }, "Error");
                navigator.notification.beep(1);
            },
            //On Error
            function (error) {
                navigator.notification.alert("Comic not deleted", function () { }, "Error");
                navigator.notification.beep(1);
            });
    });
}

function displayDatabseRecords() {
    displayLoadingWidget("Loading Comic List");

    db = window.sqlitePlugin.openDatabase({ name: 'usercomics.db', location: 'default' });

    db.transaction(function (tx) {
        var query = "SELECT * FROM ComicDB";
        tx.executeSql(query, [], function (tx, resultSet) {
            for (let i = 0; i < resultSet.rows.length; i++) {
                addComicEntry(resultSet.rows.item(i).isbn, resultSet.rows.item(i).boxnumber,
                    resultSet.rows.item(i).title, resultSet.rows.item(i).publisher, resultSet.rows.item(i).description, resultSet.rows.item(i).thumbnail, false);

                isbnList.push(resultSet.rows.item(i).isbn);
            }
        },
            function (tx, error) {

            });
        $('#barcodeScanButton').prop('enabled', true).removeClass('ui-disabled');
        $('#comicButton').prop('enabled', true).removeClass('ui-disabled');
        $('#exportListButton').prop('disabled', true).removeClass('ui-disabled');
        $('#importListButton').prop('disabled', true).removeClass('ui-disabled');

        $.mobile.loading("hide");

    },
        function (error) {
            console.log('transaction error: ' + error.message);
        },
        function () {
            console.log('transaction ok');
        });

}

function saveDatabseRecordsToFile() {
    db = window.sqlitePlugin.openDatabase({ name: 'usercomics.db', location: 'default' });

    db.transaction(function (tx) {

        let comics = new Array();

        var query = "SELECT * FROM ComicDB";
        tx.executeSql(query, [], function (tx, resultSet) {
            for (let i = 0; i < resultSet.rows.length; i++) {
                let comic = {
                    isbn: resultSet.rows.item(i).isbn,
                    boxnumber: resultSet.rows.item(i).boxnumber,
                    title: resultSet.rows.item(i).title,
                    publisher: resultSet.rows.item(i).publisher,
                    description: resultSet.rows.item(i).description,
                    thumbnail: resultSet.rows.item(i).thumbnail
                };
                comics.push(comic);
            }

            var comicData = JSON.stringify(comics);

            console.log(comicData);

            createFile(comicData);
        },
            function (tx, error) {

            });
    },
    function (error) {
        console.log('transaction error: ' + error.message);
    },
    function () {
        console.log('transaction ok');
    });
}

function createFile(comicData) {

    var type = window.TEMPORARY;
    var size = 5 * 1024 * 1024;
    window.requestFileSystem(type, size, successCallback, errorCallback)

    function successCallback(fs) {

        fs.root.getFile('usercomics.txt', { create: true, exclusive: false }, function (fileEntry) {

            fileEntry.createWriter(function (fileWriter) {
                fileWriter.onwriteend = function (e) {

                    navigator.notification.alert(fs.root.nativeURL, function () { }, "SAVE LOCATION:");
                    navigator.notification.beep(1);
                };

                fileWriter.onerror = function (e) {
                    navigator.notification.alert("Comic list not saved, error: ", function () { }, "Error");
                    navigator.notification.beep(1);
                };

                var blob = new Blob([comicData], { type: 'text/plain' });

                fileWriter.write(blob);

            }, errorCallback);

        }, errorCallback);

    }

    function errorCallback(error) {
        navigator.notification.alert("SAVE FILE ERROR: " + error.code, function () { }, "Error");
        navigator.notification.beep(1);
    }

}

function readFile() {

    var type = window.TEMPORARY;
    var size = 5 * 1024 * 1024;
    window.requestFileSystem(type, size, successCallback, errorCallback)

    function successCallback(fs) {
        fs.root.getFile('usercomics.txt', {}, function (fileEntry) {

            fileEntry.file(function (file) {
                var reader = new FileReader();

                reader.onloadend = function (e) {

                    var obj = JSON.parse(this.result);

                    for (var i = 0; i < obj.length; i++) {

                        if (isbnList.includes(obj[i].isbn) === false) {
                            addComicEntry(obj[i].isbn, obj[i].boxnumber, obj[i].title, obj[i].publisher, obj[i].description, obj[i].thumbnail, false);
                            isbnList.push(obj[i].isbn);
                            saveRecord(obj[i].isbn, obj[i].title, obj[i].boxnumber, obj[i].publisher, obj[i].description, obj[i].thumbnail)
                        }
                    }

                };

                reader.readAsText(file);
            }, errorCallback);
        }, errorCallback);
    }

    function errorCallback(error) {
        navigator.notification.alert("READ FILE ERROR: " + error.code, function () { }, "Error");
        navigator.notification.beep(1);
    }
}