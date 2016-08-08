'use strict';

var Utils = require('./utils');


class LogicalInputs {
  constructor() {
    // Nothing to do
  }

  //*************************************************************************
  init(params) {
    Utils.showPage('logical_inputs');
  }

  //*************************************************************************
  back() {
    history.back();
  }
}

window['LogicalInputs'] = new LogicalInputs();
