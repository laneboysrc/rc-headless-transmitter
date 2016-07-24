'use strict';

var Utils       = require('./utils');
var MDLHelper   = require('./mdl_helper');
var DBObject    = require('./database_object');


var messages = {
    default: '',
    noWebsocket: 'Turn on the transmitter or bridge and ensure no other configurator is accessing it'
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



//*************************************************************************
var DeviceList = function DeviceList() {
    this.loading = document.querySelector('#app-device_list-loading');
    this.list = document.querySelector('#app-device_list-list');
    this.container = document.querySelector('#app-device_list-container');
    this.template = document.querySelector('#app-device_list-template').content;

    WebsocketProtocol.addEventListener(this.on.bind(this));
};

//*************************************************************************
DeviceList.prototype.init = function (params) {
    var mdl = new MDLHelper();

    this.loading.classList.remove('hidden');
    this.list.classList.add('hidden');
    availableTransmitters = [];

    // Empty the list of transmitters
    mdl.clearDynamicElements(this.list);

    mdl.setTextContentRaw('#app-device_list-message', messages.default);

    Utils.showPage('device_list');

    WebsocketProtocol.open();
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
    var mdl = new MDLHelper();

    this.list.classList.remove('hidden');
    this.loading.classList.add('hidden');

    var t = this.template;
    t.querySelector('div').classList.add('can-delete');
    t.querySelector('button').setAttribute('data-index', index);
    mdl.setTextContentRaw('#app-device_list-template-name', transmitterName, t);

    var clone = document.importNode(t, true);
    this.container.appendChild(clone);
};

//*************************************************************************
DeviceList.prototype.edit = function (index) {
    state = STATES.CONNECTING;
    WebsocketProtocol.send(packets.CFG_REQUEST_TO_CONNECT);
};

//*************************************************************************
// connect to the transmitter
// retrieve configVersion
//
// load TX UUID
// if TX UUID is not set
//     generate new UUID
//     write UUID to TX
//     write LAST_CHANGED to TX
// if TX UUID is in our database
//     load TX LAST_CHANGED
//     if TX LAST_CHANGED == database LAST_CHANGED
//         load dev.TX from database
//     else if TX LAST_CHANGED > database LAST_CHANGED
//         load TX into dev.TX
//         update dev.TX in database
//     else
//         load dev.TX from database
//         write dev.TX to TX
// else
//     load TX into dev.TX
//     add dev.TX to our database
//
// repeat same flow with MODEL
//
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
                state = STATES.GET_CONFIG;

                packet = WebsocketProtocol.makeReadPacket(0, 4);
                WebsocketProtocol.send(packet);
            }
            break;

        case STATES.GET_CONFIG:
            if (packet[0] === 0x52) {
                configVersion = Utils.getUint32(packet, 3);

                setupNewDevice(configVersion, 'TX');

                offset = newDev.count + newDev.offset;
                packet = WebsocketProtocol.makeReadPacket(offset, 29);
                WebsocketProtocol.send(packet);

                state = STATES.GET_TX;
            }
            break;

        case STATES.GET_TX:
        case STATES.GET_MODEL:
            if (packet[0] === 0x52) {
                offset = Utils.getUint16(packet, 1) - newDev.offset;
                count = packet.length - 3;

                console.log(offset, count)

                for (var i = 0; i < count; i++) {
                    newDev.data[offset + i] = packet[3 + i];
                }

                newDev.count += count;
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
                    console.info("DEV LOADED")

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

                        state = STATES.GET_MODEL;
                    }
                    else {
                        dev.MODEL = new DBObject(newDev);
                        state = STATES.IDLE;

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
            var mdl = new MDLHelper();
            mdl.setTextContentRaw('#app-device_list-message', messages.noWebsocket);
            setTimeout(WebsocketProtocol.open.bind(WebsocketProtocol), 2000);
            break;

        case 'onopen':
        case 'onerror':
            break;
    }
};

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
