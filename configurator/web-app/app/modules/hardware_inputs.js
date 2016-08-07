'use strict';

var Utils = require('./utils');

class HardwareInputs {
  constructor() {
    // Nothing to do
  }

  //*************************************************************************
  init(params) {
    Utils.showPage('hardware_inputs');
  }

  //*************************************************************************
  back() {
    history.back();
  }
}

window['HardwareInputs'] = new HardwareInputs();
