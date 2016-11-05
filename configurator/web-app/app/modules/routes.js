'use strict';

var Utils = require('./utils');
var Path = require('./path');
var DatabaseObject = require('./database_object');


var routes = {
    // path: name
    '#/': Main,
    '#/about': About,
    '#/device_list': DeviceList,
    '#/edit_curve/:offset/m/:model(/t/:tx)': EditCurve,
    '#/edit_switch/:offset/m/:model(/t/:tx)': EditSwitch,
    '#/hardware_inputs/m/:model/t/:tx': HardwareInputs,
    '#/hardware_inputs/t/:tx': HardwareInputs,
    '#/hardware_inputs_order/:item/:offset/m/:model/t/:tx': HardwareInputsOrder,
    '#/hardware_inputs_order/:item/:offset/t/:tx': HardwareInputsOrder,
    '#/limits/:channel/m/:model(/t/:tx)': Limits,
    '#/logical_inputs/m/:model/t/:tx': LogicalInputs,
    '#/logical_inputs/t/:tx': LogicalInputs,
    '#/mixer/m/:model(/t/:tx)': Mixer,
    '#/mixer_unit/:index/m/:model(/t/:tx)': MixerUnit,
    '#/model_details/m/:model(/t/:tx)': ModelDetails,
    '#/model_list': ModelList,
    '#/model_list/m/:model(/t/:tx)': ModelList,
    '#/rf_protocol/m/:model(/t/:tx)': RFProtocol,
    '#/transmitter_details/m/:model/t/:tx': TransmitterDetails,
    '#/transmitter_details/t/:tx': TransmitterDetails,
    '#/transmitter_list': TransmitterList,
    '#/settings': Settings,

    // We need two entries to be able to match the four combinations of
    // uuid availability (none, model, tx, model+tx)
    '#/select_multiple/:devName/:item/:offset(/t/:tx)': SelectMultiple,
    '#/select_multiple/:devName/:item/:offset/m/:model(/t/:tx)': SelectMultiple,
    '#/select_single/:devName/:item/:offset(/t/:tx)': SelectSingle,
    '#/select_single/:devName/:item/:offset/m/:model(/t/:tx)': SelectSingle,
    '#/select_icon/:devName/:item/:offset(/t/:tx)': SelectIcon,
    '#/select_icon/:devName/:item/:offset/m/:model(/t/:tx)': SelectIcon,
};


function loadDevicesFromURL(params) {
    console.log('Loading devices specified in URL', params);

    let count = 0;
    let topic = 'routes.entryRetrieved';

    if (params.model) {
        ++count;
        Database.getEntry(params.model, function (data) {
            if (data) {
                Device.MODEL = new DatabaseObject(data);
            }
            else {
                console.error('Failed to load MODEL from URL ' + params.model);
                Utils.rollbackHistoryToRoot();
                location.hash = '#/';
            }
            Utils.PubSub.publish(topic);
        });
    }

    if (params.tx) {
        ++count;
        Database.getEntry(params.tx, function (data) {
            if (data) {
                Device.TX = new DatabaseObject(data);
            }
            else {
                console.error('Failed to load TX from URL ' + params.model);
                Utils.rollbackHistoryToRoot();
                location.hash = '#/';
            }
            Utils.PubSub.publish(topic);
        });
    }

    function entryRetrievedCallback() {
        --count;
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

    let matching_path = Path.match(location.hash, true);
    if (matching_path  &&  (matching_path.params.model  ||  matching_path.params.tx)) {
        // If both model and tx are present then we must have been connected
        // when the page was reloaded. Since we can not automatically reconnect
        // we throw the user back to the device list.
        if (matching_path.params.model  &&  matching_path.params.tx) {
            Utils.rollbackHistoryToRoot();
            // We need to do history.pushState here, as otherwise things
            // misbehave on Chrome.
            history.pushState(null, '', '#/device_list');
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


for (let path in routes) {
    if (routes.hasOwnProperty(path)) {
        Path.map(path).to(redirect(routes[path]));
    }
}

// Instead of Path.root we use history.replaceState, as otherwise we get an
// additional history entry.
// Path.root('/');
console.log(`ROUTE START: history.length=${history.length}, location.hash=${location.hash}`)
if (location.hash === ""  ||  location.hash === "#") {
    history.replaceState(null, '', '#/');
}


if (Database.isReady()) {
    databaseReady();
}
else {
    Utils.PubSub.subscribe('databaseReady', databaseReady);
}


