'use strict';

var Utils = require('./utils');
var MDLHelper = require('./mdl_helper');

class ModelDetails {
  constructor() {
    // Nothing to do
  }

  //*************************************************************************
  init(params) {
    let mdl = new MDLHelper('MODEL');

    mdl.setTextfield('#app-model_details-name', 'NAME');
    mdl.setDataURL('#app-model_details-mixer', ['mixer']);
    mdl.setDataURL('#app-model_details-rf_protocol', ['rf_protocol']);
    mdl.setIcon('#app-model_details-icon');

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
  back() {
    history.back();
  }

  //*************************************************************************
  changeModel(event) {
    Utils.cancelBubble(event);
    location.hash = Utils.buildURL(['model_list']);
  }

  //*************************************************************************
  selectIcon(event) {
    Utils.cancelBubble(event);
    console.log('ModelDetails.selectIcon()')

    location.hash = Utils.buildURL(['select_icon', 'MODEL', 'TAG', 0]);
  }

  //*************************************************************************
  deleteModel(event) {
    Utils.cancelBubble(event);

    ModelList.deleteModel(Device.MODEL);
    Device.MODEL = undefined;
    history.back();
  }
}

window['ModelDetails'] = new ModelDetails();
