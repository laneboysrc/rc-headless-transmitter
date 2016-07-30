'use strict';

var Utils       = require('./utils');
var MDLHelper   = require('./mdl_helper');
var DBObject    = require('./database_object');


var messages = {
    default: '',
    noWebsocket: 'Turn on the transmitter or bridge and ensure no other configurator is accessing it',
    loading: 'Loading the transmitter configuration',
    model: 'Loading the model configuration',
    connecting: 'Connecting to the transmitter',
};

var availableTransmitters = [];
var wsConnected = false;


//*************************************************************************
var DeviceList = function () {
    this.loading = document.querySelector('#app-device_list-loading');
    this.message = document.querySelector('#app-device_list-loading__message');

    this.list = document.querySelector('#app-device_list-list');
    this.container = document.querySelector('#app-device_list-list__container');
    this.template = document.querySelector('#app-device_list-list__template').content;

    this.txLoading = document.querySelector('#app-device_list-loading_transmitter');
    this.txMessage = document.querySelector('#app-device_list-loading_transmitter__message');
    this.txProgress = document.querySelector('#app-device_list-loading_transmitter__progress');

    this.mdl = new MDLHelper();
    this.progress = {};

    this._onmessage = this.onmessage.bind(this);

    // FIXME: this should be handled through the Device
    document.addEventListener('ws-open', this.onopen.bind(this));
    document.addEventListener('ws-close', this.onclose.bind(this));
    // document.addEventListener('ws-message', this._onmessage);
};

//*************************************************************************
DeviceList.prototype.init = function (params) {
    this.resetPage();

    Utils.showPage('device_list');

    WebsocketProtocol.close();

    WebsocketProtocol.open();
    document.addEventListener('ws-message', this._onmessage);
};

//*************************************************************************
DeviceList.prototype.resetPage = function () {
    document.removeEventListener('ws-message', this._onmessage);

    this.loading.classList.remove('hidden');
    this.list.classList.add('hidden');
    this.txLoading.classList.add('hidden');
    availableTransmitters = [];

    // Empty the list of transmitters
    this.mdl.clearDynamicElements(this.list);
    this.message.textContent = messages.default;
    wsConnected = false;
};

//*************************************************************************
DeviceList.prototype.transmitterReadyForConnect = function (data) {
    var transmitterName = Utils.uint8array2string(data.slice(1, 16 + 1));
    if (availableTransmitters.indexOf(transmitterName) >= 0) {
        return;
    }
    availableTransmitters.push(transmitterName);

    console.log('New transmitter: ' + transmitterName);

    var index = availableTransmitters.indexOf(transmitterName);

    this.list.classList.remove('hidden');
    this.loading.classList.add('hidden');

    var t = this.template;
    t.querySelector('div').classList.add('can-delete');
    t.querySelector('button').setAttribute('data-index', index);
    this.mdl.setTextContentRaw('.app-device_list-list__template-name', transmitterName, t);

    var clone = document.importNode(t, true);
    this.container.appendChild(clone);
};

//*************************************************************************
DeviceList.prototype.edit = function (index) {
    document.removeEventListener('ws-message', this._onmessage);

    this.mdl.setTextContentRaw('#app-device_list-loading_transmitter__name', availableTransmitters[index]);

    this.list.classList.add('hidden');
    this.txLoading.classList.remove('hidden');
    this.txProgress.classList.add('mdl-progress--indeterminate');
    this.txMessage.textContent = messages.connecting;

    this.load('FIXME-save-uuid-in-availableTransmitters');
};

//*************************************************************************
// connect to the transmitter
// retrieve configVersion
// if we don't know this configVersion
//    send disconnect command
//    abort (reset the pagge)
// loadDevice('TX')
// loadDevice('MODEL')
DeviceList.prototype.load = function (uuid) {
    var configVersion;

    // FIXME: implement progress bar

    dev.connect(uuid).then(_ => {
        return dev.read(0, 4);
    }).then(data => {
        configVersion = Utils.getUint32(data);
        // console.log(data)
        if (!CONFIG_VERSIONS.hasOwnProperty(configVersion)) {
            return Promise.reject(
                new Error(`Unknown configVersion "${configVersion}"`));
        }
        return this.loadDevice(configVersion, 'TX');
    }).then(_ => {
        return this.loadDevice(configVersion, 'MODEL');
    }).then( _ => {
        location.hash = Utils.buildURL(['model_details']);
    }).catch(error => {
        console.log(error);
        // FIXME: we should let the user know that something went wrong
        this.resetPage();
    });
};

//*************************************************************************
// load hw.[schemaName].UUID
// if hw.[schemaName].UUID is not set
//     generate new UUID
//     write UUID to hw.[schemaName]
//     write LAST_CHANGED to hw.[schemaName]
// if hw.[schemaName].UUID is in our database
//     load hw.[schemaName].LAST_CHANGED
//     if hw.[schemaName].LAST_CHANGED == database[UUID].LAST_CHANGED
//         load dev.[schemaName] from database
//     else if hw.[schemaName].LAST_CHANGED > database[UUID].LAST_CHANGED
//         load hw.[schemaName] into dev.[schemaName]
//         update dev.[schemaName] in database
//     else
//         load dev.[schemaName] from database
//         write dev.[schemaName] to hw.[schemaName]
// else
//     load hw.[schemaName] into dev.[schemaName]
//     add dev.[schemaName] to our database
DeviceList.prototype.loadDevice = function (configVersion, schemaName) {
    console.log(`DeviceList.loadDevice configVersion=${configVersion} schemaName=${schemaName}`)

    const schema = CONFIG_VERSIONS[configVersion][schemaName];
    var newDev = {};

    newDev.configVersion = configVersion;
    newDev.schemaName = schemaName;
    newDev.data = new Uint8Array(schema.s);

    return new Promise((resolve, reject) => {
        dev.read(schema.o + schema['UUID'].o, schema['UUID'].c).then(data => {
            // console.log('UUID bytes', data);
            newDev.uuid = Utils.uuid2string(data);
            // console.log('UUID', newDev.uuid);
            if (!Utils.isValidUUID(newDev.uuid)) {
                newDev.uuid = Utils.newUUID();
                return dev.write(schema.o + schema['UUID'].o, schema['UUID'].s,
                    Utils.string2uuid(newDev.uuid));
            }
            return Promise.resolve();
        }).then(_ => {
            return new Promise((resolve, reject) => {
                Database.getEntry(newDev.uuid, data => {
                    // FIXME: handle if device not in database
                    if (data) {
                        data = new DBObject(data);
                    }
                    resolve(data);
                });
            });
        }).then(dbEntry => {
            // console.log('dbEntry', dbEntry)
            if (dbEntry  &&  dbEntry.get('UUID') === newDev.uuid)  {
                // console.log('Device is in the database already');
                return new Promise((resolve, reject) => {
                    dev.read(schema.o + schema['LAST_CHANGED'].o, schema['LAST_CHANGED'].s).then(data => {
                        newDev.lastChanged = Utils.getUint32(data);

                        console.log('LAST_CHANGED', newDev.lastChanged, dbEntry.lastChanged)

                        if (newDev.lastChanged === dbEntry.lastChanged) {
                            // console.log('device === db')
                            // console.log(dbEntry)
                            resolve(dbEntry);
                        }
                        else if (newDev.lastChanged > dbEntry.lastChanged) {
                            // console.log('device > db')
                            this.loadDeviceData(newDev).then(devdbentry => {
                                resolve(devdbentry);
                            });
                        }
                        else {
                            console.log('device < db')
                            dev.write(schema.o, dbEntry.data).then(_ => {
                                resolve(dbEntry);
                            });
                        }
                    });
                });
            }
            else {
                return this.loadDeviceData(newDev);
            }
        }).then(dbobject => {
            // console.log("RESOLVING read", schemaName)
            dev[newDev.schemaName] = dbobject;
            resolve();
        });
    });
};

//*************************************************************************
// load hw.[newDev.schemaName] into newDev
// add newDev to our database
DeviceList.prototype.loadDeviceData = function (newDev) {
    const schema = CONFIG_VERSIONS[newDev.configVersion][newDev.schemaName];
    return new Promise((resolve, reject) => {
        dev.read(schema.o, schema.s).then(data => {
            // console.log('loadDeviceData read from device')
            newDev.data = data;

            var dbEntry = new DBObject(newDev);
            newDev.lastChanged = dbEntry.get('LAST_CHANGED');

            return new Promise((resolve, reject) => {
                // console.log('setEntry', newDev)
                Database.setEntry(newDev,  _ => {
                    // console.log('setEntry done')
                    resolve(dbEntry);
                });
            });
        }).then(dbobject => {
            // console.log('resolving outer promise', dbobject)
            resolve(dbobject);
        });
    });
};


//*************************************************************************
// Receives Websocket messages
DeviceList.prototype.onopen = function (event) {
    wsConnected = true;
};

DeviceList.prototype.onclose = function (event) {
    if (wsConnected) {
        showConnectionLostMessage();
    }
    this.resetPage();
    this.message.textContent = messages.noWebsocket;

    // Retry in 2 seconds
    setTimeout(function () {
        WebsocketProtocol.open();
    }, 2000);
};

DeviceList.prototype.onmessage = function (event) {
    // console.log('DeviceList ws: ', event, data);
    let data = event.detail;

    // FIXME: handle situation when we return to that page while already
    // connected to a transmitter
    if (data[0] === 0x30) {
        this.transmitterReadyForConnect(data);
    }
};

//*************************************************************************
function showConnectionLostMessage () {
    // FIXME: the 'toast; should be one element for the whole app!
    var toast = document.querySelector('#app-device_list-toast');
    var message = {
        message: 'Connection lost',
        timeout: 10000
    };
    toast.MaterialSnackbar.showSnackbar(message);
}


window['DeviceList'] = new DeviceList();
