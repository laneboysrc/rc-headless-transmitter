'use strict';

var Utils = require('./utils');
var MDLHelper = require('./mdl_helper');
var DatabaseObject = require('./database_object');


class DeviceList {
  constructor() {
    this.loading = document.querySelector('#app-device_list-loading');
    this.noWebsocket = document.querySelector('#app-device_list-loading__no-websocket');
    this.list = document.querySelector('#app-device_list-list');
    this.container = document.querySelector('#app-device_list-list__container');
    this.template = document.querySelector('#app-device_list-list__template').content;
    this.txLoading = document.querySelector('#app-device_list-loading_transmitter');
    this.txProgress = document.querySelector('#app-device_list-loading_transmitter__progress');
    this.txConnecting = document.querySelector('#app-device_list-loading_transmitter__connecting');
    this.txModel = document.querySelector('#app-device_list-loading_transmitter__model');
    this.txTransmitter = document.querySelector('#app-device_list-loading_transmitter__transmitter');

    this.progress = {};
    this.showToast = false;
    this.availableTransmitters = [];

    this.onmessageHandler = this._onmessage.bind(this);
  }

  //*************************************************************************
  init() {
    this._resetPage();

    if (Device.connected) {
      Device.disconnect();
    }
    else {
      Device.enableCommunication();
    }

    document.addEventListener('dev-connectionlost', this._connectionLost.bind(this));
    Utils.showPage('device_list');
  }

  //*************************************************************************
  back() {
    history.back();
  }

  //*************************************************************************
  edit(index) {
    document.removeEventListener('ws-message', this.onmessageHandler);

    let tx = this.availableTransmitters[index];
    let mdl = new MDLHelper();
    mdl.setTextContentRaw('#app-device_list-loading_transmitter__name', tx.name);

    Utils.hide(this.list);
    Utils.show(this.txLoading);

    // Show the "connecting" message, hide "loading model" and "loading transmitter"
    Utils.show(this.txConnecting);
    Utils.hide(this.txModel);
    Utils.hide(this.txTransmitter);

    this.txProgress.classList.add('mdl-progress--indeterminate');

    this.load(tx.uuid);
  }

  //*************************************************************************
  // connect to the transmitter
  // retrieve configVersion
  // if we don't know this configVersion
  //    send disconnect command
  //    abort (reset the pagge)
  // _loadDevice('TX')
  // _loadDevice('MODEL')
  load(uuid) {
    var configVersion;

    // FIXME: Retrieve passphrase from database based on UUID, or 1234 if not found, or provided one
    let passphrase = 1234;
    // FIXME: implement progress bar

    Device.connect(uuid, passphrase).then(() => {
      return Device.read(0, 4);
    }).then(data => {
      configVersion = Utils.getUint32(data);
      // console.log(data)
      if (!CONFIG_VERSIONS.hasOwnProperty(configVersion)) {
        return Promise.reject(
          new Error(`Unknown configVersion "${configVersion}"`));
      }
      Utils.hide(this.txConnecting);
      Utils.show(this.txTransmitter);
      return Device.load(configVersion, 'TX');
    }).then(() => {
      Utils.hide(this.txTransmitter);
      Utils.show(this.txModel);
      return Device.load(configVersion, 'MODEL');
    }).then(() => {
      location.hash = Utils.buildURL(['model_details']);
    }).catch(error => {
      console.log(error);
      // FIXME: we should let the user know that something went wrong
      this._resetPage();
    });
  }

  //*************************************************************************
  _resetPage() {
    document.addEventListener('ws-message', this.onmessageHandler);

    // Empty the list of transmitters
    this.availableTransmitters = [];
    Utils.clearDynamicElements(this.list);

    Utils.show(this.loading);
    Utils.hide(this.list);
    Utils.hide(this.txLoading);
    Utils.hide(this.noWebsocket);
  }

  //*************************************************************************
  _transmitterReadyForConnect(data) {
    this.showToast = true;

    let newTx = {
      name: Utils.uint8array2string(data.slice(9, 16 + 9)),
      uuid: Utils.uuid2string(data.slice(1, 8 + 1)),
      battery: data[1 + 8 + 16] + (data[1 + 8 + 16 + 1] * 256)
    };

    let index = this.availableTransmitters.findIndex((element) => {
      return element.name === newTx.name;
    });

    if (index >= 0) {
      return;
    }

    this.availableTransmitters.push(newTx);
    index = this.availableTransmitters.length - 1;

    console.log('New transmitter: ' + newTx.name);

    Utils.show(this.list);
    Utils.hide(this.loading);

    let mdl = new MDLHelper();
    let t = document.importNode(this.template, true);

    t.querySelector('button').setAttribute('data-index', index);
    mdl.setTextContentRaw('.app-device_list-list__template-name', newTx.name, t);

    let voltage = parseFloat(newTx.battery/1000).toFixed(2);
    mdl.setTextContentRaw('.app-device_list-list__template-battery', '' + voltage + 'V', t);
    if (voltage < 3.56) {
      t.querySelector('.app-device_list-list__template-battery').classList.add('warning');
    }

    this.container.appendChild(t);

    this.showToast = true;
  }

  //*************************************************************************
  _connectionLost() {
    if (Device.MODEL || Device.TX) {
      Device.MODEL = undefined;
      Device.TX = undefined;
      Utils.rollbackHistoryToRoot();
      location.hash = Utils.buildURL(['device_list']);
    }

    this._showConnectionLostMessage();
    this._resetPage();
    Utils.show(this.noWebsocket);
  }

  //*************************************************************************
  _showConnectionLostMessage() {
    if (!this.showToast) {
      return;
    }
    this.showToast = false;

    let toast = document.querySelector('#app-device_list-toast');
    let text = document.querySelector('#app-device_list-toast__message').content.textContent;

    const message = {
      message: text,
      timeout: 5000
    };
    toast.MaterialSnackbar.showSnackbar(message);
  }

  //*************************************************************************
  // Receives Websocket messages
  _onmessage(event) {
    // console.log('DeviceList ws: ', event, data);
    let data = event.detail;

    // FIXME: handle situation when we return to that page while already
    // connected to a transmitter
    if (data[0] === Device.TX_FREE_TO_CONNECT) {
      this._transmitterReadyForConnect(data);
    }
  }
}


window['DeviceList'] = new DeviceList();
