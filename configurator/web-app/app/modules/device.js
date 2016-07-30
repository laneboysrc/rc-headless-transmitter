'use strict';

var Utils = require('./utils');

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
    console.log(`Device.connect uuid=${uuid}`)

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
                dev.connected = true;
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
        dev.connected = false;
        resolve('disconnect: FIXME');
    });
};

Device.prototype.read = function (offset, count) {
    console.log(`Device.read o=${offset} c=${count}`)

    // FIXME: needs a 600ms timeout (between individual reads)

    return new Promise((resolve, reject) => {
        var data = new Uint8Array(count);
        var packetCount;
        var packetOffset = offset;

        if (!dev.connected) {
            reject(new Error('Device.read: device not connected'));
            return;
        }

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
    console.log(`Device.write o=${offset} c=${data.length}`)

    // FIXME: needs a 600ms timeout (between individual reads)

    var count = data.length;

    return new Promise((resolve, reject) => {
        var packetCount;
        var packetOffset = offset;

        if (!dev.connected) {
            reject(new Error('Device.write: device not connected'));
            return;
        }

        function writeChunk() {
            console.log(`writeChunk count=${count} packetOffset=${packetOffset}`)
            if (count === 0) {
                WebsocketProtocol.removeEventListener(onevent);
                resolve();
                return;
            }

            packetCount = count;

            if (packetCount > 29) {
                packetCount = 29;
            }

            let dataOffset = packetOffset - offset;
            let packet = WebsocketProtocol.makeWritePacket(
                packetOffset, data.slice(dataOffset, dataOffset + packetCount));
            WebsocketProtocol.send(packet);
        }


        function onevent(event, packet) {
            if (event !== 'onmessage') {
                return;
            }

            if (packet[0] !== 0x57) {
                return;
            }

            // FIXME: this will only work once we change the protocol
            // let write_offset = Utils.getUint16(packet, 1);
            // let write_count = packet.length - 3;

            // if (write_offset !== packetOffset  &&  write_count !== packetCount) {
            //     return;
            // }

            count -= packetCount;
            packetOffset += packetCount;
            writeChunk();
        }

        WebsocketProtocol.addEventListener(onevent);
        writeChunk();
    });
};

Device.prototype.copy = function (src, dst, count) {
    return new Promise((resolve, reject) => {
        console.log('copy: FIXME');
        resolve();
    });
};


//*************************************************************************
// Receives Websocket messages
Device.prototype.on = function (event, data) {
    // console.log('Device ws: ', event, data);

    switch(event) {
        case 'onmessage':
            break;

        case 'onclose':
            this.connected = false;
            break;

        case 'onopen':
            break;

        case 'onerror':
            break;
    }
};

window['dev'] = new Device();
