'use strict';

var Utils       = require('./utils');
var Path        = require('./path');
var DBObject    = require('./database_object');


var routes = {
    // path: name
    '#/': Main,
    '#/about': function () { Utils.showPage('about'); },
    '#/device_list': DeviceList,
    '#/edit_curve/:offset/m/:model(/t/:tx)': EditCurve,
    '#/edit_switch/:offset/m/:model(/t/:tx)': EditSwitch,
    '#/limits/:channel/m/:model(/t/:tx)': Limits,
    '#/mixer/m/:model(/t/:tx)': Mixer,
    '#/mixer_unit/:index/m/:model(/t/:tx)': MixerUnit,
    '#/model_details/m/:model(/t/:tx)': ModelDetails,
    '#/model_list/m/:model(/t/:tx)': ModelList,
    '#/model_list': ModelList,
    '#/rf_protocol/m/:model(/t/:tx)': RFProtocol,
    '#/transmitter_list': TransmitterList,

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
                rollbackHistoryToRoot();
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
                rollbackHistoryToRoot();
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
        // If both model and tx are present then we must have been connected
        // when the page was reloaded. Since we can not automatically reconnect
        // we throw the user back to the device list.
        if (matching_path.params.model  &&  matching_path.params.tx) {
            rollbackHistoryToRoot();
            location.hash = '#/device_list';
            Path.listen();
        }
        else {
            loadDevicesFromURL(matching_path.params);
        }
        return;
    }

    // Initialization complete: Launch the page matching location.hash
    Path.listen();
}

function rollbackHistoryToRoot() {
    for (let i = 0; i < history.length; i++) {
        if (location.hash === '#/') {
            return;
        }
        history.back();
    }
    history.replaceState(null, '', '#/');
    location.hash = '#/';
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

