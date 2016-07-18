#!/usr/bin/env nodejs
'use strict';

/* globals TEST_CONFIG_DATA: false */


console.log('=============================================');
console.log('Simulator: Headless TX bridged over Websocket');
console.log('=============================================');

var ws = require('nodejs-websocket');
// var dbObject = require('./database_object');

// console.log(dbObject);

// Import the configuration binary data we exported from a Headless TX
require('node-import');
imports('../web-app/_includes/test_data.js');

var PORT = 9706;

// Delay in milliseconds between packets, a Headless TX uses 5 ms when connected
// and 100 ms when not connected
var PACKET_REPEAT_TIME_MS = 5;
var PACKET_REPEAT_TIME_MS_NOT_CONNECTED = 100;


// DEBUG: slow down communication
PACKET_REPEAT_TIME_MS *= 100;
PACKET_REPEAT_TIME_MS_NOT_CONNECTED *= 30;


function uint8array2string (bytes) {
    var result = '';

    for (var i = 0; i < bytes.length; i++) {
        var code = bytes[i];
        if (code === 0) {
            return result;
        }
        result += String.fromCharCode(code);
    }

    return result;
}

function byte2string (byte) {
    var s = byte.toString(16);
    return (s.length < 2) ? ('0' + s)  : s;
}

function dumpUint8Array(data) {
  var result = [];

  for (var i = 0; i < data.length; i++) {
    result.push(byte2string(data[i]));

  }
  return result.join(' ');
}

function buildFreeToConnectPacket(name, voltage) {
    var packet = new Uint8Array(1 + 16 + 2);

    var bat = new Uint8Array(new Uint16Array([voltage]).buffer);

    packet[0] = 0x30;
    packet.set(name, 1);
    packet.set(bat, 1 + 16);
    return packet;
}


var tx_name = new Uint8Array(TEST_CONFIG_DATA.buffer, 20, 16);
var battery_mv = 3897;      // Simulated battery voltage of 3.897 V

console.log('Name of the simulated transmitter: ' + uint8array2string(tx_name));

var wsConnection;

// Configurator protocol state
var STATE = {NOT_CONNECTED: 'NOT_CONNECTED', CONNECTED: 'CONNECTED'};
var state = STATE.NOT_CONNECTED;


var packets = {
    'TX_FREE_TO_CONNECT': buildFreeToConnectPacket(tx_name, battery_mv),
    'TX_INFO': new Uint8Array([0x49])
};


ws.createServer(function (con) {
    if (wsConnection) {
        console.warn('A client is already connected, not accepting another connection');
        con.close();
        return;
    }

    console.log('Websocket client connected');
    wsConnection = con;

    con.sendPacket = function (packet) {
        con.send(new Buffer(packet));
    };

    con.on('text', function (str) {
        console.warn('Websocket received TEXT "' + str + '", ignored');
    });

    con.on('binary', function (inStream) {
        // Empty buffer for collecting binary data
        var data = new Buffer(0);

        // Read chunks of binary data and add to the buffer
        inStream.on('readable', function () {
            var newData = inStream.read();
            if (newData) {
                data = Buffer.concat([data, newData], data.length + newData.length);
            }
        });

        inStream.on('end', function () {
            // console.log('Websocket received ' + data.length + ' bytes of binary data');
            onPacket(new Uint8Array(data));
        });
    });

    con.on('close', function (code, reason) {
        console.log('Websocket connection closed');
        wsConnection = undefined;
    });
}).listen(PORT);


function handle_CFG_REQUEST_TO_CONNECT(packet) {
    state = STATE.CONNECTED;
}

function handle_CFG_READ(packet) {
    var dv = new DataView(packet.slice(1).buffer);
    var offset = dv.getUint16(0, true);
    var count = packet[3];

    console.log('READ offset: ' + offset + ', count: ' + count);

    if (count < 1  ||  count > 29) {
        console.error('Count must be between 1 and 29');
        return;
    }

    if ((offset + count) > TEST_CONFIG_DATA.length) {
        console.error('Request out of config area');
        return;
    }



}

function handle_CFG_WRITE(packet) {

}

function handle_CFG_COPY(packet) {

}

function handle_CFG_DISCONNECT(packet) {
    console.log('DISCONNECT');
    state = STATE.NOT_CONNECTED;
}

function onPacketNotConnected(packet) {
    switch (packet[0]) {
        case 0x31:
            handle_CFG_REQUEST_TO_CONNECT();
            break;

        default:
            console.log('Command 0x' + byte2string(packet[0]) +
                ' invalid for state NOT_CONNECTED');
    }
}

function onPacketConnected(packet) {
    switch (packet[0]) {
        case 0x72:
            handle_CFG_READ(packet);
            break;

        case 0x77:
            handle_CFG_WRITE(packet);
            break;

        case 0x63:
            handle_CFG_COPY(packet);
            break;

        case 0x64:
            handle_CFG_DISCONNECT(packet);
            break;

        default:
            console.log('Command 0x' + byte2string(packet[0]) +
                ' invalid for state CONNECTED');
    }
}


function onPacket(packet) {
    console.log(dumpUint8Array(packet));

    switch (state) {
        case STATE.NOT_CONNECTED:
            onPacketNotConnected(packet);
            break;

        case STATE.CONNECTED:
            onPacketConnected(packet);
            break;
    }
}


function rfBurstLoop() {
    if (wsConnection) {
        switch (state) {
            case STATE.NOT_CONNECTED:
                wsConnection.sendPacket(packets['TX_FREE_TO_CONNECT']);
                break;

            case STATE.CONNECTED:
                wsConnection.sendPacket(packets['TX_INFO']);
                break;
        }
    }
    else {
        state = STATE.NOT_CONNECTED;
    }

    // In connected state send a packet every 5 ms, otherwise every 100 ms
    if (state === STATE.CONNECTED) {
        setTimeout(rfBurstLoop, PACKET_REPEAT_TIME_MS);
    }
    else {
        setTimeout(rfBurstLoop, PACKET_REPEAT_TIME_MS_NOT_CONNECTED);
    }
}

setTimeout(rfBurstLoop, PACKET_REPEAT_TIME_MS_NOT_CONNECTED);

console.log('Websocket server started, please contact me at port ' + PORT + '\n');
