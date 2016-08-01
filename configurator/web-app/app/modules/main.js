'use strict';

var Utils = require('./utils');

class Main {
  constructor () {
    // Nothing to do
  }

  init () {
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
    this.closeDrawer();
  }

  models (event) {
    Utils.cancelBubble(event);
    location.hash = Utils.buildURL(['model_list']);
    this.closeDrawer();
  }

  transmitters (event) {
    Utils.cancelBubble(event);
    location.hash = Utils.buildURL(['transmitter_list']);
    this.closeDrawer();
  }

  closeDrawer () {
    // We can only do this after MDL has initialized, otherwise the drawer_button
    // does not exist
    let drawerButton = document.querySelector('#page_main .mdl-layout__drawer-button');

    // Close the drawer only after a short delay as to not interfere with
    // loading of the new page
    window.setTimeout(() => {
      drawerButton.click();
    }, 50);
  }
}

window['Main'] = new Main();
