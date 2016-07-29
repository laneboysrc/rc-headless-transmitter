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

var STATES = {
    IDLE: 'IDLE',
    CONNECTING: 'CONNECTING',
    GET_CONFIG: 'GET_CONFIG',
    GET_MODEL: 'GET_MODEL',
    GET_TX: 'GET_TX'
};

var availableTransmitters = [];
var state = STATES.idle;
var newDev = {};
var packets = {
    CFG_REQUEST_TO_CONNECT: new Uint8Array([
        0x31,
        0x12, 0x13, 0x14, 0x15, 0x16,
        0x40, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49,
        0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50, 0x51, 0x52, 0x53]),
    CFG_READ: new Uint8Array([0x72, 0, 0, 0]),
};

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

    WebsocketProtocol.addEventListener(this.on.bind(this));
};

//*************************************************************************
DeviceList.prototype.init = function (params) {
    this.resetPage();

    Utils.showPage('device_list');
    WebsocketProtocol.close();
    WebsocketProtocol.open();
};

//*************************************************************************
DeviceList.prototype.resetPage = function () {
    this.loading.classList.remove('hidden');
    this.list.classList.add('hidden');
    this.txLoading.classList.add('hidden');
    availableTransmitters = [];

    // Empty the list of transmitters
    this.mdl.clearDynamicElements(this.list);
    this.message.textContent = messages.default;
    state = STATES.IDLE;
    dev.connected = false;
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
    this.mdl.setTextContentRaw('#app-device_list-loading_transmitter__name', availableTransmitters[index]);

    this.list.classList.add('hidden');
    this.txLoading.classList.remove('hidden');
    this.txProgress.classList.add('mdl-progress--indeterminate');
    this.txMessage.textContent = messages.connecting;

    state = STATES.CONNECTING;
    WebsocketProtocol.send(packets.CFG_REQUEST_TO_CONNECT);

    // this.load(FIXME-get-uuid);
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

    dev.connect().then(_ => {
        return dev.read(0, 4);
    }).then(data => {
        configVersion = Utils.getUint32(data);
        console.log(data);
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
        this.resetPage();
    });
};

//*************************************************************************
// load [schemaName] UUID
// if [schemaName] UUID is not set
//     generate new UUID
//     write UUID to [schemaName]
//     write LAST_CHANGED to [schemaName]
// if [schemaName] UUID is in our database
//     load [schemaName] LAST_CHANGED
//     if [schemaName] LAST_CHANGED == database LAST_CHANGED
//         load dev.[schemaName] from database
//     else if [schemaName] LAST_CHANGED > database LAST_CHANGED
//         load [schemaName] into dev.[schemaName]
//         update dev.[schemaName] in database
//     else
//         load dev.[schemaName] from database
//         write dev.[schemaName] to [schemaName]
// else
//     load [schemaName] into dev.[schemaName]
//     add dev.[schemaName] to our database
DeviceList.prototype.loadDevice = function (configVersion, schemaName) {
    const schema = CONFIG_VERSIONS[configVersion][schemaName];
    var newDev = {};
    var dbEntry;

    newDev.configVersion = configVersion;
    newDev.schemaName = schemaName;
    newDev.data = new Uint8Array(schema.s);

    var o = schema.o;

    console.log("loadDevice", configVersion, schemaName)
    return new Promise((resolve, reject) => {
        dev.read(o + schema['UUID'].o, schema['UUID'].c).then(data => {
            console.log('UUID bytes', data);
            newDev.uuid = Utils.uuid2string(data);
            if (!Utils.isValidUUID(newDev.uuid)) {
                newDev.uuid = Utils.newUUID();
                return dev.write(o + schema['UUID'].o, schema['UUID'].s,
                    Utils.string2uuid(newDev.uuid));
            }
            return Promise.resolve();
        }).then(_ => {
            return new Promise((resolve, reject) => {
                Database.getEntry(newDev.uuid, data => {
                    resolve(new DBObject(data));
                });
            });
        }).then(data => {
            dbEntry = data;
            if (dbEntry.get('UUID') === newDev.uuid)  {
                console.log('Device is in the database already');
                return new Promise((resolve, reject) => {
                    dev.read(o + schema['LAST_CHANGED'].o, schema['LAST_CHANGED'].s).then(data => {
                        newDev.lastChanged = Utils.getUint32(data);

                        console.log('LAST_CHANGED', newDev.lastChanged)

                        if (newDev.lastChanged === dbEntry.lastChanged) {
                            console.log('device === db')
                            console.log(dbEntry)
                            resolve(dbEntry);
                        }
                        else if (newDev.lastChanged > dbEntry.lastChanged) {
                            console.log('device > db')
                            return this.loadDeviceData(newDev);
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
            console.log("RESOLVING", schemaName)
            dev[newDev.schemaName] = dbobject;
            resolve();
        });
    });
};

//*************************************************************************
DeviceList.prototype.loadDeviceData = function (newDev) {
    const schema = CONFIG_VERSIONS[newDev.configVersion][newDev.schemaName];
    return new Promise((resolve, reject) => {
        dev.read(schema.o, schema.s).then(data => {
            newDev.data = data;
            return new Promise((resolve, reject) => {
                Database.getEntry(newDev.uuid, newDev, _ => {
                    resolve(new DBObject(data));
                });
            });
        });
    });
};



//*************************************************************************
DeviceList.prototype.stateMachine = function (packet) {
    var configVersion;
    var offset;
    var count;
    var schemaName;
    var schema;
    var uuid_bytes;

    switch (state) {
        case STATES.CONNECTING:
            if (packet[0] === 0x49) {
                // state = STATES.GET_CONFIG;

                // Read the configVersion
                // packet = WebsocketProtocol.makeReadPacket(0, 4);
                // WebsocketProtocol.send(packet);

                // FIXME:
                console.log('CONNECTED!');
                this.resetPage();
                this.loading.classList.add('hidden');

            }
            break;

        case STATES.GET_CONFIG:
            if (packet[0] === 0x52) {
                configVersion = Utils.getUint32(packet, 3);

                setupNewDevice(configVersion, 'TX');

                offset = newDev.count + newDev.offset;
                packet = WebsocketProtocol.makeReadPacket(offset, 29);
                WebsocketProtocol.send(packet);

                this.progress = {};
                this.progress.s = CONFIG_VERSIONS[configVersion]['TX'].s +
                                  CONFIG_VERSIONS[configVersion]['MODEL'].s;
                this.progress.o = 0;

                this.txProgress.classList.remove('mdl-progress--indeterminate');
                this.txProgress.MaterialProgress.setProgress(0);
                this.txMessage.textContent = messages.loading;
                state = STATES.GET_TX;
            }
            break;

        case STATES.GET_TX:
        case STATES.GET_MODEL:
            if (packet[0] === 0x52) {
                offset = Utils.getUint16(packet, 1) - newDev.offset;
                count = packet.length - 3;

                // console.log(offset, count)

                newDev.data.set(packet.slice(3), offset);
                newDev.count += count;

                this.progress.o += count;
                this.txProgress.MaterialProgress.setProgress(100 * this.progress.o / this.progress.s);

                if (newDev.count < newDev.size) {
                    // newDev lot fully loaded yet, so continue with the next
                    // packet

                    // makeReadPacket clamps count to 29, so we don't have to
                    // worry about that here
                    count = newDev.size - newDev.count;
                    offset = newDev.count + newDev.offset;

                    packet = WebsocketProtocol.makeReadPacket(offset, count);
                    WebsocketProtocol.send(packet);
                }
                else {
                    // newDev has been fully retrieved
                    configVersion = newDev.configVersion;
                    schemaName = newDev.schemaName;
                    schema = CONFIG_VERSIONS[configVersion][schemaName];

                    uuid_bytes = new Uint8Array(newDev.data, schema['UUID'].o, schema['UUID'].s);
                    newDev.uuid = Utils.uuid2string(uuid_bytes);
                    newDev.lastChanged = Utils.getUint32(newDev.data, schema['LAST_CHANGED'].o);

                    if (state === STATES.GET_TX) {
                        dev.TX = new DBObject(newDev);

                        setupNewDevice(configVersion, 'MODEL');

                        offset = newDev.count + newDev.offset;
                        packet = WebsocketProtocol.makeReadPacket(offset, 29);
                        WebsocketProtocol.send(packet);

                        this.txMessage.textContent = messages.model;
                        state = STATES.GET_MODEL;
                    }
                    else {
                        dev.MODEL = new DBObject(newDev);
                        state = STATES.IDLE;

                        dev.connected = true;
                        location.hash = Utils.buildURL(['model_details']);
                    }
                }
            }
            break;

        default:
            break;
    }
};

//*************************************************************************
// Receives Websocket messages
DeviceList.prototype.on = function (event, data) {
    // console.log('DeviceList ws: ', event, data);

    switch(event) {
        case 'onmessage':
            // FIXME: handle situation when we return to that page while already
            // connected to a transmitter
            if (data[0] === 0x30) {
                this.transmitterReadyForConnect(data);
            }

            this.stateMachine(data);
            break;

        case 'onclose':
            if (wsConnected) {
                showConnectionLostMessage();
            }
            this.resetPage();
            this.message.textContent = messages.noWebsocket;

            // Retry in 2 seconds
            setTimeout(function () {
                WebsocketProtocol.open();
            }, 2000);
            break;

        case 'onopen':
            wsConnected = true;
            break;

        case 'onerror':
            break;
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

//*************************************************************************
function setupNewDevice(configVersion, schemaName) {
    newDev = {};

    newDev.count = 0;
    newDev.size = CONFIG_VERSIONS[configVersion][schemaName].s;
    newDev.offset = CONFIG_VERSIONS[configVersion][schemaName].o;

    newDev.configVersion = configVersion;
    newDev.schemaName = schemaName;
    newDev.data = new Uint8Array(newDev.size);
}

window['DeviceList'] = new DeviceList();
