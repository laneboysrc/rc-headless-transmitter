'use strict';

var Utils = require('./utils');
var MDLHelper = require('./mdl_helper');

class SelectSingle {
  constructor () {
    this.devName = undefined;
    this.item = undefined;
    this.offset = 0;

    this.template = document.querySelector('#app-select_single-template').content;
    this.list = document.querySelector('#app-select_single-list');
  }

  //*************************************************************************
  accept_choice () {
    let list = document.querySelector('#app-select_single-list');
    let value = list.querySelector('input[type="radio"]:checked').value;

    Device[this.devName].setItem(this.item, value, {offset: this.offset});
    history.go(-1);
  }

  //*************************************************************************
  init (params) {
    this.devName = params.devName;
    this.item = params.item;
    this.offset = parseInt(params.offset);

    let mdl = new MDLHelper(this.devName);

    // Ged rid of existing elements
    mdl.clearDynamicElements(this.list);

    let device = Device[this.devName];

    let activeItems = TransmitterDetails.getActiveItems(this.item);
    console.log('activeItems: ', activeItems)

    let name = device.getHumanFriendlyText(this.item);
    mdl.setTextContentRaw('#app-select_single-name', name);
    // FIXME: need to get item description
    mdl.setTextContentRaw('#app-select_single-description', 'FIXME');

    let current_choice = device.getItem(this.item, {offset: this.offset});

    let type = device.getType(this.item);
    let choices = device.getTypeMembers(type);

    let t = this.template;

    for (let i = 0; i < choices.length; i++) {
      let entry = choices[i];

      t.querySelector('span').textContent = entry;
      t.querySelector('input').id = 'app-select_single__item' + i;
      t.querySelector('input').value = entry;
      t.querySelector('label').setAttribute('for', 'app-select_single__item' + i);

      if (activeItems.has(entry)) {
        t.querySelector('label').classList.add('mdl-color-text--primary');
      }
      else {
        t.querySelector('label').classList.remove('mdl-color-text--primary');
      }

      let clone = document.importNode(t, true);
      if (entry === current_choice) {
        clone.querySelector('input').checked = true;
      }
      this.list.appendChild(clone);
    }

    Utils.showPage('select_single');
  }

  //*************************************************************************
  back (params) {
    history.back();
  }
}

window['SelectSingle'] = new SelectSingle();
