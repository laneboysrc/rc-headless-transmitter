'use strict';

var Utils = require('./utils');
var MDLHelper = require('./mdl_helper');


class SelectMultiple {
  constructor() {
    this.devName = undefined;
    this.item = undefined;
    this.offset = 0;

    this.template = document.querySelector('#app-select_multiple-template').content;
    this.list = document.querySelector('#app-select_multiple-list');

    this.maxNumberOfChoices = 0;
  }

  //*************************************************************************
  init(params) {
    this.devName = params.devName;
    this.item = params.item;
    this.offset = parseInt(params.offset);

    let mdl = new MDLHelper(this.devName);

    // Ged rid of existing elements
    Utils.clearDynamicElements(this.list);

    let device = Device[this.devName];

    let currentChoices = device.getItem(this.item, {offset: this.offset});
    this.maxNumberOfChoices = currentChoices.length;

    let override = Device.overrideNumberOfChoices(this.item, this.offset);
    if (override  &&  override.max < this.maxNumberOfChoices) {
      this.maxNumberOfChoices = override.max;
      currentChoices = currentChoices.slice(0, override.current);
    }

    console.log(currentChoices)

    let name = device.getHumanFriendlyText(this.item);
    mdl.setTextContentRaw('#app-select_multiple-name', name);
    mdl.setTextContentRaw('#app-select_multiple-count', this.maxNumberOfChoices);
    // FIXME: need to get item description
    mdl.setTextContentRaw('#app-select_multiple-description', '');

    // If we are connected to a transmitter we can show the user available items.
    // For example, when selecting mixer source we can highlight the logical
    // inputs provided by the transmitter.
    let activeItems = Device.getActiveItems(this.item, this.offset);
    // console.log('activeItems: ', activeItems)

    // Allow overriding of the selectable items
    // This is necessary because for some items the range of allowed values
    // depends on another setting. For example, the HARDWARE_INPUT_TYPE
    // is only allowed to have analog related values if the underlying
    // PCB_INPUT is of type analog/digital.
    // The overrideType() function allows to retreive a sub-set of the types
    // to fulfil the criteria.
    // In case the type is not overridden, the default type members are loaded.
    let choices = Device.overrideType(this.item, this.offset);
    // console.log('choices: ', choices)
    if (! choices.length) {
      let type = device.getType(this.item);
      choices = device.getTypeMembers(type);
    }

    for (let i = 0; i < choices.length; i++) {
      let entry = choices[i];

      let t = document.importNode(this.template, true);
      t.querySelector('span').textContent = entry;

      if (this.item === 'LOGICAL_INPUTS_HARDWARE_INPUTS') {
        let index = device.getNumberOfTypeMember('LOGICAL_INPUTS_HARDWARE_INPUTS', entry);
        let hardwareInputsSize = device.getSchema().HARDWARE_INPUTS.s;
        let type = device.getItem('HARDWARE_INPUTS_TYPE', {offset: index * hardwareInputsSize});

        let info = mdl.createSpan(' ' + type, 'app-select_multiple__info');
        t.querySelector('span').appendChild(info);
      }

      t.querySelector('input').id = 'app-select_multiple__item' + i;
      t.querySelector('input').value = entry;
      t.querySelector('input').checked = currentChoices.includes(entry);
      t.querySelector('input').addEventListener('change', this._onchange.bind(this));
      t.querySelector('label').setAttribute('for', 'app-select_multiple__item' + i);
      if (activeItems.includes(entry)) {
        t.querySelector('label').classList.add('mdl-color-text--primary');
      }

      this.list.appendChild(t);
    }

    Utils.showPage('select_multiple');
  }

  //*************************************************************************
  back() {
    history.back();
  }

  //*************************************************************************
  accept_choice(event) {
    Utils.cancelBubble(event);

    let itemCount = Device[this.devName].getSchema()[this.item].c;
    let chosenItems = this._getChosenItems();
    while (chosenItems.length < itemCount) {
      chosenItems.push(0);
    }

    Device[this.devName].setItem(this.item, chosenItems, {offset: this.offset});
    history.go(-1);
  }

  _getChosenItems() {
    let result = [];
    let list = document.querySelector('#app-select_multiple-list');
    let selectedItems = list.querySelectorAll('input[type="checkbox"]:checked');
    for (let item of selectedItems) {
      result.push(item.value);
    }
    return result;
  }

  //*************************************************************************
  _onchange(event) {
    let items = this._getChosenItems();
    if (items.length > this.maxNumberOfChoices) {
      event.target.checked = false;
      this._showToast();
    }
  }

  //*************************************************************************
  _showToast() {
    const text = `Choose at most ${this.maxNumberOfChoices} items`;
    Utils.showToast(text, 2000);
  }
}

window['SelectMultiple'] = new SelectMultiple();
