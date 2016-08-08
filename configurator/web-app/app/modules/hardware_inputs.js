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
    mdl.clearDynamicElements(this.list);

    for (let i = 0; i < count; i++) {
      let offset = i * size;

      mdl.offset = offset;

      let pcbInputType = tx.getItem('HARDWARE_INPUTS_PCB_INPUT_TYPE', {offset: offset});
      let numericPcbInputType = tx.getNumberOfTypeMember('HARDWARE_INPUTS_PCB_INPUT_TYPE', pcbInputType);
      console.log(`pcbInputType: ${numericPcbInputType}`)

      if (pcbInputType === 0) {
        continue;
      }

      let t = this.template;
      t.querySelector('section').classList.add('can-delete');
      mdl.setTextContent('.mdl-card__title-text', 'HARDWARE_INPUTS_PCB_INPUT_PIN_NAME', t);
      mdl.setTextContent('button', 'HARDWARE_INPUTS_TYPE', t);
      mdl.setAttribute('button', 'data-index', i, t);

      if (numericPcbInputType === 1) {
        t.querySelector('.app-hardware_inputs__analog').classList.remove('hidden');
        t.querySelector('.app-hardware_inputs__digital').classList.add('hidden');
      }
      else {
        t.querySelector('.app-hardware_inputs__digital').classList.remove('hidden');
        t.querySelector('.app-hardware_inputs__analog').classList.add('hidden');
      }

      let clone = document.importNode(t, true);
      this.list.appendChild(clone);
    }


    Utils.showPage('hardware_inputs');
  }

  //*************************************************************************
  selectType(event) {
    Utils.cancelBubble(event);
    console.log('HardwareInputs.selectType()')
  }

  //*************************************************************************
  back() {
    history.back();
  }
}

window['HardwareInputs'] = new HardwareInputs();
