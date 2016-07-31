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
}

window['Main'] = new Main();
