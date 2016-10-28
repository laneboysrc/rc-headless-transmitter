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

  //*************************************************************************
  restore(input) {
    if (input.files.length < 1) {
        return;
    }

    const reader = new FileReader();
    const restoreLog = document.querySelector('#about-restore');

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
              restoreLog.appendChild(logEntry);
            }
            else {
              const logEntry = document.createElement('DIV');
              logEntry.textContent = `Adding ${entry.schemaName} ${entry.uuid} to database`;
              restoreLog.appendChild(logEntry);

              // Convert the "object" into a Uint8Array
              let temp = [];
              let i = 0;
              while (entry.data.hasOwnProperty(i)) {
                temp.push(entry.data[i]);
                ++i;
              }
              entry.data = Uint8Array.from(temp);

              Database.setEntry(entry);
            }
          });

        }
      });
    };

    reader.readAsText(input.files[0]);
  }
}

window['About'] = new About();
