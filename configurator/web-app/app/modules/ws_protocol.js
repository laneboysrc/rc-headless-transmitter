'use strict';

var Utils = require('./utils');


var WebsocketProtocol = function () {
    this.ws = undefined;
    this.cfgPacket = undefined;
};

//*************************************************************************
WebsocketProtocol.prototype.open = function () {
    if (this.ws) {
        return;
    }

    // Connect to the Websocket of the bridge
    this.ws = new WebSocket('ws://' + location.hostname + ':9706/');

    // Set event handlers
    this.ws.onopen = this.onopen.bind(this);
    this.ws.onmessage = this.onmessage.bind(this);
    this.ws.onclose = this.onclose.bind(this);
    this.ws.onerror = this.onerror.bind(this);
};

//*************************************************************************
WebsocketProtocol.prototype.close = function () {
    if (this.ws) {
        this.ws.close();
    }
};

//*************************************************************************
WebsocketProtocol.prototype._sendCfgPacket = function () {
    if (this.cfgPacket) {
        this.ws.send(this.cfgPacket);
        // console.log('WS: sending ' + dumpUint8Array(this.cfgPacket));
        this.cfgPacket = undefined;
    }
};

//*************************************************************************
WebsocketProtocol.prototype.send = function (packet) {
    if (!(packet instanceof Uint8Array)) {
        throw Error('WS: packet is not of type Uint8Array');
    }
    this.cfgPacket = packet;
};

//*************************************************************************
WebsocketProtocol.prototype.makeReadPacket = function (offset, count) {
    if (count > 29) {
        count = 29;
    }

    var packet = new Uint8Array([0x72, 0, 0, 0]);
    Utils.setUint16(packet, offset, 1);
    packet[3] = count;
    return packet;
};

//*************************************************************************
WebsocketProtocol.prototype.makeWritePacket = function (offset, data) {
    var packet = new Uint8Array(3 + data.length);
    packet[0] = 0x77;
    Utils.setUint16(packet, offset, 1);
    packet.set(data, 3);

    return packet;
};


//*************************************************************************
WebsocketProtocol.prototype.onopen = function() {
    Utils.sendCustomEvent('ws-open');
};

//*************************************************************************
WebsocketProtocol.prototype.onmessage = function(e) {
    // e.data contains received string

    if (!(e.data instanceof Blob)) {
        throw Error('WS: onmessage: String received; should have been Blob');
    }

    var reader = new FileReader();

    reader.addEventListener("loadend", function () {
        let data = new Uint8Array(reader.result);
        this._sendCfgPacket();
        Utils.sendCustomEvent('ws-message', data);
    }.bind(this));

    reader.readAsArrayBuffer(e.data);
};

//*************************************************************************
WebsocketProtocol.prototype.onerror = function (e) {
    Utils.sendCustomEvent('ws-error', e);
};

//*************************************************************************
WebsocketProtocol.prototype.onclose = function () {
    this.ws = undefined;
    Utils.sendCustomEvent('ws-close');
};


//*************************************************************************
function dumpUint8Array(data) {
    var result = [];
    data.forEach(function (byte) {
        result.push(Utils.byte2string(byte));
    });

    var response = result.join(' ');

    while (response.length < ((32 * 3) + 2)) {
        response += ' ';
    }

    data.forEach(function (byte) {
        if (byte <= 32  ||  byte > 126) {
            response += '.';
        }
        else {
            response += String.fromCharCode(byte);
        }
    });

    return response;
}

window['WebsocketProtocol'] = new WebsocketProtocol();
