'use strict';

var Utils = require('./utils');


class Main {
  constructor() {
    // Nothing to do
  }

  //*************************************************************************
  init() {
    Device.MODEL = undefined;
    Device.TX = undefined;
    Device.UNDO = undefined;
    Device.disableCommunication();

    Utils.showPage('main');
  }

  //*************************************************************************
  connect(event) {
    Utils.cancelBubble(event);
    Device.setTransport(WebsocketTransport);
    location.hash = Utils.buildURL(['device_list']);
  }

  //*************************************************************************
  about(event) {
    Utils.cancelBubble(event);
    location.hash = Utils.buildURL(['about']);
    this._closeDrawer();
  }

  //*************************************************************************
  settings(event) {
    Utils.cancelBubble(event);
    location.hash = Utils.buildURL(['settings']);
    this._closeDrawer();
  }

  //*************************************************************************
  models(event) {
    Utils.cancelBubble(event);
    location.hash = Utils.buildURL(['model_list']);
    this._closeDrawer();
  }

  //*************************************************************************
  transmitters(event) {
    Utils.cancelBubble(event);
    location.hash = Utils.buildURL(['transmitter_list']);
    this._closeDrawer();
  }

  //*************************************************************************
  _closeDrawer() {
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
