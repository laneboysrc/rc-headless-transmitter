'use strict';

var Utils       = require('./utils');
var MDLHelper   = require('./mdl_helper');


var ModelDetails = function () { };

//*************************************************************************
ModelDetails.prototype.init = function (params) {
    var mdl = new MDLHelper('MODEL');

    // Note: we could have reached here after loading a new model, so we fix
    // the URL.
    history.replaceState(null, '', Utils.buildURL(['model_details']));

    mdl.setTextfield('#app-model_details-name', 'NAME');
    mdl.setDataURL('#app-model_details-mixer', ['mixer']);
    mdl.setDataURL('#app-model_details-rf_protocol', ['rf_protocol']);

    // Show/hide the menu depending on whether tx_uuid is undefined
    if (params.tx) {
        Utils.removeClassFromSelector('.app-model_details--transmitter', 'hidden');
        Utils.addClassToSelector('.app-model_details--no-transmitter', 'hidden');
    }
    else {
        Utils.addClassToSelector('.app-model_details--transmitter', 'hidden');
        Utils.removeClassFromSelector('.app-model_details--no-transmitter', 'hidden');
    }

    Utils.showPage('model_details');
};

//*************************************************************************
ModelDetails.prototype.back = function (params) {
    history.back();
};

//*************************************************************************
ModelDetails.prototype.changeModel = function () {
    location.hash = Utils.buildURL(['model_list']);
};

window['ModelDetails'] = new ModelDetails();
