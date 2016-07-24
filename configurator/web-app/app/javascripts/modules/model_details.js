'use strict';

var Utils       = require('./utils');
var MDLHelper   = require('./mdl_helper');


var ModelDetails = function () { };

//*************************************************************************
ModelDetails.prototype.init = function (params) {
    var mdl = new MDLHelper('MODEL');

    mdl.setTextfield('#app-model_details-name', 'NAME');
    mdl.setDataURL('#app-model_details-mixer', ['mixer']);
    mdl.setDataURL('#app-model_details-rf_protocol', ['rf_protocol']);

    // Show/hide the menu depending on whether tx_uuid is undefined
    console.log(params)
    if (params.tx) {
        Utils.removeClassFromSelector('.app-model_details--transmitter', 'hidden');
    }
    else {
        Utils.addClassToSelector('.app-model_details--transmitter', 'hidden');
    }

    Utils.showPage('model_details');
};

window['ModelDetails'] = new ModelDetails();
