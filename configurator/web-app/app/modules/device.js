'use strict';

var Utils = require('./utils');


//*************************************************************************
// Split up the requested read/write block into small chunks since a single
// read/write request can only handle up to 29 bytes. We return those chunks in
// a list that can be requested one-by-one.
function buildChunks(offset, count, maxChunkSize) {
    var chunks = [];

    maxChunkSize = maxChunkSize || 29;

    while (count) {
        let len = count > maxChunkSize ? maxChunkSize : count;
        chunks.push({
            o: offset,
            c: len
        });

        offset += len;
        count -= len;
    }

    return chunks;
}


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


//*************************************************************************
Device.prototype.enableCommunication = function () {
    // start WS
};

//*************************************************************************
Device.prototype.disableCommunication = function () {
    // stop WS, kill restart timer
};

//*************************************************************************
Device.prototype.addEventListener = function () {
    // Events:
    //    onopen
    //    onclose
    //    onnewdevice
};

//*************************************************************************
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

//*************************************************************************
Device.prototype.disconnect = function () {
    return new Promise((resolve, reject) => {
        dev.connected = false;
        resolve('disconnect: FIXME');
    });
};

//*************************************************************************
Device.prototype.read = function (offset, count) {
    console.log(`Device.read o=${offset} c=${count}`)

    if (!dev.connected) {
        return Promise.reject(Error('Device.read: not connected'));
    }

    // FIXME: needs a 600ms timeout (between individual reads)
    // FIXME: progress callback using reacChunks initial length as reference

    return new Promise((resolve, reject) => {
        var data = new Uint8Array(count);
        var readChunks = buildChunks(offset, count);
        var nextChunk = 0;

        function onevent(event, packet) {
            if (event !== 'onmessage') {
                return;
            }

            if (packet[0] === 0x52) {
                let o = Utils.getUint16(packet, 1);
                let c = packet.length - 3;

                // Check if the read data is one of the chunks we are looking
                // for. If yes, store the data at the appropriate offset
                // and remove the chunk from our request list.
                let index = readChunks.findIndex((element, index, array) => {
                    return element.o === o  &&  element.c === c;
                });
                if (index >= 0) {
                    data.set(packet.slice(3), o - offset);
                    readChunks.splice(index, 1);
                }
            }

            // Read the next chunk regardless if we received the previous
            // data or not. On slow computers this causes quite a bit of
            // redundant read requests, but it also automatically retries until
            // all data was received.
            readChunk();
        }

        function readChunk() {
            if (readChunks.length === 0) {
                WebsocketProtocol.removeEventListener(onevent);
                resolve(data);
                return;
            }

            // Important: we modulo readRequest.length here, because the
            // readRequest may have had elements removed. The modulo also causes
            // us to automatically loop through all chunks until we don't have
            // any thing to request.
            let request = readChunks[nextChunk % readChunks.length];
            let packet = WebsocketProtocol.makeReadPacket(request.o, request.c);
            WebsocketProtocol.send(packet);

            nextChunk++;
        }

        WebsocketProtocol.addEventListener(onevent);
        readChunk();
    });
};


//*************************************************************************
Device.prototype.write = function (offset, data) {
    console.log(`Device.write o=${offset} c=${data.length}`)

    if (!dev.connected) {
        return Promise.reject(Error('Device.write: not connected'));
    }

    // FIXME: needs a 600ms timeout (between individual reads)
    // FIXME: progress callback using writeChunks initial length as reference

    return new Promise((resolve, reject) => {
        var writeChunks = buildChunks(offset, data.length);
        var nextChunk = 0;

        function onevent(event, packet) {
            if (event !== 'onmessage') {
                return;
            }

            if (packet[0] === 0x57) {
                let o = Utils.getUint16(packet, 1);
                let c = packet[3];

                // Check if the read data is one of the chunks we are looking
                // for. If yes, store the data at the appropriate offset
                // and remove the chunk from our request list.
                let index = writeChunks.findIndex((element, index, array) => {
                    return element.o === o  &&  element.c === c;
                });
                if (index >= 0) {
                    writeChunks.splice(index, 1);
                }
            }

            // Read the next chunk regardless if we received the previous
            // data or not. On slow computers this causes quite a bit of
            // redundant read requests, but it also automatically retries until
            // all data was received.
            writeChunk();
        }

        function writeChunk() {
            if (writeChunks.length === 0) {
                WebsocketProtocol.removeEventListener(onevent);
                resolve();
                return;
            }

            // Important: we modulo readRequest.length here, because the
            // readRequest may have had elements removed. The modulo also causes
            // us to automatically loop through all chunks until we don't have
            // any thing to request.
            let request = writeChunks[nextChunk % writeChunks.length];

            let dataOffset = request.o - offset;
            let packet = WebsocketProtocol.makeWritePacket(
                request.o, data.slice(dataOffset, dataOffset + request.c));
            WebsocketProtocol.send(packet);

            nextChunk++;
        }

        WebsocketProtocol.addEventListener(onevent);
        writeChunk();
    });
};


//*************************************************************************
Device.prototype.copy = function (src, dst, count) {
    if (!dev.connected) {
        return Promise.reject(Error('Device.copy: not connected'));
    }

    return new Promise((resolve, reject) => {
        console.log('copy: FIXME');
        resolve();
    });
};


//*************************************************************************
// Receives Websocket events
Device.prototype.on = function (event, data) {
    // console.log('Device ws: ', event, data);
    if (event !== 'onclose') {
        return;
    }

    this.connected = false;
};

window['dev'] = new Device();
