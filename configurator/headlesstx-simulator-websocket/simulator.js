#!/usr/bin/env nodejs
/* globals TEST_CONFIG_DATA: false */
'use strict';

var server = require('./configurator_ws_server');
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
PACKET_REPEAT_TIME_MS = 500;
PACKET_REPEAT_TIME_MS_NOT_CONNECTED = 1000;

// Configurator protocol state
var STATE = {NOT_CONNECTED: 'NOT_CONNECTED', CONNECTED: 'CONNECTED'};
var state = STATE.NOT_CONNECTED;

var packets = {
    TX_FREE_TO_CONNECT: allocatePacket(0x30, 1 + 16 + 2),
    TX_INFO: allocatePacket(0x49, 1),
};

var nextPacket;
var timerId;


function allocatePacket(command, size) {
    var packet = new Uint8Array(size);
    packet[0] = command;
    return packet;
}

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

function handle_CFG_REQUEST_TO_CONNECT(packet) {
    console.log('CFG_REQUEST_TO_CONNECT');
    state = STATE.CONNECTED;
}

function handle_CFG_READ(packet) {
    var dv = new DataView(packet.buffer, 1);
    var offset = dv.getUint16(0, true);
    var count = packet[3];

    console.log('CFG_READ offset: ' + offset + ', count: ' + count);

    if (count < 1  ||  count > 29) {
        console.error('Count must be between 1 and 29');
        return;
    }

    if ((offset + count) > TEST_CONFIG_DATA.length) {
        console.error('Request out of config area');
        return;
    }

    var response = allocatePacket(0x52, 4 + count);
    response.set(packet.slice(1, 4), 1);
    response.set(TEST_CONFIG_DATA.slice(offset, offset + count), 4);

    nextPacket = response;
}

function handle_CFG_WRITE(packet) {
    console.log('CFG_WRITE');

}

function handle_CFG_COPY(packet) {

}

function handle_CFG_DISCONNECT(packet) {
    console.log('CFG_DISCONNECT');
    state = STATE.NOT_CONNECTED;
}


function onReceivedPacket(packet) {
    // console.log(dumpUint8Array(packet));

    var dispatch = {};
    dispatch[STATE.NOT_CONNECTED] = {
        0x31: handle_CFG_REQUEST_TO_CONNECT,
    };
    dispatch[STATE.CONNECTED] = {
        0x72: handle_CFG_READ,
        0x77: handle_CFG_WRITE,
        0x63: handle_CFG_COPY,
        0x64: handle_CFG_DISCONNECT,
    };

    var command = packet[0];
    var handler = dispatch[state][command];
    if (handler) {
        handler(packet);
    }
    else {
        console.log('Command 0x' + byte2string(packet[0]) +
            ' is invalid for state ' + state);
    }
}

function onConnected() {
    console.log('Configurator connected');
    communicate();
}

function onDisconnected() {
    console.log('Configurator disconnected');
    state = STATE.NOT_CONNECTED;
    if (timerId) {
        clearTimeout(timerId);
        timerId = undefined;
    }
}


function communicate() {
    if (nextPacket) {
        server.sendPacket(nextPacket);
        nextPacket = undefined;
    }
    else {
        switch (state) {
            case STATE.NOT_CONNECTED:
                server.sendPacket(packets.TX_FREE_TO_CONNECT);
                break;

            case STATE.CONNECTED:
                server.sendPacket(packets.TX_INFO);
                break;
        }
    }

    // In connected state send a packet every 5 ms, otherwise every 100 ms
    var timeoutValue = PACKET_REPEAT_TIME_MS_NOT_CONNECTED;
    if (state === STATE.CONNECTED) {
        timeoutValue = PACKET_REPEAT_TIME_MS;
    }
    timerId = setTimeout(communicate, timeoutValue);
}



console.log('=============================================');
console.log('Simulator: Headless TX bridged over Websocket');
console.log('=============================================');

var tx_name = new Uint8Array(TEST_CONFIG_DATA.buffer, 20, 16);
var battery_mv = 3897;      // Simulated battery voltage of 3.897 V
packets.TX_FREE_TO_CONNECT = buildFreeToConnectPacket(tx_name, battery_mv);

console.log('Name of the simulated transmitter: ' + uint8array2string(tx_name));


server.setEventListener('onconnect', onConnected);
server.setEventListener('ondisconnect', onDisconnected);
server.setEventListener('onpacket', onReceivedPacket);
server.start(PORT);
console.log('Websocket server started, please contact me at port ' + PORT + '\n');
