'use strict';

var Utils       = require('./utils');
var MDLHelper   = require('./mdl_helper');
var DBObject    = require('./database_object');


var messages = {
    default: '',
    noWebsocket: 'Turn on the transmitter or bridge and ensure no other configurator is accessing it'
};

var STATES = {
    idle: 'idle',
    connecting: 'connecting',
    getConfig: 'getConfig',
    getModel: 'getModel',
    getTx: 'getTx'
};

//*************************************************************************
var DeviceList = function DeviceList() {
    this.loading = document.querySelector('#app-device_list-loading');
    this.list = document.querySelector('#app-device_list-list');
    this.container = document.querySelector('#app-device_list-container');
    this.template = document.querySelector('#app-device_list-template').content;
    this.availableTransmitters = [];
    this.state = STATES.idle;
    this.count = 0;
    this.tx = undefined;
    this.model = undefined;

    WebsocketProtocol.addEventListener(this.on.bind(this));
};

//*************************************************************************
DeviceList.prototype.init = function (params) {
    var mdl = new MDLHelper();

    this.loading.classList.remove('hidden');
    this.list.classList.add('hidden');
    this.availableTransmitters = [];

    // Empty the list of transmitters
    mdl.clearDynamicElements(this.list);

    mdl.setTextContentRaw('#app-device_list-message', messages.default);

    Utils.showPage('device_list');

    WebsocketProtocol.open();
};

//*************************************************************************
DeviceList.prototype.transmitterReadyForConnect = function (data) {
    var transmitterName = Utils.uint8array2string(data.slice(1, 16 + 1));
    if (this.availableTransmitters.indexOf(transmitterName) >= 0) {
        return;
    }
    this.availableTransmitters.push(transmitterName);

    console.log('New transmitter: ' + transmitterName);

    var index = this.availableTransmitters.indexOf(transmitterName);
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
    this.state = STATES.connecting;

    var packet = new Uint8Array([
        0x31,
        0x12, 0x13, 0x14, 0x15, 0x16,
        0x40, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49,
        0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50, 0x51, 0x52, 0x53]);

    WebsocketProtocol.send(packet);
};

//*************************************************************************
DeviceList.prototype.stateMachine = function (packet) {
    var bo;

    switch (this.state) {
        case STATES.connecting:
            if (packet[0] === 0x49) {
                this.state = STATES.getConfig;

                WebsocketProtocol.send(new Uint8Array([
                    0x72, 0x00, 0x00, 4
                ]));
            }
            break;

        case STATES.getConfig:
            if (packet[0] === 0x52) {
                var version = Utils.getUint32(packet, 3);
                console.log('version=' + version);

                this.count = 0;
                this.size = CONFIG_VERSIONS[1].TX.s;
                this.offset = CONFIG_VERSIONS[1].TX.o;
                this.tx = new Uint8Array(this.size);

                bo = this.count + this.offset;
                WebsocketProtocol.send(new Uint8Array([
                    0x72, bo % 256, parseInt(bo / 256), 29
                ]));

                this.state = STATES.getTx;
            }
            break;

        case STATES.getTx:
            if (packet[0] === 0x52) {
                var offset = Utils.getUint16(packet, 1) - this.offset;
                var count = packet.length - 3;

                console.log(offset, count);

                for (var i = 0; i < count; i++) {
                    this.tx[offset + i] = packet[3 + i];
                }

                this.count += count;
                if (this.count < this.size) {
                    bo = this.count + this.offset;

                    var n = this.size - this.count;
                    if (n > 29) {
                        n = 29;
                    }

                    WebsocketProtocol.send(new Uint8Array([
                        0x72, bo % 256, parseInt(bo / 256), n
                    ]));
                }
                else {
                    console.info("TX LOADED!")

                    var schema = CONFIG_VERSIONS[1].TX;

                    var uuid_bytes = new Uint8Array(this.tx, schema['UUID'].o, schema['UUID'].s);
                    var uuid = Utils.uuid2string(uuid_bytes);

                    var data_to_add = {
                        data: this.tx,
                        uuid: uuid,
                        schemaName: 'TX',
                        configVersion: 1,
                        lastChanged: 0      // FIXME: read from data
                    };

                    dev.TX = new DBObject(data_to_add);


                    this.count = 0;
                    this.size = CONFIG_VERSIONS[1].MODEL.s;
                    this.offset = CONFIG_VERSIONS[1].MODEL.o;
                    this.model = new Uint8Array(this.size);

                    bo = this.count + this.offset;
                    WebsocketProtocol.send(new Uint8Array([
                        0x72, bo % 256, parseInt(bo / 256), 29
                    ]));

                    this.state = STATES.getModel;

                }
            }
            break;


        case STATES.getModel:
            if (packet[0] === 0x52) {
                var offset = Utils.getUint16(packet, 1) - this.offset;
                var count = packet.length - 3;

                console.log(offset, count);

                for (var i = 0; i < count; i++) {
                    this.model[offset + i] = packet[3 + i];
                }

                this.count += count;
                if (this.count < this.size) {
                    bo = this.count + this.offset;

                    var n = this.size - this.count;
                    if (n > 29) {
                        n = 29;
                    }

                    WebsocketProtocol.send(new Uint8Array([
                        0x72, bo % 256, parseInt(bo / 256), n
                    ]));
                }
                else {
                    console.info("MODEL LOADED!")

                    var schema = CONFIG_VERSIONS[1].MODEL;

                    var uuid_bytes = new Uint8Array(this.model, schema['UUID'].o, schema['UUID'].s);
                    var uuid = Utils.uuid2string(uuid_bytes);

                    var data_to_add = {
                        data: this.model,
                        uuid: uuid,
                        schemaName: 'MODEL',
                        configVersion: 1,
                        lastChanged: 0      // FIXME: read from data
                    };

                    dev.MODEL = new DBObject(data_to_add);

                    this.state = STATES.idle;

                    location.hash = Utils.buildURL(['model_details']);


                }
            }
            break;

        default:
            break;
    }

}


//*************************************************************************
// Receives Websocket messages
DeviceList.prototype.on = function (event, data) {
    // console.log('DeviceList ws: ', event, data);

    switch(event) {
        case 'onmessage':
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


window['DeviceList'] = new DeviceList();
