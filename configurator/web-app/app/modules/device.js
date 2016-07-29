'use strict';

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
