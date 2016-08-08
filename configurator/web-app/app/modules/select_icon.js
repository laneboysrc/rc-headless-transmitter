'use strict';

var Utils = require('./utils');
var MDLHelper = require('./mdl_helper');

class SelectIcon {
  constructor() {
    this.devName = undefined;
    this.item = undefined;
    this.offset = 0;

    this.template = document.querySelector('#app-select_icon-template').content;
    this.list = document.querySelector('#app-select_icon-list');
  }

  //*************************************************************************
  acceptChoice(event) {
    Utils.cancelBubble(event);

    let list = document.querySelector('#app-select_icon-list');
    let value = list.querySelector('input[type="radio"]:checked').value;

    Device[this.devName].setItem(this.item, value, {offset: this.offset});
    history.go(-1);
  }

  //*************************************************************************
  init(params) {
    this.devName = params.devName;
    this.item = params.item;
    this.offset = parseInt(params.offset);

    let mdl = new MDLHelper(this.devName);

    mdl.setTextContent('#app-select_icon-name', 'NAME');

    // Ged rid of existing elements
    Utils.clearDynamicElements(this.list);

    let device = Device[this.devName];
    let current_choice = device.getItem(this.item, {offset: this.offset});
    let choices = mdl.icons;

    let t = this.template;
    let i = 0;
    for (let entry in choices) {
      if (!choices.hasOwnProperty(entry)) {
        continue;
      }

      t.querySelector('i').textContent = choices[entry];
      t.querySelector('input').id = 'app-select_icon__item' + i;
      t.querySelector('input').value = entry;
      t.querySelector('label').setAttribute('for', 'app-select_icon__item' + i);

      let clone = document.importNode(t, true);
      if (parseInt(entry) === current_choice) {
        clone.querySelector('input').checked = true;
      }
      this.list.appendChild(clone);
      ++i;
    }

    Utils.showPage('select_icon');
  }

  //*************************************************************************
  back() {
    history.back();
  }
}

window['SelectIcon'] = new SelectIcon();
