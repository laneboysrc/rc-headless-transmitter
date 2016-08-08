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
  init(params) {
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
    Utils.show(this.txConnecting);
    Utils.show(this.txModel);
    Utils.show(this.txTransmitter);
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
      return this._loadDevice(configVersion, 'TX');
    }).then(() => {
      Utils.hide(this.txTransmitter);
      Utils.show(this.txModel);
      return this._loadDevice(configVersion, 'MODEL');
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
      uuid: Utils.uuid2string(data.slice(1, 8 + 1))
    };

    let index = this.availableTransmitters.findIndex((element, index, array) => {
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
    let t = this.template;
    t.querySelector('div').classList.add('can-delete');
    t.querySelector('button').setAttribute('data-index', index);
    mdl.setTextContentRaw('.app-device_list-list__template-name', newTx.name, t);

    let clone = document.importNode(t, true);
    this.container.appendChild(clone);

    this.showToast = true;
  }

  //*************************************************************************
  // load hw.[schemaName].UUID
  // if hw.[schemaName].UUID is not set
  //     generate new UUID
  //     write UUID to hw.[schemaName]
  //     write LAST_CHANGED to hw.[schemaName]
  // if hw.[schemaName].UUID is in our database
  //     load hw.[schemaName].LAST_CHANGED
  //     if hw.[schemaName].LAST_CHANGED == database[UUID].LAST_CHANGED
  //         load Device.[schemaName] from database
  //     else if hw.[schemaName].LAST_CHANGED > database[UUID].LAST_CHANGED
  //         load hw.[schemaName] into Device.[schemaName]
  //         update Device.[schemaName] in database
  //     else
  //         load Device.[schemaName] from database
  //         write Device.[schemaName] to hw.[schemaName]
  // else
  //     load hw.[schemaName] into Device.[schemaName]
  //     add Device.[schemaName] to our database
  _loadDevice(configVersion, schemaName) {
    // console.log(`DeviceList._loadDevice configVersion=${configVersion} schemaName=${schemaName}`)

    const schema = CONFIG_VERSIONS[configVersion][schemaName];
    var newDev = {};

    newDev.configVersion = configVersion;
    newDev.schemaName = schemaName;
    newDev.data = new Uint8Array(schema.s);

    return new Promise((resolve, reject) => {
      Device.read(schema.o + schema['UUID'].o, schema['UUID'].c).then(data => {
        // console.log('UUID bytes', data);
        newDev.uuid = Utils.uuid2string(data);
        // console.log('UUID', newDev.uuid);
        if (!Utils.isValidUUID(newDev.uuid)) {
          newDev.uuid = Utils.newUUID();
          return Device.write(schema.o + schema['UUID'].o, schema['UUID'].s,
            Utils.string2uuid(newDev.uuid));
        }
        return Promise.resolve();
      }).then(() => {
        return new Promise((resolve, reject) => {
          Database.getEntry(newDev.uuid, data => {
            if (data) {
              data = new DatabaseObject(data);
            }
            resolve(data);
          });
        });
      }).then(dbEntry => {
        // console.log('dbEntry', dbEntry)
        if (dbEntry  &&  dbEntry.getItem('UUID') === newDev.uuid)  {
          // console.log('Device is in the database already');
          return new Promise((resolve, reject) => {
            Device.read(schema.o + schema['LAST_CHANGED'].o, schema['LAST_CHANGED'].s).then(data => {
              newDev.lastChanged = Utils.getUint32(data);

              // console.log('LAST_CHANGED', newDev.lastChanged, dbEntry.lastChanged)

              if (newDev.lastChanged === dbEntry.lastChanged) {
                // console.log('device === db')
                // console.log(dbEntry)
                resolve(dbEntry);
              }
              else if (newDev.lastChanged > dbEntry.lastChanged) {
                // console.log('device > db')
                this._loadDeviceData(newDev).then(devdbentry => {
                  resolve(devdbentry);
                });
              }
              else {
                // console.log('device < db')
                Device.write(schema.o, dbEntry.data).then(() => {
                  resolve(dbEntry);
                });
              }
            });
          });
        }
        else {
          return this._loadDeviceData(newDev);
        }
      }).then(dbobject => {
        // console.log("RESOLVING read", schemaName)
        Device[newDev.schemaName] = dbobject;
        resolve();
      });
    });
  }

  //*************************************************************************
  // load hw.[newDev.schemaName] into newDev
  // add newDev to our database
  _loadDeviceData (newDev) {
    const schema = CONFIG_VERSIONS[newDev.configVersion][newDev.schemaName];
    return new Promise((resolve, reject) => {
      Device.read(schema.o, schema.s).then(data => {
        // console.log('_loadDeviceData read from device')
        newDev.data = data;

        var dbEntry = new DatabaseObject(newDev);
        newDev.lastChanged = dbEntry.getItem('LAST_CHANGED');

        return new Promise((resolve, reject) => {
          // console.log('setEntry', newDev)
          Database.setEntry(newDev, () => {
            // console.log('setEntry done')
            resolve(dbEntry);
          });
        });
      }).then(dbobject => {
        // console.log('resolving outer promise', dbobject)
        resolve(dbobject);
      });
    });
  }

  //*************************************************************************
  _connectionLost(event) {
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

    // FIXME: the 'toast; should be one element for the whole app!
    let toast = document.querySelector('#app-device_list-toast');
    const message = {
      message: 'Connection lost',
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
