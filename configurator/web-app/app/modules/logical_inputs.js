'use strict';

var Utils = require('./utils');
var MDLHelper = require('./mdl_helper');


class LogicalInputs {
  constructor() {
    this.template = document.querySelector('#app-logical_inputs-template').content;
    this.list = document.querySelector('#app-logical_inputs-list');
    this.cardAddLogicalInput = document.querySelector('#app-logical_inputs-add');

    this.logicalInputsCount = 0;
    this.logicalInputsMaxCount = 0;
    this.schema = undefined;

    this.UNDO = undefined;
    this.snackbarMessage = document.querySelector('#app-logical_inputs-template__message').content.textContent;
    this.snackbarActionText = document.querySelector('#app-logical_inputs-template__action_text').content.textContent;
  }

  //*************************************************************************
  init() {
    this.schema = Device.TX.getSchema();
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

    let logicalInputs = this.schema.LOGICAL_INPUTS;
    let logicalInputsSize = logicalInputs.s;

    for (let i = 0; i < this.logicalInputsMaxCount; i++) {
      let offset = i * logicalInputsSize;
      let type = Device.TX.getItemNumber('LOGICAL_INPUTS_TYPE', {offset: offset});

      if (type === 0) {
        let type = Device.TX.getType('LOGICAL_INPUTS_TYPE');
        let typeValues = Device.TX.getTypeMembers(type);

        Device.TX.setItem('LOGICAL_INPUTS_TYPE', typeValues[0], {offset: offset});

        // Assign the first unused label
        let availableLabels = Device.getActiveItems('LOGICAL_INPUTS_LABELS', offset);
        let labels = Device.TX.getItem('LOGICAL_INPUTS_LABELS', {offset: offset});
        for (let j = 0; j < labels.length; j++) {
          labels[j] = (j === 0) ? availableLabels[0]: 0;
        }
        Device.TX.setItem('LOGICAL_INPUTS_LABELS', labels, {offset: offset});

        this._populateLogicalInputsList(true);
        return;
      }
    }
  }

  //*************************************************************************
  editType(event, button) {
    Utils.cancelBubble(event);

    let index = parseInt(button.getAttribute('data-index'));
    console.log('LogicalInputs.editType()', index)

    let size = this.schema.LOGICAL_INPUTS.s;
    let offset = index * size;
    location.hash = Utils.buildURL(['select_single', 'TX', 'LOGICAL_INPUTS_TYPE', offset]);
  }

  //*************************************************************************
  editSubType(event, button) {
    Utils.cancelBubble(event);

    let index = parseInt(button.getAttribute('data-index'));
    console.log('LogicalInputs.editSubType()', index)

    let size = this.schema.LOGICAL_INPUTS.s;
    let offset = index * size;
    location.hash = Utils.buildURL(['select_single', 'TX', 'LOGICAL_INPUTS_SUB_TYPE', offset]);
  }

  //*************************************************************************
  editHardwareInputs(event, button) {
    Utils.cancelBubble(event);

    let index = parseInt(button.getAttribute('data-index'));
    console.log('LogicalInputs.editHardwareInputs()', index)

    let size = this.schema.LOGICAL_INPUTS.s;
    let offset = index * size;
    location.hash = Utils.buildURL(['hardware_inputs_order', 'LOGICAL_INPUTS_HARDWARE_INPUTS', offset]);
  }

  //*************************************************************************
  editLabels(event, button) {
    Utils.cancelBubble(event);

    let index = parseInt(button.getAttribute('data-index'));
    console.log('LogicalInputs.editLabels()', index)

    let size = this.schema.LOGICAL_INPUTS.s;
    let offset = index * size;
    location.hash = Utils.buildURL(['select_multiple', 'TX', 'LOGICAL_INPUTS_LABELS', offset]);
  }

  //*************************************************************************
  delete(event, button) {
    Utils.cancelBubble(event);

    let index = parseInt(button.getAttribute('data-index'));
    console.log('LogicalInputs.delete()', index)

    this.UNDO = {
      index: index,
      data: Device.TX.getItem('LOGICAL_INPUTS', {index: index})
    };

    // Bring all mixer units behind 'index' forward
    let schema = Device.TX.getSchema();
    let offset = schema.LOGICAL_INPUTS.o;
    let size = schema.LOGICAL_INPUTS.s;

    let dst = offset + (index * size);
    let src = offset + ((index + 1) * size);
    let count = (this.logicalInputsMaxCount - 1 - index) * size;

    Device.TX.rawCopy(src, dst, count);

    // Make the last item to an unused mixer unit
    Device.TX.setItem('LOGICAL_INPUTS', new Uint8Array(size), {index: this.logicalInputsMaxCount - 1});

    this._populateLogicalInputsList();

    let data = {
      message: this.snackbarMessage,
      timeout: 5000,
      actionHandler: this._undoDelete.bind(this),
      actionText: this.snackbarActionText
    };
    Utils.showSnackbar(data);
  }

  //*************************************************************************
  _undoDelete() {
    console.log('_undoDelete')
    if (!this.UNDO) {
      return;
    }

    // Move units from this.UNDO.index on backwards
    let index = this.UNDO.index;
    let schema = Device.TX.getSchema();
    let offset = schema.LOGICAL_INPUTS.o;
    let size = schema.LOGICAL_INPUTS.s;

    let src = offset + (index * size);
    let dst = offset + ((index + 1) * size);
    let count = (this.logicalInputsMaxCount - 1 - index) * size;

    Device.TX.rawCopy(src, dst, count);

    // Put the deleted item back in place
    Device.TX.setItem('LOGICAL_INPUTS', this.UNDO.data, {index: index});

    this.UNDO = undefined;
    this._populateLogicalInputsList();
  }

  //*************************************************************************
  _populateLogicalInputsList(scrollToLast) {
    Utils.cancelSnackbar();

    let hardwareInputsSize = this.schema.HARDWARE_INPUTS.s;
    let logicalInputs = this.schema.LOGICAL_INPUTS;
    let logicalInputsLabels = this.schema.LOGICAL_INPUTS_LABELS;

    this.logicalInputsCount = 0;
    this.logicalInputsMaxCount = logicalInputs.c;
    let logicalInputsSize = logicalInputs.s;

    // Empty the list of mixers
    Utils.clearDynamicElements(this.list);

    let labelsSeen = [];

    for (let i = 0; i < this.logicalInputsMaxCount; i++) {
      let offset = i * logicalInputsSize;
      let type = Device.TX.getItemNumber('LOGICAL_INPUTS_TYPE', {offset: offset});

      if (type === 0) {
        continue;
      }

      let mdl = new MDLHelper('TX', {offset:  offset});
      let t = document.importNode(this.template, true);


      // Clamp positionCount to allowed range for switch and BCD switch
      let positionCount = Device.TX.getItem('LOGICAL_INPUTS_POSITION_COUNT', {offset: offset});
      if ([2, 3].includes(type)) {   // Switch, BCD switch
        let min = 2;
        let max = this.schema.LOGICAL_INPUTS_HARDWARE_INPUTS.c;

        if (type === 3) {  // BCD switch
          // Set the slider MAX to 4 if the logical input type is BCD switch
          max = 4;
        }

        t.querySelector('.app-logical_inputs-template--position_count input').setAttribute('MIN', min);
        t.querySelector('.app-logical_inputs-template--position_count input').setAttribute('MAX', max);

        // Keep the position count in range
        if (positionCount < min) {
          positionCount = min;
          Device.TX.setItem('LOGICAL_INPUTS_POSITION_COUNT', positionCount, {offset: offset});
        }
        else if (positionCount > max) {
          positionCount = max;
          Device.TX.setItem('LOGICAL_INPUTS_POSITION_COUNT', positionCount, {offset: offset});
        }
      }


      mdl.setTextContent('.app-logical_inputs-template--type div', 'LOGICAL_INPUTS_TYPE', t);
      mdl.setTextContent('.app-logical_inputs-template--sub_type div', 'LOGICAL_INPUTS_SUB_TYPE', t);
      mdl.setTextContent('.app-logical_inputs-template--position_count div', 'LOGICAL_INPUTS_POSITION_COUNT', t);
      mdl.setSlider('.app-logical_inputs-template--position_count input', 'LOGICAL_INPUTS_POSITION_COUNT', t);

      // Register onchange and oninput handlers to live-update switch position
      // related items
      let positionCountElement = t.querySelector('.app-logical_inputs-template--position_count div');
      t.querySelector('.app-logical_inputs-template--position_count input').addEventListener('change', this._onchange.bind(this, i));
      t.querySelector('.app-logical_inputs-template--position_count input').addEventListener('input', this._oninput.bind(this, i, positionCountElement));

      // Create individual <span> for the labels
      // This way we can mark duplicates
      let container = t.querySelector('.app-logical_inputs-template--labels div');
      for (let j = 0; j < logicalInputsLabels.c; j++) {
        let l = Device.TX.getItem('LOGICAL_INPUTS_LABELS', {offset: offset, index: j});
        if (l === 0) {
          break;
        }

        if (j) {
          container.appendChild(mdl.createSpan(', '));
        }

        let span = mdl.createSpan(l);

        // If the label was already used by another logical input than flag it
        if (labelsSeen.includes(l)) {
          span.classList.add('error');
        }
        labelsSeen.push(l);

        container.appendChild(span);
      }


      let firstHardwareInput = Device.TX.getItemNumber('LOGICAL_INPUTS_HARDWARE_INPUTS', {offset: offset, index: 0});
      let firstHardwareInputType = Device.TX.getItemNumber('HARDWARE_INPUTS_TYPE', {offset: firstHardwareInput * hardwareInputsSize});

      // Create individual <span> for the hardwareInputs
      // This way we can check if they fit the type/sub-type and mark them if
      // something is wrong
      let hardwareInputsCount = Device.getNumberOfHardwareInputs(offset);
      container = t.querySelector('.app-logical_inputs-template--hardware_inputs div');
      for (let j = 0; j < hardwareInputsCount; j++) {
        let pinName = Device.TX.getItem('LOGICAL_INPUTS_HARDWARE_INPUTS', {offset: offset, index: j});
        let hw = Device.TX.getItemNumber('LOGICAL_INPUTS_HARDWARE_INPUTS', {offset: offset, index: j});
        let hardwareInputType = Device.TX.getItemNumber('HARDWARE_INPUTS_TYPE', {offset: hw * hardwareInputsSize});

        if (j) {
          container.appendChild(mdl.createSpan(', '));
        }

        let span = mdl.createSpan(pinName);
        if (! Device.isValidHardwareType(hardwareInputType, offset)) {
          span.classList.add('error');
        }

        container.appendChild(span);
      }



      // Show subtype only if type==switch and firstHardwareInputType==Monentary
      Utils.setVisibility('.app-logical_inputs-template--sub_type', type === 2 && firstHardwareInputType === 7, t);
      // Show position count only if type==switch or type==BCD
      Utils.setVisibility('.app-logical_inputs-template--position_count', (type === 2 || type === 3), t);

      // Set the id and for attributes for all labels in the card
      mdl.setAttribute('.app-logical_inputs-template--labels div', 'id', 'app-logical_inputs--labels' + i, t);
      mdl.setAttribute('.app-logical_inputs-template--labels label', 'for', 'app-logical_inputs--labels' + i, t);
      mdl.setAttribute('.app-logical_inputs-template--position_count div', 'id', 'app-logical_inputs--position_count' + i, t);
      mdl.setAttribute('.app-logical_inputs-template--position_count label', 'for', 'app-logical_inputs--position_count' + i, t);
      mdl.setAttribute('.app-logical_inputs-template--type div', 'id', 'app-logical_inputs--type' + i, t);
      mdl.setAttribute('.app-logical_inputs-template--type label', 'for', 'app-logical_inputs--type' + i, t);
      mdl.setAttribute('.app-logical_inputs-template--sub_type div', 'id', 'app-logical_inputs--sub_type' + i, t);
      mdl.setAttribute('.app-logical_inputs-template--sub_type label', 'for', 'app-logical_inputs--sub_type' + i, t);
      mdl.setAttribute('.app-logical_inputs-template--hardware_inputs div', 'id', 'app-logical_inputs--sub_type' + i, t);
      mdl.setAttribute('.app-logical_inputs-template--hardware_inputs label', 'for', 'app-logical_inputs--sub_type' + i, t);

      // Let the button handler know which logical input index the card belongs to
      mdl.setAttribute('.app-logical_inputs-template--labels button', 'data-index', i, t);
      mdl.setAttribute('.app-logical_inputs-template--type button', 'data-index', i, t);
      mdl.setAttribute('.app-logical_inputs-template--sub_type button', 'data-index', i, t);
      mdl.setAttribute('.app-logical_inputs-template--hardware_inputs button', 'data-index', i, t);
      mdl.setAttribute('.app-logical_inputs-template--delete button', 'data-index', i, t);

      this.list.insertBefore(t, this.cardAddLogicalInput);
      ++this.logicalInputsCount;
    }

    // Show the Add Logical Input card and menu only if there are available slots
    let showAddItems = (this.logicalInputsCount < this.logicalInputsMaxCount);
    Utils.setVisibility('#app-logical_inputs-add', showAddItems);
    Utils.setVisibility('#app-logical_inputs-menu', showAddItems);

    if (scrollToLast) {
      const inputList = this.list.querySelectorAll('.can-delete');
      if (inputList.length > 0) {
        inputList[inputList.length - 1].scrollIntoView();
      }
    }
  }

  //*************************************************************************
  _onchange() {
    this._populateLogicalInputsList();
  }

  //*************************************************************************
  _oninput(index, positionCountElement, event) {
    if (positionCountElement.textContent !== event.target.value) {
      positionCountElement.textContent = event.target.value;
    }
  }
}

window['LogicalInputs'] = new LogicalInputs();
