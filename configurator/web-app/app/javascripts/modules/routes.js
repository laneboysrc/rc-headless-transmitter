'use strict';

var Utils       = require('./utils');
var Path        = require('./path');
var DBObject    = require('./database_object');


var routes = {
    // path: name
    '#/': function () { Utils.showPage('main'); },
    '#/about': function () { Utils.showPage('about'); },
    '#/model_details/m/:model(/t/:tx)': ModelDetails,
    '#/mixer/m/:model(/t/:tx)': Mixer,
    '#/mixer_unit/:index/m/:model(/t/:tx)': MixerUnit,
    '#/edit_curve/:offset/m/:model(/t/:tx)': EditCurve,
    '#/edit_switch/:offset/m/:model(/t/:tx)': EditSwitch,
    '#/limits/:channel/m/:model(/t/:tx)': Limits,
    '#/rf_protocol/m/:model(/t/:tx)': RFProtocol,

    // We need two entries to be able to match the four combinations of
    // uuid availability (none, model, tx, model+tx)
    '#/select_single/:devName/:item/:offset(/t/:tx)': SelectSingle,
    '#/select_single/:devName/:item/:offset/m/:model(/t/:tx)': SelectSingle,
};


function redirect(destination) {
    return function () {
        if (typeof destination === "function") {
            destination();
        }
        else {
            destination.init(this.params);
        }
    };
}

function loadDevicesFromURL(params) {
    console.log('Loading devices specified in URL', params);

    var count = 0;
    var topic = 'routes.entryRetrieved';

    if (params.model) {
        count += 1;
        Database.getEntry(params.model, function (data) {
            if (data) {
                dev.MODEL = new DBObject(data);
            }
            else {
                console.error('Failed to load MODEL from URL ' + params.model);
                location.hash = '#/';
            }
            Utils.PubSub.publish(topic);
        });
    }

    if (params.tx) {
        count += 1;
        Database.getEntry(params.tx, function (data) {
            if (data) {
                dev.TX = new DBObject(data);
            }
            else {
                console.error('Failed to load TX from URL ' + params.model);
                location.hash = '#/';
            }
            Utils.PubSub.publish(topic);
        });
    }

    function entryRetrievedCallback() {
        count = count - 1;
        if (count) {
            return;
        }

        Utils.PubSub.removeTopic(topic);

        // Initialization complete: Launch the page matching location.hash
        Path.listen();
    }

    Utils.PubSub.subscribe(topic, entryRetrievedCallback);
}

function databaseReady() {
    console.log('routes: Database ready');

    var matching_path = Path.match(location.hash, true);
    if (matching_path  &&  (matching_path.params.model  ||  matching_path.params.tx)) {
        loadDevicesFromURL(matching_path.params);
        return;
    }

    // Initialization complete: Launch the page matching location.hash
    Path.listen();
}




for (var path in routes) {
    if (routes.hasOwnProperty(path)) {
        Path.map(path).to(redirect(routes[path]));
    }
}
Path.root('#/');

if (Database.isReady()) {
    databaseReady();
}
else {
    Utils.PubSub.subscribe('databaseReady', databaseReady);
}

