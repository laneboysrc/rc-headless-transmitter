'use strict';

var Utils = require('./utils');


var WebsocketProtocol = function () {
    this.ws = undefined;
    this.cfgPacket = undefined;
    this.eventListeners = [];
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

// //*************************************************************************
// WebsocketProtocol.prototype.addEventListener = function (listener) {
//     if (this.eventListeners.indexOf(listener) < 0) {
//         this.eventListeners.push(listener);
//     }
// };

// //*************************************************************************
// WebsocketProtocol.prototype.removeEventListener = function (listener) {
//     while (this.eventListeners.indexOf(listener) >= 0 ) {
//         var index = this.eventListeners.indexOf(listener);
//         this.eventListeners.splice(index, 1);
//     }
// };

// //*************************************************************************
// WebsocketProtocol.prototype.notifyListeners = function (event, data) {
//     this.eventListeners.forEach(function (listener) {
//         listener(event, data);
//     });
// };

//*************************************************************************
WebsocketProtocol.prototype.sendCfgPacket_ = function () {
    if (this.cfgPacket) {
        if (this.cfgPacket instanceof Uint8Array) {
            this.ws.send(this.cfgPacket);
            // console.log('WS: sending ' + dumpUint8Array(this.cfgPacket));
        }
        else {
            console.error('WS: cfgPacket is not of type Uint8Array');
        }
        this.cfgPacket = undefined;
    }
};

//*************************************************************************
WebsocketProtocol.prototype.send = function (packet) {
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
    // console.log('WS: onopen');
    Utils.sendCustomEvent('ws-open');
    // this.notifyListeners('onopen');
};

WebsocketProtocol.prototype.onmessage = function(e) {
    // e.data contains received string

    if (e.data instanceof Blob) {
        var reader = new FileReader();

        reader.addEventListener("loadend", function () {
            var data = new Uint8Array(reader.result);
            // if (data[0] !== 73) {
            //     console.log("WS: onmessage " + dumpUint8Array(data));
            // }
            Utils.sendCustomEvent('ws-message', data);
            // this.notifyListeners('onmessage', data);
            this.sendCfgPacket_();
        }.bind(this));

        reader.readAsArrayBuffer(e.data);
    }
    else {
        // Process string here
        console.error("WS: onmessage: String received; should have been Blob!");
    }
};

WebsocketProtocol.prototype.onerror = function (e) {
    // console.log('WS: onerror', e);
    Utils.sendCustomEvent('ws-error', e);
    // this.notifyListeners('onerror', e);
};

WebsocketProtocol.prototype.onclose = function () {
    // console.log('WS: onclose');
    this.ws = undefined;
    Utils.sendCustomEvent('ws-close');
    // this.notifyListeners('onclose');
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
