'use strict';

var Utils = require('./utils');


class About {
  constructor() {
    const elHash = document.querySelector('#page_about .version .hash');
    const elDate = document.querySelector('#page_about .version .date');

    elHash.textContent = VERSION_HASH + VERSION_DIRTY;
    elDate.textContent = VERSION_DATE;
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
