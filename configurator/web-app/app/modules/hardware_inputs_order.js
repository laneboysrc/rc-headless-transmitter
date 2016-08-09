'use strict';

var Utils = require('./utils');
var MDLHelper = require('./mdl_helper');


class HardwareInputsOrder {
  constructor() {
    this.template = document.querySelector('#app-hardware_inputs_order-template').content;
    this.list = document.querySelector('#app-hardware_inputs_order-list');

    this.offset = 0;
    this.hardwareInputsCount = 0;
  }

  //*************************************************************************
  init(params) {
    this.offset = parseInt(params.offset);
    this.schema = Device.TX.getSchema();

    this._populateHardwareInputsList();

    Utils.showPage('hardware_inputs_order');
  }

  //*************************************************************************
  back() {
    history.back();
  }

  //*************************************************************************
  edit(event) {
    Utils.cancelBubble(event);

    location.hash = Utils.buildURL(['select_multiple', 'TX', 'LOGICAL_INPUTS_HARDWARE_INPUTS', this.offset]);
  }

  //*************************************************************************
  up(event) {
    Utils.cancelBubble(event);

    let index = parseInt(event.target.getAttribute('data-index'));

    // Safety bail-out
    if (index < 1) {
      return;
    }

    this._swap(index, index - 1);
  }

  //*************************************************************************
  down(event) {
    Utils.cancelBubble(event);

    let index = parseInt(event.target.getAttribute('data-index'));

    // Safety bail-out
    if (index >= (this.hardwareInputsCount - 1)) {
      return;
    }

    this._swap(index, index + 1);
  }

  //*************************************************************************
  _populateHardwareInputsList() {
    let mdl = new MDLHelper('TX', {offset: this.offset});

    Utils.clearDynamicElements(this.list);

    this.hardwareInputsCount = Device.getNumberOfHardwareInputs(this.offset);
    let hardwareInputsSize = this.schema.HARDWARE_INPUTS.s;

    for (let i = 0; i < this.hardwareInputsCount; i++) {
      let t = document.importNode(this.template, true);
      let pinName = Device.TX.getItem('LOGICAL_INPUTS_HARDWARE_INPUTS', {offset: this.offset, index: i});
      let hw = Device.TX.getItemNumber('LOGICAL_INPUTS_HARDWARE_INPUTS', {offset: this.offset, index: i});
      let hardwareInputType = Device.TX.getItemNumber('HARDWARE_INPUTS_TYPE', {offset: hw * hardwareInputsSize});

      mdl.setTextContentRaw('.app-hardware_inputs_order-template-name', pinName, t);

      if (! Device.isValidHardwareType(hardwareInputType)) {
        t.querySelector('.app-hardware_inputs_order-template-name').classList.add('error');
      }
      mdl.setAttribute('.app-hardware_inputs_order-template-up', 'data-index', i, t);
      mdl.setAttribute('.app-hardware_inputs_order-template-down', 'data-index', i, t);

      this.list.appendChild(t);
    }

    this._updateUpDownButtonVisibility();
  }

  //*************************************************************************
  _updateUpDownButtonVisibility() {
    // Enable all but the first up button
    let up = document.querySelectorAll('.app-hardware_inputs_order-template-up');
    for (let i = 0; i < up.length; i++) {
      up[i].disabled = (i === 0);
    }

    // Enable all but the last down button
    let down = document.querySelectorAll('.app-hardware_inputs_order-template-down');
    for (let i = 0; i < down.length; i++) {
      down[i].disabled = (i === (down.length - 1));
    }
  }

  //*************************************************************************
  _swap(index1, index2) {
    let hardwareInputs = Device.TX.getItem('LOGICAL_INPUTS_HARDWARE_INPUTS', {offset: this.offset});

    let input1 = hardwareInputs[index1];
    let input2 = hardwareInputs[index2];
    hardwareInputs[index1] = input2;
    hardwareInputs[index2] = input1;

    Device.TX.setItem('LOGICAL_INPUTS_HARDWARE_INPUTS', hardwareInputs, {offset: this.offset});

    // Rebuild the list of hardware inputs
    this._populateHardwareInputsList();
  }

}

  window['HardwareInputsOrder'] = new HardwareInputsOrder();
