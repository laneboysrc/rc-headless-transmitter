




var db;
function getDatabaseEntry(uuid, callback) {
    'use strict';

    console.log("getDatabaseEntry()");
    var request = db.transaction('data').objectStore('data').get(uuid);

    request.onsuccess = function(event) {
        var data = event.target.result;
        callback(data);
    };

    request.onerror = function(event) {
        console.error(onerror, event);
        callback(undefined);
    };
}


(function () {
    'use strict';
    var request = window.indexedDB.open("HeadlessTX", 2);

    request.onerror = function(event) {
        console.error('onerror', event);
    };

    request.onupgradeneeded = function(event) {
        console.log('onupgradeneeded', event);
        var db = event.target.result;

        // Create an objectStore for this database
        var objectStore = db.createObjectStore('data', { keyPath: 'uuid' });

        objectStore.transaction.oncomplete = function(event) {
            console.log("Object store created");
            addTestData(db);
        };
    };

    request.onsuccess = function(event) {
        console.log("onsuccess", event);
        db = event.target.result;

        // getDatabaseEntry('c91cabaa-44c9-11e6-9bc2-03ac25e30b5b', function (dbObject) {
        //     dev.MODEL = dbObject;
        //     console.log('dev.MODEL loaded:', dbObject);
        // });
        // getDatabaseEntry('43538fe8-44c9-11e6-9f17-af7be9c4479e', function (dbObject) {
        //     dev.TX = dbObject;
        //     console.log('dev.TX loaded:', dbObject);
        // });
    };

    function addTestData(db) {
        console.log("addTestData()");

        var transaction = db.transaction("data", "readwrite");
        transaction.oncomplete = function(event) {
            console.log("transaction.oncomplete", event);

        };

        var dataObjectStore = transaction.objectStore("data");


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
            console.log("add.onsuccess", event.target.result);
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

