'use strict';

var Utils = require('./utils');
var MDLHelper = require('./mdl_helper');
var DatabaseObject = require('./database_object');


class TransmitterList {
  constructor() {
    this.list = document.querySelector('#app-transmitter_list-list');
    this.noTransmitter = document.querySelector('#app-transmitter_list-no_transmitter');
    this.container = document.querySelector('#app-transmitter_list-list__container');
    this.template = document.querySelector('#app-transmitter_list-list__template').content;
    this.snackbar = document.querySelector('#app-transmitter_list-snackbar');
    this.snackbarMessage = document.querySelector('#app-transmitter_list-snackbar__message').content.textContent;
    this.snackbarActionText = document.querySelector('#app-transmitter_list-snackbar__action_text').content.textContent;

    this.transmitters = [];
  }

  //*************************************************************************
  init(params) {
    this.transmitters = [];

    Utils.hide(this.noTransmitter);
    Utils.hide(this.list);
    Utils.clearDynamicElements(this.list);

    Database.listEntries(this._databaseCallback.bind(this));

    Utils.showPage('transmitter_list');
  }

  //*************************************************************************
  back() {
    history.back();
  }

  //*************************************************************************
  edit(element) {
    let index = element.getAttribute('data-index');
    console.log('TransmitterList.edit()', index)

    Database.getEntry(this.transmitters[index].uuid, function (data) {
      Device.TX = new DatabaseObject(data);
      location.hash = Utils.buildURL(['transmitter_details']);
    });
  }

  //*************************************************************************
  deleteTransmitter(transmitter) {
    Device.UNDO = transmitter;
    Database.deleteEntry(transmitter);

    let data = {
      message: this.snackbarMessage,
      timeout: 5000,
      actionHandler: this._undoDeleteTransmitter.bind(this),
      actionText: this.snackbarActionText
    };
    this.snackbar.MaterialSnackbar.showSnackbar(data);
  }

  //*************************************************************************
  _databaseCallback(cursor) {
    // console.log(cursor)
    if (cursor) {
      let data = cursor.value;
      if (data.schemaName === 'TX') {
        let transmitter = new DatabaseObject(data);
        this.transmitters.push({
          name: transmitter.getItem('NAME'),
          uuid: data.uuid
        });
      }
      cursor.continue();
    }
    else {
      this._updateTransmitterList();
    }
  }

  //*************************************************************************
  _updateTransmitterList() {
    Utils.clearDynamicElements(this.list);

    // Sort transmitters[] by name
    this.transmitters.sort((a, b) => {
      return (a.name < b.name) ? -1 : 1;
    });

    let mdl = new MDLHelper('TX');
    for (let i = 0; i < this.transmitters.length; i++) {
      let t = document.importNode(this.template, true);
      t.querySelector('button.app-transmitter_list--edit').setAttribute('data-index', i);
      mdl.setTextContentRaw('.app-transmitter_list-list__template-name', this.transmitters[i].name, t);

      this.container.appendChild(t);
    }

    Utils.setVisibility(this.list, this.transmitters.length !==  0);
    Utils.setVisibility(this.noTransmitter, this.transmitters.length ===  0);
  }


  //*************************************************************************
  _undoDeleteTransmitter() {
    if (!Device.UNDO) {
      return;
    }

    Device.TX = Device.UNDO;
    Database.setEntry(Device.TX);

    let mdl = new MDLHelper();
    mdl.cancelSnackbar(this.snackbar);

    location.hash = Utils.buildURL(['transmitter_details']);
  }
}

window['TransmitterList'] = new TransmitterList();
