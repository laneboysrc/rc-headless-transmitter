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

  //*************************************************************************
  add(event) {
    Utils.cancelBubble(event);
    console.log('LogicalInputs.add()')
  }
}

window['LogicalInputs'] = new LogicalInputs();
