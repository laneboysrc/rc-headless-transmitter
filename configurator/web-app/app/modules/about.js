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

  //*************************************************************************
  backup(event) {
    Utils.cancelBubble(event);

    let entries = [];

    function collect(cursor) {
      if (cursor) {
        entries.push(cursor.value);
        cursor.continue();
      }
      else {
        let json = JSON.stringify(entries, null, 2);

        let blob = new Blob([json], {type: "application/json"});
        window.saveAs.saveAs(blob, "headless-tx-backup.json");
      }
    }

    Database.listEntries(collect);
  }
}

window['About'] = new About();
