'use strict';

var Utils = require('./utils');
var MDLHelper = require('./mdl_helper');


class HardwareInputs {
  constructor() {
    this.template = document.querySelector('#app-hardware_inputs-template').content;
    this.list = document.querySelector('#app-hardware_inputs-list');
  }

  //*************************************************************************
  init(params) {
    let mdl = new MDLHelper('TX');
    let tx = Device.TX;

    let hardwareInputs = tx.getSchema()['HARDWARE_INPUTS'];
    let count = hardwareInputs.c;
    let size = hardwareInputs.s;

    // Empty the list of mixers
    Utils.clearDynamicElements(this.list);

    for (let i = 0; i < count; i++) {
      let offset = i * size;
      let pcbInputType = tx.getItemNumber('HARDWARE_INPUTS_PCB_INPUT_TYPE', {offset: offset});

      if (pcbInputType === 0) {
        continue;
      }

      let hardwareInputType = tx.getItemNumber('HARDWARE_INPUTS_TYPE', {offset: offset});

      let t = document.importNode(this.template, true);
      mdl.offset = offset;

      mdl.setTextContent('.mdl-card__title-text', 'HARDWARE_INPUTS_PCB_INPUT_PIN_NAME', t);
      mdl.setTextContent('.app-hardware_inputs-type', 'HARDWARE_INPUTS_TYPE', t);
      mdl.setAttribute('.app-hardware_inputs-type', 'data-index', i, t);

      Utils.setVisibility('.app-hardware_inputs__analog', pcbInputType === 1, t);
      Utils.setVisibility('.app-hardware_inputs__digital', pcbInputType === 2, t);


      let isAnalog = (hardwareInputType >= 1  &&  hardwareInputType <= 4);
      let isAnalogWithCenter = (hardwareInputType >= 1  &&  hardwareInputType <= 2);
      let canCalibrate = Device.MODEL && isAnalog;
      canCalibrate = true;

      Utils.setVisibility('.app-hardware_inputs-calibrate', canCalibrate, t);
      Utils.setVisibility('.app-hardware_inputs-calibrate__left', isAnalog, t);
      Utils.setVisibility('.app-hardware_inputs-calibrate__center', isAnalogWithCenter, t);
      Utils.setVisibility('.app-hardware_inputs-calibrate__right', isAnalog, t);
      mdl.setAttribute('.app-hardware_inputs-calibrate__left', 'data-index', i, t);
      mdl.setAttribute('.app-hardware_inputs-calibrate__center', 'data-index', i, t);
      mdl.setAttribute('.app-hardware_inputs-calibrate__right', 'data-index', i, t);

      let progress = t.querySelector('.app-hardware_inputs-value');
      componentHandler.upgradeElement(progress);
      mdl.setAttribute('.app-hardware_inputs-value', 'data-index', i, t);
      progress.MaterialProgress.setProgress(50);

      this.list.appendChild(t);
    }

    Utils.showPage('hardware_inputs');
  }

  //*************************************************************************
  back() {
    history.back();
  }

  //*************************************************************************
  selectType(event, button) {
    Utils.cancelBubble(event);
    let hardwareInputIndex = parseInt(button.getAttribute('data-index'));

    console.log('HardwareInputs.selectType()', hardwareInputIndex)

    // FIXME: if we change the hardware input type, how are logical inputs
    // affected?

    // Ensure the following rules (see architecture.md)
    // * Analog
    //     * Can only have a single Analog type *Hardware input* assigned
    // * Momentary
    //     * Can only have a single Momentary type *Hardware input* assigned
    // * Switches
    //     * n-position switch
    //         * Can have one or two Momentary type *Hardware input* assigned
    //         * n=3: can have a single 3-position switch *Hardware input* assigned
    //         * n=2,4..12 can have n on/off switch *Hardware input* assigned
    // * BCD switch n=2..4
    //     * Must have n on/off switch switch *Hardware input* assigned
    // * Trims
    //     * Can have a single Analog type *Hardware inputs* assigned (with or without detent, but must not be *Analog without center detent, positive only*)
    //     * Can have two Momentary type *Hardware inputs* assigned (up/down)

    let hardwareInputs = Device.TX.getSchema()['HARDWARE_INPUTS'];
    let offset = hardwareInputIndex * hardwareInputs.s;
    location.hash = Utils.buildURL(['select_single', 'TX', 'HARDWARE_INPUTS_TYPE', offset]);
  }

  //*************************************************************************
  calibrate(event, button, position) {
    Utils.cancelBubble(event);
    let hardwareInputIndex = parseInt(button.getAttribute('data-index'));

    console.log('HardwareInputs.calibrate()', hardwareInputIndex, position)

    switch (position) {
      case 'left':
        position = 0;
        break;

      case 'center':
        position = 1;
        break;

      case 'right':
        position = 2;
        break;

      default:
        console.log('HardwareInputs.calibrate(): unknown position value', position);
        break;
    }

    let hardwareInputs = Device.TX.getSchema()['HARDWARE_INPUTS'];
    let offset = hardwareInputIndex * hardwareInputs.s;
    let adcChannel = Device.TX.getItem('HARDWARE_INPUTS_PCB_INPUT_ADC_CHANNEL', {offset: offset});

    // Set current raw stick value as calibration
    let value = Device.getLiveValue(`ADC${adcChannel} (raw)`);
    if (value !== null) {
      let options = {offset: offset, index: position};
      Device.TX.setItem('HARDWARE_INPUTS_CALIBRATION', value, options);
    }
  }
}

window['HardwareInputs'] = new HardwareInputs();
