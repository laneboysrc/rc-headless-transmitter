#!/usr/bin/env nodejs
'use strict';

var argv        = require('minimist')(process.argv.slice(2));
var SerialPort  = require('serialport');
var slip        = require('slip');
var crypto      = require('crypto');

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

var uuid = [];
var uuid_received = false;


function buffer2string(buffer) {
  var result = '';

  for (var i = 0; i < buffer.length; i++) {
    var code = buffer[i];
    if (code === 0) {
      return result;
    }
    result += String.fromCharCode(code);
  }

  return result;
}


function onUartData(data) {
    // process.stdout.write(new Buffer(data).toString());
    slipDecoder.decode(data);
}

function onUartError(error) {
    console.error('!!!UART error: ', error.message);
}






function onSlipData(data) {
    data = new Buffer(data);

    switch (data[0]) {

        case TX_REQUESTED_DATA:
            handle_TX_REQUESTED_DATA(data);
            break;

        case TX_WRITE_SUCCESSFUL:
            handle_TX_WRITE_SUCCESSFUL(data);
            break;

        case TX_COPY_SUCCESSFUL:
            handle_TX_COPY_SUCCESSFUL(data);
            break;

        case TX_INFO:
            break;

        case TX_FREE_TO_CONNECT:
            if (!uuid_received) {
                uuid = data.slice(1, 1+8);
                console.log("UUID available");
                uuid_received = true;
            }
            break;

        default:
            console.log('Unknown response: ', data);
            break;
    }
}

function onSlipDecoderError(error) {
    console.error('SLIP decoding error: ', error);
}

function handle_TX_REQUESTED_DATA(data) {
    var offset;
    var count;

    if (data.length < 4) {
        console.log("TX_REQUESTED_DATA length is less than 4");
        return;
    }

    offset = (data[2] << 8) + data[1];
    count = data.length - 3;
    console.log("TX_REQUESTED_DATA o=" + offset + " c=" + count + " \"" + buffer2string(data.slice(3)) + "\"");
}


function handle_TX_WRITE_SUCCESSFUL(data) {
    var offset;
    var count;

    if (data.length != 4) {
        console.log("TX_WRITE_SUCCESSFUL length is less than 4");
        return;
    }

    offset = (data[2] << 8) + data[1];
    count = data[3];
    console.log("TX_WRITE_SUCCESSFUL o=" + offset + " c=" + count);
}

function handle_TX_COPY_SUCCESSFUL(data) {
    var src;
    var dst;
    var count;

    if (data.length != 7) {
        console.log("TX_COPY_SUCCESSFUL length is not 7");
        return;
    }

    src = (data[2] << 8) + data[1];
    dst = (data[4] << 8) + data[3];
    count = (data[6] << 8) + data[5];
    console.log("TX_COPY_SUCCESSFUL src=" + src + " dst=" + dst + " c=" + count);
}



function onStdin() {
    var chunk = process.stdin.read(1);
    while (chunk !== null) {
        // console.log('Console received: ', chunk);

        switch (chunk.toString()) {
            case 'r':
                send_read_test_request();
                break;

            case 'w':
                send_write_test_request();
                break;

            case 'c':
                send_connect_test_request();
                break;

            case 'd':
                send_disconnect_test_request();
                break;

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

function send_disconnect_test_request() {
    var packet = new Buffer(1);
    packet[0] = CFG_DISCONNECT;

    uart.write(slip.encode(packet));
}

function send_connect_test_request() {
    if (!uuid_received) {
        return;
    }

    var packet = new Buffer(18);
    var randomValues = crypto.randomBytes(7);

    packet[0] = CFG_REQUEST_TO_CONNECT;

    uuid.copy(packet, 1);                       // UUID

    randomValues.copy(packet, 1+8, 2);          // session address

    packet[14] = 1234 & 0xff;                   // passphrase
    packet[15] = 1234 >> 8;

    packet[16] = randomValues[0];               // LFSR offset 0..255
    packet[17] = (randomValues[0] % 127) + 1;   // LFSR seed   1..127

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
