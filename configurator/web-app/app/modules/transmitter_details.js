'use strict';

var Utils = require('./utils');


class TransmitterDetails {
  constructor() {
    // Nothing to do
  }

  //*************************************************************************
  init(params) {
    Utils.showPage('transmitter_details');
  }

  //*************************************************************************
  back() {
    history.back();
  }

  //*************************************************************************
  getActiveItems(relatedItem) {
    let result = new Set();

    if (! Device.TX) {
      return result;
    }

    if (relatedItem !== 'MIXER_UNITS_SRC') {
      return result;
    }

    let schema = Device.TX.getSchema();
    let count = schema.LOGICAL_INPUTS.c;
    let size = schema.LOGICAL_INPUTS.s;

    for (let i = 0; i < count; i++) {
      let offset = i * size;
      let labels = Device.TX.getItem('LOGICAL_INPUTS_LABELS', {offset: offset});
      labels.forEach(label => {
        result.add(label);
      });
    }

    return result;
  }
}

window['TransmitterDetails'] = new TransmitterDetails();