'use strict';

var Utils       = require('./utils');
var MDLHelper   = require('./mdl_helper');

var messages = {
    default: '',
    noWebsocket: 'Turn on the transmitter or bridge and ensure no other configurator is accessing it'
};

//*************************************************************************
var DeviceList = function DeviceList() {
    this.loading = document.querySelector('#app-device_list-loading');
    this.list = document.querySelector('#app-device_list-list');
    this.container = document.querySelector('#app-device_list-container');
    this.template = document.querySelector('#app-device_list-template').content;
    this.availableTransmitters = [];

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
    console.log('edit: ' + this.availableTransmitters[index])
};


//*************************************************************************
// Receives Websocket messages
DeviceList.prototype.on = function (event, data) {
    // console.log('DeviceList ws: ', event, data);

    switch(event) {
        case 'onmessage':
            if (data[0] === 0x30) {
                this.transmitterReadyForConnect(data);
            }
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
