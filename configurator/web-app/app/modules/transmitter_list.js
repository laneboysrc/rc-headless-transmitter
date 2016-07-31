'use strict';

var Utils = require('./utils');

class TransmitterList {
  constructor () {
    // Nothing to do
  }

  //*************************************************************************
  init (params) {
    Utils.showPage('transmitter_list');
  }

  //*************************************************************************
  back (params) {
    history.back();
  }
}

window['TransmitterList'] = new TransmitterList();
