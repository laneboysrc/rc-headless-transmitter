'use strict';

var Utils = require('./utils');

class Main {
  constructor () {
    // Nothing to do
  }

  init () {
    // We can only do this after MDL has initialized, otherwise the drawer_button
    // does not exist
    this.drawerButton = document.querySelector('#page_main .mdl-layout__drawer-button');

    dev.MODEL = undefined;
    dev.TX = undefined;
    dev.UNDO = undefined;
    dev.disableCommunication();

    Utils.showPage('main');
  }

  connect (event) {
    Utils.cancelBubble(event);
    location.hash = Utils.buildURL(['device_list']);
  }

  about (event) {
    Utils.cancelBubble(event);
    location.hash = Utils.buildURL(['about']);

    // Close the drawer
    this.drawerButton.click();
  }

  models (event) {
    Utils.cancelBubble(event);
    location.hash = Utils.buildURL(['model_list']);

    // Close the drawer
    this.drawerButton.click();
  }

  transmitters (event) {
    Utils.cancelBubble(event);
    location.hash = Utils.buildURL(['transmitter_list']);

    // Close the drawer
    this.drawerButton.click();
  }
}

window['Main'] = new Main();
