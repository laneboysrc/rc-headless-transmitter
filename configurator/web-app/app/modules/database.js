'use strict';

var Utils = require('./utils');


var DATABASE_NAME = 'HeadlessTX';
var STORE_NAME = 'Models and Transmitters';

//*************************************************************************
var Database = function (data) {
    this.db = undefined;

    var self = this;
    var request;

    console.log('Database: opening database "' + DATABASE_NAME + '"');
    try {
        request = window.indexedDB.open(DATABASE_NAME, 2);
    }
    catch (e) {
        console.error('indexedDB.open failed:', e);
        document.querySelector('#database-error').classList.remove('hidden');
        return;
    }

    request.onerror = function(event) {
        console.error('Database: onerror', event);
        document.querySelector('#database-error').classList.remove('hidden');
    };

    request.onupgradeneeded = function(event) {
        console.log('Database: onupgradeneeded');
        var db = event.target.result;

        // Create an objectStore for this database
        var objectStore = db.createObjectStore(STORE_NAME,
            { keyPath: 'uuid', autoIncrement: false });

        objectStore.transaction.oncomplete = function(event) {
            console.log("Database: Object store created");

            // Populate the virgin database with a model and transmitter
            // for testing.
            // addTestData(db);
        };
    };

    request.onsuccess = function(event) {
        console.log('Database: Database opened successfully');
        self.db = event.target.result;

        Utils.PubSub.publish('databaseReady');
        Utils.PubSub.removeTopic('databaseReady');
    };
};


//*************************************************************************
Database.prototype.isReady = function () {
    return (!!this.db);
};

//*************************************************************************
Database.prototype.getEntry = function (uuid, callback) {
    // console.log("Database: getEntry()");
    var request = this.db.transaction(STORE_NAME)
                         .objectStore(STORE_NAME)
                         .get(uuid);

    request.onsuccess = function(event) {
        var data = event.target.result;
        callback(data);
    };

    request.onerror = function(event) {
        console.error('Database: getEntry() failed', event);
        callback(undefined);
    };
};

//*************************************************************************
Database.prototype.setEntry = function (data, callback) {
    // console.log("Database: setEntry()");
    var request = this.db.transaction(STORE_NAME, 'readwrite')
                         .objectStore(STORE_NAME)
                         .put(data);

    request.onsuccess = function(event) {
        var result = event.target.result;
        if (callback) {
            callback(result);
        }
    };

    request.onerror = function(event) {
        console.error('Database: setEntry() failed', event);
        if (callback) {
            callback(undefined);
        }
    };
};

//*************************************************************************
Database.prototype.deleteEntry = function (data, callback) {
    // console.log("Database: deleteEntry()");
    var request = this.db.transaction(STORE_NAME, 'readwrite')
                         .objectStore(STORE_NAME)
                         .delete(data.uuid);

    request.onsuccess = function(event) {
        var result = event.target.result;
        if (callback) {
            callback(result);
        }
    };

    request.onerror = function(event) {
        console.error('Database: deleteEntry() failed', event);
        if (callback) {
            callback(undefined);
        }
    };
};

//*************************************************************************
Database.prototype.listEntries = function (callback) {
    var objectStore = this.db.transaction(STORE_NAME).objectStore(STORE_NAME);

    objectStore.openCursor().onsuccess = function (event) {
        var cursor = event.target.result;
        if (callback) {
            callback(cursor);
        }
    };
};


window['Database'] = new Database();
