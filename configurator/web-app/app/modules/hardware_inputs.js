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

      let t = document.importNode(this.template, true);
      mdl.offset = offset;

      t.querySelector('section').classList.add('can-delete');
      mdl.setTextContent('.mdl-card__title-text', 'HARDWARE_INPUTS_PCB_INPUT_PIN_NAME', t);
      mdl.setTextContent('button', 'HARDWARE_INPUTS_TYPE', t);
      mdl.setAttribute('button', 'data-index', i, t);

      Utils.setVisibility('.app-hardware_inputs__analog', pcbInputType === 1, t);
      Utils.setVisibility('.app-hardware_inputs__digital', pcbInputType === 2, t);

      this.list.appendChild(t);
    }

    Utils.showPage('hardware_inputs');
  }

  //*************************************************************************
  back() {
    history.back();
  }

  //*************************************************************************
  selectType(event) {
    Utils.cancelBubble(event);
    let hardwareInputIndex = parseInt(event.target.getAttribute('data-index'));

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
}

window['HardwareInputs'] = new HardwareInputs();
