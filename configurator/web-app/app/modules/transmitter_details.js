'use strict';

var Utils = require('./utils');
var MDLHelper = require('./mdl_helper');


function passphraseFormatter(passphrase) {
  let s = passphrase.toString();

  while (s.length < 4) {
    s = '0' + s;
  }
  return s;
}


class TransmitterDetails {
  constructor() {
    // Nothing to do
  }

  //*************************************************************************
  init(params) {
    let mdl = new MDLHelper('TX');

    mdl.setTextfield('#app-transmitter_details-name', 'NAME');
    mdl.setSlider('#app-transmitter_details-trim_range', 'TRIM_RANGE');
    mdl.setSlider('#app-transmitter_details-trim_step_size', 'TRIM_STEP_SIZE');

    mdl.formatter = passphraseFormatter;
    mdl.setTextfield('#app-transmitter_details-passphrase', 'PASSPHRASE');

    mdl.setDataURL('#app-transmitter_details-hardware', ['hardware_inputs']);
    mdl.setDataURL('#app-transmitter_details-logical', ['logical_inputs']);

    // Only show the passphrase card when we are connected to a transmitter.
    Utils.setVisibility('#app-transmitter_details-passphrase-card', params.model);

    Utils.showPage('transmitter_details');
  }

  //*************************************************************************
  back() {
    history.back();
  }

  //*************************************************************************
  delete(event) {
    Utils.cancelBubble(event);

    TransmitterList.deleteTransmitter(Device.TX);
    Device.TX = undefined;
    history.back();
  }
}

window['TransmitterDetails'] = new TransmitterDetails();
