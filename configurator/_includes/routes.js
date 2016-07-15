(function () {
    'use strict';

    var routes = {
        // path: name
        '#/': function () { Utils.showPage('main'); },
        '#/about': function () { Utils.showPage('about'); },
        '#/model_details': ModelDetails.route,
        '#/mixer': Mixer.route,
        '#/mixer_unit/:index': MixerUnit.route,
        '#/limits/:channel': Limits.route,
        '#/rf_protocol': RFProtocol.route,
        '#/select_single/:devName/:item/:offset': SelectSingle.route,
    };

    for (var path in routes) {
        if (routes.hasOwnProperty(path)) {
            Path.map(path).to(routes[path]);
        }
    }

    Path.root('#/');

    window.onload = function() {

        function loadModelAndTx() {
            getDatabaseEntry('c91cabaa-44c9-11e6-9bc2-03ac25e30b5b', function (data) {
                dev.MODEL = new DBObject(data);
                console.log('dev.MODEL loaded:', data);
                getDatabaseEntry('43538fe8-44c9-11e6-9f17-af7be9c4479e', function (data) {
                    dev.TX = new DBObject(data);
                    console.log('dev.TX loaded:', data);
                    Path.listen();
                });
            });
        }

        // FIXME: this is a hack until the database has loaded
        function waitForDatabase() {
            if (db) {
                console.log('Database ready, initializing app...');
                loadModelAndTx();
            }
            else {
                setTimeout(waitForDatabase, 0.1);
            }
        }

        waitForDatabase();
    };
})();
