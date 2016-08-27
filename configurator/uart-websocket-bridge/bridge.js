#!/usr/bin/env nodejs
'use strict';

var argv        = require('minimist')(process.argv.slice(2));
var SerialPort  = require('serialport');
var slip        = require('slip');
var server      = require('configurator-ws-server');


var websocketPort = 9706;
var uartPort = argv._[0] || '/dev/ttyUSB1';
var uart;
var slipDecoder;


// Configurator protocol state
var STATE = {NOT_CONNECTED: 'NOT_CONNECTED', CONNECTED: 'CONNECTED'};
var state = STATE.NOT_CONNECTED;

var TX_FREE_TO_CONNECT = 0x30;
var CFG_REQUEST_TO_CONNECT = 0x31;
var CFG_READ = 0x72;
var CFG_WRITE = 0x77;
var CFG_COPY = 0x63;
var CFG_DISCONNECT = 0x64;
var TX_INFO = 0x49;
var TX_REQUESTED_DATA = 0x52;
var TX_WRITE_SUCCESSFUL = 0x57;
var TX_COPY_SUCCESSFUL = 0x43;

var MAX_PACKETS_IN_TRANSIT = 5;
var packetCache = [];

var packets = {
    CFG_DISCONNECT: allocatePacket(CFG_DISCONNECT, 1),
    WS_MAX_PACKETS_IN_TRANSIT: allocatePacket(0x42, 2),
};

var connected = false;

function allocatePacket(command, size) {
    var packet = new Uint8Array(size);
    packet[0] = command;
    return packet;
}


function decode(packet) {
    var dv;
    var offset;
    var count;

    if (packet.length === 0) {
        return "";
    }

    switch (packet[0]) {
        case TX_FREE_TO_CONNECT:
            return "TX_FREE_TO_CONNECT";

        case CFG_REQUEST_TO_CONNECT:
            return "CFG_REQUEST_TO_CONNECT";

        case CFG_READ:
            dv = new DataView(packet.buffer, 1);
            offset = dv.getUint16(0, true);
            count = packet[3];
            return "CFG_REQUEST_TO_CONNECT     o=" + offset + " c=" + count;

        case CFG_WRITE:
            dv = new DataView(packet.buffer, 1);
            offset = dv.getUint16(0, true);
            count = packet.length - 3;
            return "CFG_WRITE                  o=" + offset + " c=" + count;

        case CFG_COPY:
            return "CFG_COPY";

        case CFG_DISCONNECT:
            return "CFG_DISCONNECT";

        case TX_INFO:
            return "TX_INFO";

        case TX_REQUESTED_DATA:
            dv = new DataView(packet.buffer, 1);
            offset = dv.getUint16(0, true);
            count = packet.length - 3;
            return "TX_REQUESTED_DATA          o=" + offset + " c=" + count;

        case TX_WRITE_SUCCESSFUL:
            dv = new DataView(packet.buffer, 1);
            offset = dv.getUint16(0, true);
            count = packet[3];
            return "TX_WRITE_SUCCESSFUL        o=" + offset + " c=" + count;

        case TX_COPY_SUCCESSFUL:
            return "TX_COPY_SUCCESSFUL";

        default:
            return new Buffer(packet);
    }
}

function onWebsocketConnected() {
    packetCache = [];
    console.log('\nConfigurator connected');
    uart.write(slip.encode(packets.CFG_DISCONNECT));
    // server.sendPacket(packets.WS_MAX_PACKETS_IN_TRANSIT);
}

function onWebsocketDisconnected() {
    packetCache = [];
    console.log('Configurator disconnected');
    connected = false;
    uart.write(slip.encode(packets.CFG_DISCONNECT));
}

function onWebsocketReceivedPacket(packet) {
    console.log('WS data:            ', decode(packet));

    if (packet[0] === CFG_REQUEST_TO_CONNECT) {
        if (connected) {
            return;
        }
        connected = true;
    }
    if (packet[0] === CFG_DISCONNECT) {
        connected = false;
    }

    packetCache.push(packet);
}

function onUartData(data) {
    // console.log('UART data:          ', new Buffer(data));
    slipDecoder.decode(data);
}

function onUartError(error) {
    console.error('UART error:       ', error.message);
}

function onSlipData(data) {
    if (uart  &&  packetCache.length) {
        var packet = packetCache.shift();
        uart.write(slip.encode(packet));
    }

    if (data[0] !== TX_INFO) {
        console.log('SLIP decoded data:  ', decode(data));
    }

    server.sendPacket(data);
}

function onSlipDecoderError(error) {
    console.error('SLIP decoding error: ', error);
}

function start() {
    console.log('=============================================');
    console.log('UART to websocket bridge');
    console.log('=============================================');
        packets.WS_MAX_PACKETS_IN_TRANSIT[1] = MAX_PACKETS_IN_TRANSIT;

    slipDecoder = new slip.Decoder({
        onMessage: onSlipData,
        onError: onSlipDecoderError
    });

    uart = new SerialPort(uartPort, {
        baudRate: 115200,
    });
    uart.on('error', onUartError);
    uart.on('data', onUartData);

    server.setEventListener('onconnect', onWebsocketConnected);
    server.setEventListener('ondisconnect', onWebsocketDisconnected);
    server.setEventListener('onpacket', onWebsocketReceivedPacket);
    server.start(websocketPort);
    console.log('Websocket server started, please contact me at port ' + websocketPort + '\n');

}

start();

// Loopback test (connect TX to RX):
// var test = new Uint8Array([0xc0, 0x30, 0xdb, 0x31, 0xdb, 0xdc, 0x32, 0xc0]);
// uart.on('open', function () {
//     console.log('SLIP encoded test:  ', new Buffer(slip.encode(test)));
//     uart.write(slip.encode(test));
//     uart.write(test);
// });


