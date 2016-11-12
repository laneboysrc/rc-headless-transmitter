'use strict';

var Utils = require('./utils');


class Settings {
  constructor() {
    this.restoreLog = document.querySelector('#settings-restore');
    document.querySelector('#settings-restore__input').onchange = this.restore.bind(this);
  }

  //*************************************************************************
  init() {
    Utils.removeChildren(this.restoreLog);
    Utils.showPage('settings');
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
        let entry = cursor.value;

        // Convert the Uint8Array into a regular array to prevent JSON from
        // storing it as an object, which bloats the JSON
        entry.data = Array.from(entry.data);

        entries.push(entry);
        cursor.continue();
      }
      else {
        let json = JSON.stringify(entries, null, 2);

        let blob = new Blob([json], {type: 'application/json'});
        const now = strftime('%Y%m%dT%H%M');
        window.saveAs.saveAs(blob, `headless-tx-backup-${now}.json`);
      }
    }

    Database.listEntries(collect);
  }

  //*************************************************************************
  restore(event) {
    const input = event.target;
    if (input.files.length < 1) {
      return;
    }

    Utils.removeChildren(this.restoreLog);
    const self = this;
    const reader = new FileReader();

    reader.onload = function (e) {
      let data = JSON.parse(e.target.result);
      data.forEach(entry => {
        if ('configVersion' in entry  &&
            'schemaName' in entry  &&
            'data' in entry  &&
            'lastChanged' in entry  &&
            'uuid' in entry ) {

          Database.getEntry(entry.uuid, existingEntry => {
            if (existingEntry  &&  existingEntry.lastChanged > entry.lastChanged) {
              const logEntry = document.createElement('DIV');
              logEntry.textContent = `Existing entry for ${entry.schemaName} ${entry.uuid} is newer, not overwriting`;
              self.restoreLog.appendChild(logEntry);
            }
            else {
              const logEntry = document.createElement('DIV');
              logEntry.textContent = `Adding ${entry.schemaName} ${entry.uuid} to database`;
              self.restoreLog.appendChild(logEntry);

              // Convert the regular array into an Uint8Array
              entry.data = Uint8Array.from(entry.data);

              Database.setEntry(entry);
            }
          });

        }
      });
    };

    reader.readAsText(input.files[0]);
  }

}

window['Settings'] = new Settings();
