'use strict';

var Utils = require('./utils');

var queue = [];

// A global object that holds the currently loaded transmitter and model
// object.
//
// These objects determine the values shown and manipulated on almost all
// pages of the configurator app.
var Device = function () {
    this.MODEL = undefined;
    this.TX = undefined;
    this.connected = false;

    WebsocketProtocol.addEventListener(this.on.bind(this));
};


Device.prototype.enableCommunication = function () {
    // start WS
};

Device.prototype.disableCommunication = function () {
    // stop WS, kill restart timer
};

Device.prototype.addEventListener = function () {
    // Events:
    //    onopen
    //    onclose
    //    onnewdevice
};

Device.prototype.connect = function (uuid) {
    return new Promise((resolve, reject) => {
        let connectPacket = new Uint8Array([
            0x31,
            0x12, 0x13, 0x14, 0x15, 0x16,
            0x40, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49,
            0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50, 0x51, 0x52, 0x53]);

        function onevent(event, packet) {
            if (event !== 'onmessage') {
                return;
            }

            if (packet[0] === 0x49) {
                WebsocketProtocol.removeEventListener(onevent);
                resolve();
                return;
            }

            WebsocketProtocol.send(connectPacket);
        }


        WebsocketProtocol.addEventListener(onevent);
        WebsocketProtocol.send(connectPacket);
    });
};

Device.prototype.disconnect = function () {
    return new Promise((resolve, reject) => {
        resolve('disconnect: FIXME');
    });
};

Device.prototype.read = function (offset, count) {
    console.log(`Device.prototype.read o=${offset} c=${count}`)

    // FIXME: needs a 600ms timeout (between individual reads)

    return new Promise((resolve, reject) => {
        var data = new Uint8Array(count);
        var packetCount;
        var packetOffset = offset;

        function readChunk() {
            if (count === 0) {
                WebsocketProtocol.removeEventListener(onevent);
                resolve(data);
                return;
            }

            packetCount = count;

            if (packetCount > 29) {
                packetCount = 29;
            }

            let packet = WebsocketProtocol.makeReadPacket(packetOffset, packetCount);
            WebsocketProtocol.send(packet);
        }


        function onevent(event, packet) {
            if (event !== 'onmessage') {
                return;
            }

            if (packet[0] !== 0x52) {
                return;
            }

            let read_offset = Utils.getUint16(packet, 1);
            let read_count = packet.length - 3;

            if (read_offset !== packetOffset  &&  read_count !== packetCount) {
                return;
            }

            data.set(packet.slice(3), packetOffset - offset);
            count -= packetCount;
            packetOffset += packetCount;
            readChunk();
        }

        WebsocketProtocol.addEventListener(onevent);
        readChunk();
    });
};

Device.prototype.write = function (offset, data) {
    return new Promise((resolve, reject) => {
        console.log('write: FIXME');
        resolve();
    });
};

Device.prototype.copy = function (src, dst, count) {
    return new Promise((resolve, reject) => {
        console.log('copy: FIXME');
        resolve();
    });
};

//*************************************************************************
Device.prototype.queueWrite = function (offset, data) {
    if (!this.connected) {
        queue = [];
        return;
    }

    // FIXME: if we need to handle data.length > 29 bytes then we may
    // recursively call this function repetitively to write smaller chunks
    if (data.length > 29) {
        console.error('Device.queueWrite: Trying to queue more than 29 bytes');
        return;
    }

    var updatedQueue = [];
    queue.forEach(function (write) {
        // Put the existing write request only in the queue if it is has a
        // different offset, or larger length then the newly requested write.
        // Otherwise the new write overwrites the earlier one, so we don't need
        // to execute it.
        if (write.offset !== offset  &&  write.data.length > data.length) {
            updatedQueue.push(write);
        }
    });
    updatedQueue.push({offset: offset, data: data});

    queue = updatedQueue;
};

//*************************************************************************
// Receives Websocket messages
Device.prototype.on = function (event, data) {
    // console.log('Device ws: ', event, data);

    switch(event) {
        case 'onmessage':
            // Send a pending write request only if we received a command other
            // then TX_FREE_TO_CONNECT
            if (queue.length  &&  data !== 0x30) {
                var write = queue.pop();
                var packet = WebsocketProtocol.makeWritePacket(write.offset, write.data);
                WebsocketProtocol.send(packet);
            }
            break;

        case 'onclose':
            queue = [];
            this.connected = false;
            break;

        case 'onopen':
            break;

        case 'onerror':
            break;
    }
};

window['dev'] = new Device();
