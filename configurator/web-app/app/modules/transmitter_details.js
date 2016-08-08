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

  //*************************************************************************
  getActiveItems(item) {
    let result = [];

    if (! Device.TX) {
      return result;
    }

    if (item !== 'MIXER_UNITS_SRC') {
      return result;
    }

    let schema = Device.TX.getSchema();
    let count = schema.LOGICAL_INPUTS.c;
    let size = schema.LOGICAL_INPUTS.s;

    for (let i = 0; i < count; i++) {
      let offset = i * size;
      let labels = Device.TX.getItem('LOGICAL_INPUTS_LABELS', {offset: offset});
      for (let j = 0; j < labels.length; j++) {
        result.push(labels[j]);
      }
    }

    return result;
  }

  //*************************************************************************
  overrideType(item, offset) {
    if (! Device.TX) {
      return [];
    }

    if (item !== 'HARDWARE_INPUTS_TYPE') {
      return [];
    }

    let pcbInputType = Device.TX.getItem('HARDWARE_INPUTS_PCB_INPUT_TYPE', {offset: offset});
    let numericPcbInputType = Device.TX.getNumberOfTypeMember('HARDWARE_INPUTS_PCB_INPUT_TYPE', pcbInputType);
    if (numericPcbInputType === 2) {
      return Device.TX.getTypeMembers('hardware_input_type_t_digital');
    }

    return [];
  }
}

window['TransmitterDetails'] = new TransmitterDetails();
