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


    function databaseReady() {
        console.log('routes: Database ready, loading dev.TX and dev.MODEL');

        var count = 2;
        const topic = 'entryRetrieved';

        Database.getEntry('c91cabaa-44c9-11e6-9bc2-03ac25e30b5b', function (data) {
            dev.MODEL = new DBObject(data);
            console.log('routes: dev.MODEL loaded');
            Utils.PubSub.publish(topic);
        });

        Database.getEntry('43538fe8-44c9-11e6-9f17-af7be9c4479e', function (data) {
            dev.TX = new DBObject(data);
            console.log('routes: dev.TX loaded');
            Utils.PubSub.publish(topic);
        });

        function entryRetrievedCallback() {
            count = count - 1;
            if (count) {
                return;
            }

            console.log('routes: Both getEntry() finished, launching page');
            Utils.PubSub.removeTopic(topic);

            // Initialization complete: Launch the page matching location.hash
            Path.listen();
        }

        Utils.PubSub.subscribe(topic, entryRetrievedCallback);
    }

    Utils.PubSub.subscribe('databaseReady', databaseReady);

})();
