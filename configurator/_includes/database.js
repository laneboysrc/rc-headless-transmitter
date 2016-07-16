(function () {
    'use strict';

    const DATABASE_NAME = 'HeadlessTX';
    const STORE_NAME = 'Models and Transmitters';

    var Database = function Database(data) {
        this.db = undefined;

        var self = this;

        console.log('Database: opening database "' + DATABASE_NAME + '"');
        var request = window.indexedDB.open(DATABASE_NAME, 2);

        request.onerror = function(event) {
            console.error('Database: onerror', event);
        };

        request.onupgradeneeded = function(event) {
            console.log('Database: onupgradeneeded');
            var db = event.target.result;

            // Create an objectStore for this database
            var objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'uuid' });

            objectStore.transaction.oncomplete = function(event) {
                console.log("Database: Object store created");

                // Populate the virgin database with a model and transmitter
                // for testing.
                addTestData(db);
            };
        };

        request.onsuccess = function(event) {
            console.log('Database: Database opened successfully');
            self.db = event.target.result;

            Utils.PubSub.publish('databaseReady');
            Utils.PubSub.removeTopic('databaseReady');
        };


    };
    window['Database'] = new Database();


    Database.prototype.isReady = function () {
        return (!!this.db);
    };


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

    Database.prototype.setEntry = function (data, callback=undefined) {
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


    function addTestData(db) {
        console.log("addTestData()");

        var transaction = db.transaction(STORE_NAME, 'readwrite');

        transaction.oncomplete = function(event) {
            console.log("addTestData transaction.oncomplete");
        };

        var dataObjectStore = transaction.objectStore(STORE_NAME);

        var configVersion = new Uint32Array(TEST_CONFIG_DATA.buffer, 0, 1)[0];
        var config = CONFIG_VERSIONS[configVersion];

        var entries = [{
                data: TEST_CONFIG_DATA.slice(config.MODEL.o, config.MODEL.o + config.MODEL.s),
                schemaName: 'MODEL'
            }, {
                data: TEST_CONFIG_DATA.slice(config.TX.o, config.TX.o + config.TX.s),
                schemaName: 'TX'
            }
        ];

        function addSuccessHandler(event) {
            console.log("addTestData add.onsuccess");
        }

        for (var i in entries) {
            var entry = entries[i];
            console.log(entry);
            var schema = config[entry.schemaName];

            var uuid_bytes = new Uint8Array(entry.data, schema['UUID'].o, schema['UUID'].s);
            var uuid = Utils.uuid2string(uuid_bytes);

            var data_to_add = {
                data: entry.data,
                uuid: uuid,
                schemaName: entry.schemaName,
                configVersion: configVersion,
                lastChanged: 0
            };

            var request = dataObjectStore.add(data_to_add);
            request.onsuccess = addSuccessHandler;
        }
    }
})();
