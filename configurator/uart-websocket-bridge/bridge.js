#!/usr/bin/env nodejs
/* globals TEST_CONFIG_DATA: false, imports: false */
'use strict';

var argv = require('minimist')(process.argv.slice(2));
var SerialPort = require('serialport');
var server = require('../headlesstx-simulator-websocket/configurator_ws_server');
var slip = require('slip');

// Import the configuration binary data we exported from a Headless TX
require('node-import');
imports('../web-app/_includes/test_data.js');


var websocketPort = 9706;
var uartPort = argv._[0] || '/dev/ttyUSB0';
var uart;
var slipDecoder;



function onWebsocketReceivedPacket(packet) {
    console.log('WS data:            ', new Buffer(packet));
    if (uart) {
        uart.write(slip.encode(packet));
    }
}

function onWebsocketConnected() {
    console.log('\nConfigurator connected');
}

function onWebsocketDisconnected() {
    console.log('Configurator disconnected');
}

function onUartError(error) {
    console.error('UART error:       ', error.message);
}

function onUartData(data) {
    console.log('UART data:          ', new Buffer(data));
    slipDecoder.decode(data);
}

function onSlipData(data) {
    console.log('SLIP decoded data:  ', new Buffer(data));
    server.sendPacket(data);
}

function onSlipDecoderError(error) {
    console.error('SLIP decoding error: ', error);
}

console.log('=============================================');
console.log('UART to websocket bridge');
console.log('=============================================');

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

// var test = new Uint8Array([0xc0, 0x30, 0xdb, 0x31, 0xdb, 0xdc, 0x32, 0xc0]);
// uart.on('open', function () {
//     console.log('SLIP encoded test:  ', new Buffer(slip.encode(test)));
//     uart.write(slip.encode(test));
//     uart.write(test);
// });


