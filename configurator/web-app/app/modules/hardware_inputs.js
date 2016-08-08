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
      let pcbInputType = tx.getItem('HARDWARE_INPUTS_PCB_INPUT_TYPE', {offset: offset});

      if (pcbInputType === 0) {
        continue;
      }

      let numericPcbInputType = tx.getNumberOfTypeMember('HARDWARE_INPUTS_PCB_INPUT_TYPE', pcbInputType);
      let t = this.template;

      mdl.offset = offset;

      t.querySelector('section').classList.add('can-delete');
      mdl.setTextContent('.mdl-card__title-text', 'HARDWARE_INPUTS_PCB_INPUT_PIN_NAME', t);
      mdl.setTextContent('button', 'HARDWARE_INPUTS_TYPE', t);
      mdl.setAttribute('button', 'data-index', i, t);

      Utils.setVisibility('.app-hardware_inputs__analog', numericPcbInputType === 1, t);
      Utils.setVisibility('.app-hardware_inputs__digital', numericPcbInputType === 2, t);

      let clone = document.importNode(t, true);
      this.list.appendChild(clone);
    }

    Utils.showPage('hardware_inputs');
  }

  //*************************************************************************
  selectType(event) {
    Utils.cancelBubble(event);
    let hardwareInputIndex = parseInt(event.target.getAttribute('data-index'));

    console.log('HardwareInputs.selectType()', hardwareInputIndex)
  }

  //*************************************************************************
  back() {
    history.back();
  }
}

window['HardwareInputs'] = new HardwareInputs();
