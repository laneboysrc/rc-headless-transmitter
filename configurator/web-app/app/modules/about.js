'use strict';

var Utils = require('./utils');


class About {
  constructor() {
    // Nothing to do
  }

  //*************************************************************************
  init() {
    Utils.showPage('about');
  }

  //*************************************************************************
  back() {
    history.back();
  }
}

window['About'] = new About();
