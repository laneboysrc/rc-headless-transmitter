'use strict';

var Utils = require('./utils');
var MDLHelper = require('./mdl_helper');


class SelectSingle {
  constructor() {
    this.devName = undefined;
    this.item = undefined;
    this.offset = 0;

    this.template = document.querySelector('#app-select_single-template').content;
    this.list = document.querySelector('#app-select_single-list');
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

    let name = device.getHumanFriendlyText(this.item);
    mdl.setTextContentRaw('#app-select_single-name', name);
    // FIXME: need to get item description
    mdl.setTextContentRaw('#app-select_single-description', 'FIXME');

    // If we are connected to a transmitter we can show the user available items.
    // For example, when selecting mixer source we can highlight the logical
    // inputs provided by the transmitter.
    let activeItems = Device.getActiveItems(this.item);
    console.log('activeItems: ', activeItems)

    // Allow overriding of the selectable items
    // This is necessary because for some items the range of allowed values
    // depends on another setting. For example, the HARDWARE_INPUT_TYPE
    // is only allowed to have analog related values if the underlying
    // PCB_INPUT is of type analog/digital.
    // The overrideType() function allows to retreive a sub-set of the types
    // to fulfil the criteria.
    // In case the type is not overridden, the default type members are loaded.
    let choices = Device.overrideType(this.item, this.offset);
    console.log('choices: ', choices)
    if (! choices.length) {
      let type = device.getType(this.item);
      choices = device.getTypeMembers(type);
    }

    let current_choice = device.getItem(this.item, {offset: this.offset});

    for (let i = 0; i < choices.length; i++) {
      let entry = choices[i];

      let t = document.importNode(this.template, true);
      t.querySelector('span').textContent = entry;
      t.querySelector('input').id = 'app-select_single__item' + i;
      t.querySelector('input').value = entry;
      t.querySelector('input').checked = (entry === current_choice);
      t.querySelector('label').setAttribute('for', 'app-select_single__item' + i);
      if (activeItems.includes(entry)) {
        t.querySelector('label').classList.add('mdl-color-text--primary');
      }

      this.list.appendChild(t);
    }

    Utils.showPage('select_single');
  }

  //*************************************************************************
  back() {
    history.back();
  }

  //*************************************************************************
  accept_choice(event) {
    Utils.cancelBubble(event);

    let list = document.querySelector('#app-select_single-list');
    let value = list.querySelector('input[type="radio"]:checked').value;

    Device[this.devName].setItem(this.item, value, {offset: this.offset});
    history.go(-1);
  }
}

window['SelectSingle'] = new SelectSingle();
