'use strict';

var Utils = require('./utils');
var MDLHelper = require('./mdl_helper');

class ModelDetails {
  constructor () {
    // Nothing to do
  }

  //*************************************************************************
  init (params) {
    let mdl = new MDLHelper('MODEL');

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
  }

  //*************************************************************************
  back (params) {
    history.back();
  }

  //*************************************************************************
  changeModel (event) {
    location.hash = Utils.buildURL(['model_list']);
  }

  //*************************************************************************
  deleteModel (event) {
    Utils.cancelBubble(event);

    ModelList.deleteModel(dev.MODEL);
    dev.MODEL = undefined;
    history.back();
  }
}

window['ModelDetails'] = new ModelDetails();
