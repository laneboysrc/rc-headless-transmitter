'use strict';

var Utils = require('./utils');
var MDLHelper = require('./mdl_helper');


class TransmitterDetails {
  constructor() {
    // Nothing to do
  }

  //*************************************************************************
  init(params) {
    let mdl = new MDLHelper('TX');

    mdl.setTextfield('#app-transmitter_details-name', 'NAME');
    mdl.setDataURL('#app-transmitter_details-hardware', ['hardware_inputs']);
    mdl.setDataURL('#app-transmitter_details-logical', ['logical_inputs']);

    Utils.showPage('transmitter_details');
  }

  //*************************************************************************
  back() {
    history.back();
  }
}

window['TransmitterDetails'] = new TransmitterDetails();
