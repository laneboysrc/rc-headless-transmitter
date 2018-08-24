'use strict';

var Utils = require('./utils');
var MDLHelper = require('./mdl_helper');
var DatabaseObject = require('./database_object');


class DeviceList {
  constructor() {
    this.loading = document.querySelector('#app-device_list-loading');
    this.hints = document.querySelector('#app-device_list-hints');
    this.msgBridge = document.querySelector('#app-device_list-loading__bridge');
    this.msgScanning = document.querySelector('#app-device_list-loading__scanning');
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

    this.hintTimer = null;

    document.addEventListener('dev-bridgeconnected', this._bridgeConnected.bind(this));
    document.addEventListener('dev-connectionlost', this._connectionLost.bind(this));
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

    this._cancelHints();
    this.hintTimer = setTimeout(this._showHints.bind(this), 4000);

    Utils.showPage('device_list');
  }

  //*************************************************************************
  back() {
    history.back();
  }

  //*************************************************************************
  edit(index) {
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
      console.log('Connection failed', error);
      // FIXME: We arrive here when either the password was wrong, or some
      // connection error happened, e.g. because the transmitter is no longer
      // on air. We need to show a card or dialog where the user can enter another
      // passphrase, or cancel.
      this._resetPage();
    });
  }

  //*************************************************************************
  transmitterFreeToConnect(data) {
    this.showToast = true;

    let newTx = {
      name: Utils.uint8array2string(data.slice(9, 16 + 9)),
      uuid: Utils.uuid2string(data.slice(1, 8 + 1)),
      battery: data[1 + 8 + 16] + (data[1 + 8 + 16 + 1] * 256)
    };

    let index = this.availableTransmitters.findIndex((element) => {
      return element.uuid === newTx.uuid;
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
  async webusb() {
    const filters = [{ 'vendorId': 0x6666 }];

    try {
      await navigator.usb.requestDevice({ 'filters': filters });
    }
    catch (e) {
      console.log('navigator.usb.requestDevice() failed: ' + e);
    }
  }

  //*************************************************************************
  _resetPage() {
    // Empty the list of transmitters
    this.availableTransmitters = [];
    Utils.clearDynamicElements(this.list);

    Utils.show(this.loading);
    Utils.show(this.msgBridge);
    Utils.hide(this.msgScanning);
    Utils.hide(this.list);
    Utils.hide(this.txLoading);
  }

  //*************************************************************************
  _cancelHints() {
    Utils.hide(this.hints);
    if (this.hintTimer) {
      clearTimeout(this.hintTimer);
      this.hintTimer = null;
    }
  }

  //*************************************************************************
  _bridgeConnected() {
    Utils.hide(this.msgBridge);
    Utils.show(this.msgScanning);
    this._cancelHints();
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
  }

  //*************************************************************************
  _showConnectionLostMessage() {
    if (!this.showToast) {
      return;
    }
    this.showToast = false;

    const text = document.querySelector('#app-device_list-toast__message').content.textContent;
    Utils.showToast(text, 5000);
  }

  //*************************************************************************
  _showHints() {
    this.hintTimer = null;
    Utils.show(this.hints);
  }
}


window['DeviceList'] = new DeviceList();
