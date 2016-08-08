'use strict';

var Utils = require('./utils');
var MDLHelper = require('./mdl_helper');


class LogicalInputs {
  constructor() {
    this.template = document.querySelector('#app-logical_inputs-template').content;
    this.list = document.querySelector('#app-logical_inputs-list');
    this.cardAddLogicalInput = document.querySelector('#app-logical_inputs-add');
  }

  //*************************************************************************
  init(params) {
    this._populateLogicalInputsList();

    Utils.showPage('logical_inputs');
  }

  //*************************************************************************
  back() {
    history.back();
  }

  //*************************************************************************
  add(event) {
    Utils.cancelBubble(event);
    console.log('LogicalInputs.add()')
  }

  //*************************************************************************
  editType(event) {
    Utils.cancelBubble(event);
    console.log('LogicalInputs.editType()')
  }

  //*************************************************************************
  editSubType(event) {
    Utils.cancelBubble(event);
    console.log('LogicalInputs.editSubType()')
  }

  //*************************************************************************
  editHardwareInputs(event) {
    Utils.cancelBubble(event);
    console.log('LogicalInputs.editHardwareInputs()')
  }

  //*************************************************************************
  editLabels(event) {
    Utils.cancelBubble(event);
    console.log('LogicalInputs.editLabels()')
  }

  //*************************************************************************
  delete(event) {
    Utils.cancelBubble(event);
    console.log('LogicalInputs.delete()')
  }

  //*************************************************************************
  _populateLogicalInputsList() {
    let mdl = new MDLHelper('TX');
    let tx = Device.TX;
    let schema = tx.getSchema();
    let hardwareInputsSize = schema.HARDWARE_INPUTS.s;
    let logicalInputs = schema.LOGICAL_INPUTS;
    let logicalInputsLabels = schema.LOGICAL_INPUTS_LABELS;

    this.logicalInputsMaxCount = logicalInputs.c;
    this.logicalInputsSize = logicalInputs.s;

    // Empty the list of mixers
    Utils.clearDynamicElements(this.list);

    for (let i = 0; i < this.logicalInputsMaxCount; i++) {
      let offset = i * this.logicalInputsSize;
      let type = tx.getItemNumber('LOGICAL_INPUTS_TYPE', {offset: offset});

      if (type === 0) {
        continue;
      }

      mdl.offset = offset;

      let t = this.template;
      t.querySelector('section').classList.add('can-delete');
      mdl.setTextContent('.app-logical_inputs-template--type div', 'LOGICAL_INPUTS_TYPE', t);
      mdl.setTextContent('.app-logical_inputs-template--sub_type div', 'LOGICAL_INPUTS_SUB_TYPE', t);
      mdl.setTextContent('.app-logical_inputs-template--position_count div', 'LOGICAL_INPUTS_POSITION_COUNT', t);

      let labels = [];
      for (let j = 0; j < logicalInputsLabels.c; j++) {
        let l = tx.getItem('LOGICAL_INPUTS_LABELS', {offset: offset, index: j});
        if (l !== 0) {
          labels.push(l);
        }
      }
      mdl.setTextContentRaw('.app-logical_inputs-template--labels div', labels.sort().join(', '), t);

      // FIXME: set slider according to current number of switch positions
      // FIXME: when the position count slider is updated, update the position count number too
      // FIXME: when selecting a new logical input type, adjust all other parameters to be correct (e.g. hw inputs)
      // FIXME: suitable HW inputs depend on the logical input type
      // FIXME: number of HW inputs depends on the logical input type, sub type, and position count
      // FIXME: Even though it is not needed, shift elements down when deleting logical inputs
      // FIXME: show ADD card only when emtpy slots available

      let hardwareInputsCount = Device.getNumberOfHardwareInputs(offset);
      let hardwareInputs = [];
      for (let j = 0; j < hardwareInputsCount; j++) {
        let hw = tx.getItem('LOGICAL_INPUTS_HARDWARE_INPUTS', {offset: offset, index: j});
        let pinName = tx.getItem('HARDWARE_INPUTS_PCB_INPUT_PIN_NAME', {offset: hw * hardwareInputsSize});
        hardwareInputs.push(pinName);
      }
      mdl.setTextContentRaw('.app-logical_inputs-template--hardware_inputs div', hardwareInputs.join(', '), t);

      Utils.setVisibility('.app-logical_inputs-template--sub_type', type === 2, t);
      Utils.setVisibility('.app-logical_inputs-template--position_count', (type >= 2 && type <= 4), t);

      let clone = document.importNode(t, true);
      this.list.insertBefore(clone, this.cardAddLogicalInput);
    }
  }
}

window['LogicalInputs'] = new LogicalInputs();
