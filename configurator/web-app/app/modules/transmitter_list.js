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
    this.transmitters = [];
  }

  //*************************************************************************
  init(params) {
    this.transmitters = [];

    Utils.hide(this.noTransmitter);
    Utils.hide(this.list);
    Utils.clearDynamicElements(this.list);

    Database.listEntries(this.databaseCallback.bind(this));

    Utils.showPage('transmitter_list');
  }

  //*************************************************************************
  databaseCallback(cursor) {
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
      this.updateTransmitterList();
    }
  }

  //*************************************************************************
  updateTransmitterList() {
    Utils.clearDynamicElements(this.list);

    // Sort transmitters[] by name
    this.transmitters.sort((a, b) => {
      return (a.name < b.name) ? -1 : 1;
    });

    let mdl = new MDLHelper('TX');
    let t = this.template;
    for (let i = 0; i < this.transmitters.length; i++) {
      t.querySelector('div').classList.add('can-delete');
      t.querySelector('button.app-tramsmitter_list--edit').setAttribute('data-index', i);
      mdl.setTextContentRaw('.app-tramsmitter_list-list__template-name', this.transmitters[i].name, t);

      let clone = document.importNode(t, true);
      this.container.appendChild(clone);
    }

    Utils.setVisibility(this.list, this.transmitters.length !==  0);
    Utils.setVisibility(this.noTransmitter, this.transmitters.length ===  0);
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
  back() {
    history.back();
  }
}

window['TransmitterList'] = new TransmitterList();
