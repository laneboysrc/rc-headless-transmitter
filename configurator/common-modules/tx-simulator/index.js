#!/usr/bin/env nodejs
'use strict';

var server = require('configurator-ws-server');
var testData = require('test-data');


var PORT = 9706;

// Delay in milliseconds between packets, a Headless TX uses 5 ms when connected
// and 100 ms when not connected
var PACKET_REPEAT_TIME_MS = 5;
var PACKET_REPEAT_TIME_MS_NOT_CONNECTED = 100;
// DEBUG: slow down communication
// PACKET_REPEAT_TIME_MS = 500;
// PACKET_REPEAT_TIME_MS_NOT_CONNECTED = 1000;

// Configurator protocol state
var STATE = {NOT_CONNECTED: 'NOT_CONNECTED', CONNECTED: 'CONNECTED'};
var state = STATE.NOT_CONNECTED;

var packets = {
    TX_FREE_TO_CONNECT: allocatePacket(0x30, 1 + 8 + 16 + 2),
    TX_INFO: allocatePacket(0x49, 1),
};

var nextPacket;
var timerId;


function allocatePacket(command, size) {
    var packet = new Uint8Array(size);
    packet[0] = command;
    return packet;
}

function uint8array2string(bytes) {
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

function uuid2string(uuid_bytes) {
    var result = '';

    result += byte2string(uuid_bytes[0]);
    result += byte2string(uuid_bytes[1]);
    result += '-';
    result += byte2string(uuid_bytes[2]);
    result += byte2string(uuid_bytes[3]);
    result += '-';
    result += byte2string(uuid_bytes[4]);
    result += byte2string(uuid_bytes[5]);
    result += '-';
    result += byte2string(uuid_bytes[6]);
    result += byte2string(uuid_bytes[7]);

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

function buildFreeToConnectPacket(uuid, name, voltage) {
    var packet = packets.TX_FREE_TO_CONNECT;

    var bat = new Uint8Array(new Uint16Array([voltage]).buffer);

    packet.set(uuid, 1);
    packet.set(name, 1 + 8);
    packet.set(bat, 1 + 8 + 16);
    return packet;
}

function setState(newState) {
    if (state !== newState) {
        state = newState;
        console.log('State transition to ' + state);
    }
}

function handle_CFG_REQUEST_TO_CONNECT(packet) {
    if (packet.length !== (1 + 8 + 5 + 2 + 1 + 1)) {
        console.error('CFG_REQUEST_TO_CONNECT invalid packet length ' + packet.length);
        return;
    }

    // FIXME: match password and uuid

    console.log('CFG_REQUEST_TO_CONNECT');
    setState(STATE.CONNECTED);
}

function handle_CFG_READ(packet) {
    if (packet.length !== 4) {
        console.error('CFG_READ invalid packet length ' + packet.length);
        return;
    }

    var dv = new DataView(packet.buffer, 1);
    var offset = dv.getUint16(0, true);
    var count = packet[3];

    console.log('CFG_READ offset: ' + offset + ', count: ' + count);

    if (count < 1  ||  count > 29) {
        console.error('Count must be between 1 and 29');
        return;
    }

    if ((offset + count) > testData.length) {
        console.error('Request out of config area');
        return;
    }

    var response = allocatePacket(0x52, 3 + count);
    response.set(packet.slice(1, 3), 1);
    response.set(testData.slice(offset, offset + count), 3);

    nextPacket = response;
}

function handle_CFG_WRITE(packet) {
    if (packet.length < 4) {
        console.error('CFG_WRITE invalid packet length ' + packet.length);
        return;
    }

    var dv = new DataView(packet.buffer, 1);
    var offset = dv.getUint16(0, true);
    var count = packet.length - 3;

    console.log('CFG_WRITE offset: ' + offset + ', count: ' + count);

    if ((offset + count) > testData.length) {
        console.error('Request out of config area');
        return;
    }

    testData.set(packet.slice(3), offset);

    var response = allocatePacket(0x57, 4);
    response.set(packet.slice(1, 3), 1);
    response[3] = count;
    nextPacket = response;
}

function handle_CFG_COPY(packet) {
    if (packet.length !== 7) {
        console.error('CFG_COPY invalid packet length ' + packet.length);
        return;
    }

    var dv = new DataView(packet.buffer, 1);
    var src = dv.getUint16(0, true);
    var dst = dv.getUint16(2, true);
    var count = dv.getUint16(4, true);

    console.log('CFG_COPY src: ' + src + ', dst: ' + dst + ', count: ' + count);

    if ((src + count) > testData.length) {
        console.error('Request source offset out of config area');
        return;
    }

    if ((dst + count) > testData.length) {
        console.error('Request destination offset out of config area');
        return;
    }

    var i;
    if (src > dst) {
        for (i = 0; i < count; i++) {
            testData[dst + i] = testData[src + i];
        }
    }
    else if (src < dst) {
        for (i = count - 1; i >= 0; i--) {
            testData[dst + i] = testData[src + i];
        }
    }

    var response = allocatePacket(0x43, 1);
    nextPacket = response;
}

function handle_CFG_DISCONNECT(packet) {
    if (packet.length !== 1) {
        console.error('CFG_DISCONNECT invalid packet length' + packet.length);
        return;
    }

    console.log('CFG_DISCONNECT');
    setState(STATE.NOT_CONNECTED);
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
    console.log('\nConfigurator connected');
    communicate();
}

function onDisconnected() {
    console.log('Configurator disconnected');
    setState(STATE.NOT_CONNECTED);
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


function start () {
    console.log('=============================================');
    console.log('Simulator: Headless TX bridged over Websocket');
    console.log('=============================================');

    var uuidOffset = 4;         // Skip CONFIG_VERSION
    var uuidLength = 8;
    var nameOffset = 4 + 8;     // Skip CONFIG_VERSION and UUID
    var nameLength = 16;

    var tx_uuid = new Uint8Array(testData.buffer, uuidOffset, uuidLength);
    var tx_name = new Uint8Array(testData.buffer, nameOffset, nameLength);
    var battery_mv = 3897;      // Simulated battery voltage of 3.897 V
    packets.TX_FREE_TO_CONNECT = buildFreeToConnectPacket(tx_uuid, tx_name, battery_mv);

    console.log('UUID of the simulated transmitter: ' + uint8array2string(tx_name));
    console.log('Name of the simulated transmitter: ' + uint8array2string(tx_name));


    server.setEventListener('onconnect', onConnected);
    server.setEventListener('ondisconnect', onDisconnected);
    server.setEventListener('onpacket', onReceivedPacket);
    server.start(PORT);
    console.log('Websocket server started, please contact me at port ' + PORT);
}

module.exports = {
    start: start
};
