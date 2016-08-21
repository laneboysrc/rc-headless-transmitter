#!/usr/bin/env nodejs
'use strict';

var argv        = require('minimist')(process.argv.slice(2));
var SerialPort  = require('serialport');
var slip        = require('slip');


var uartPort = argv._[0] || '/dev/ttyUSB1';
var uart;
var slipDecoder;


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


function onUartData(data) {
    process.stdout.write(new Buffer(data).toString());
    // slipDecoder.decode(data);
}

function onUartError(error) {
    console.error('!!!UART error: ', error.message);
}

function onSlipData(data) {
    console.log('SLIP decoded data: ', new Buffer(data));
}

function onSlipDecoderError(error) {
    console.error('SLIP decoding error: ', error);
}

function onStdin() {
    var chunk = process.stdin.read(1);
    while (chunk !== null) {
        console.log('Console received: ', chunk);

        switch (chunk.toString()) {
            case 'r':
                send_read_test_request();
                break;

            case 'w':
                send_write_test_request();
                break;

            case 'c':
            case 'p':
                send_copy_test_request();
                break;
        }

        chunk = process.stdin.read(1);
    }
}


function send_read_test_request() {
    var packet = new Buffer(4);
    packet[0] = CFG_READ;
    packet[1] = 12;
    packet[2] = 0;
    packet[3] = 16;

    uart.write(slip.encode(packet));
}


function send_write_test_request() {
    var packet = new Buffer(6);
    packet[0] = CFG_WRITE;
    packet[1] = 12;
    packet[2] = 0;
    packet[3] = 'X'.charCodeAt(0);
    packet[4] = 'y'.charCodeAt(0);
    packet[5] = 'Z'.charCodeAt(0);

    uart.write(slip.encode(packet));
}


function send_copy_test_request() {
    var packet = new Buffer(7);
    packet[0] = CFG_COPY;
    packet[1] = 12;
    packet[2] = 0;
    packet[3] = 14;
    packet[4] = 0;
    packet[5] = 3;
    packet[6] = 0;

    uart.write(slip.encode(packet));
}


console.log('=============================================');
console.log('UART to Console test bridge');
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

process.stdin.setEncoding('utf8');
process.stdin.on('readable', onStdin);
