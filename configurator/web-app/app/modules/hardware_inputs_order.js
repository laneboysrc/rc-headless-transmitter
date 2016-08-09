'use strict';

var Utils = require('./utils');
var MDLHelper = require('./mdl_helper');


class HardwareInputsOrder {
  constructor() {
    this.template = document.querySelector('#app-hardware_inputs_order-template').content;
    this.list = document.querySelector('#app-hardware_inputs_order-list');

    this.offset = 0;
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
  up(event, button) {
    Utils.cancelBubble(event);

    // let mixerUnitIndex = parseInt(button.getAttribute('data-index'));

    // // Safety bail-out
    // if (mixerUnitIndex < 1) {
    //   return;
    // }

    // this._swap(mixerUnitIndex, mixerUnitIndex - 1);
  }

  //*************************************************************************
  down(event, button) {
    Utils.cancelBubble(event);

    // let mixerUnitIndex = parseInt(button.getAttribute('data-index'));

    // // Safety bail-out
    // if (mixerUnitIndex >= (this.mixerUnitCount - 1)) {
    //   return;
    // }

    // this._swap(mixerUnitIndex, mixerUnitIndex + 1);
  }

  //*************************************************************************
  _populateHardwareInputsList() {
    let mdl = new MDLHelper('TX', {offset: this.offset});

    Utils.clearDynamicElements(this.list);

    let hardwareInputsCount = Device.getNumberOfHardwareInputs(this.offset);
    let hardwareInputsSize = this.schema.HARDWARE_INPUTS.s;

    for (let j = 0; j < hardwareInputsCount; j++) {
      let t = document.importNode(this.template, true);
      let pinName = Device.TX.getItem('LOGICAL_INPUTS_HARDWARE_INPUTS', {offset: this.offset, index: j});
      let hw = Device.TX.getItemNumber('LOGICAL_INPUTS_HARDWARE_INPUTS', {offset: this.offset, index: j});
      let hardwareInputType = Device.TX.getItemNumber('HARDWARE_INPUTS_TYPE', {offset: hw * hardwareInputsSize});

      mdl.setTextContentRaw('.app-hardware_inputs_order-template-name', pinName, t);

      if (! Device.isValidHardwareType(hardwareInputType)) {
        t.querySelector('.app-hardware_inputs_order-template-name').classList.add('error');
      }

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
    // let model = Device.MODEL;

    // let unit1 = model.getItem('MIXER_UNITS', {index: index1});
    // let unit2 = model.getItem('MIXER_UNITS', {index: index2});

    // model.setItem('MIXER_UNITS', unit2, {index: index1});
    // model.setItem('MIXER_UNITS', unit1, {index: index2});

    // // Rebuild the list of mixer units
    // this._populateHardwareInputsList();
  }

}

  window['HardwareInputsOrder'] = new HardwareInputsOrder();
