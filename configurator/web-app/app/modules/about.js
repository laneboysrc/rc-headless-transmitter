'use strict';

var Utils = require('./utils');


class About {
  constructor() {
    // Nothing to do
  }

  //*************************************************************************
  init(params) {
    Utils.showPage('about');
  }

  //*************************************************************************
  back() {
    history.back();
  }
}

window['About'] = new About();
