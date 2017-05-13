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

var MSG_DEBUG = 0x00;
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

var MAX_PACKET_SIZE = 32;
var MAX_PACKETS_IN_TRANSIT = 100;
var packetCache = [];

var TX_INFO_CACHE_SIZE = 256;
var TX_INFO_ELEMENT_SIZE = 6;
var txInfoCache = [];
var firstTxInfo = true;


var packets = {
    CFG_DISCONNECT: allocatePacket(CFG_DISCONNECT, 1),
    WS_MAX_PACKETS_IN_TRANSIT: allocatePacket(0x42, 2),
};

var ws_connected = false;

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
            return "CFG_READ                   o=" + offset + " c=" + count;

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

        case MSG_DEBUG:
            let msg = 'NRF DEBUG: ';

            packet.forEach(function (c) {
                if (c) {
                    msg += String.fromCharCode(c);
                }
            });

            return msg;

        default:
            return new Buffer(packet);
    }
}

// Cache TX_INFO values to data sent to the client (phone)
//
// The transmitter sends a TX_INFO packet every 5 ms. Forwarding these packets
// over the Websocket and having them processed by the configurator client
// can cause quite some load, especially on Smartphones that are power
// conscious.
//
// Within each TX_INFO packet there can be up to 4 info fields, each field
// comprising of an item identifier (uint16_t) and a value (int32_t).
//
// In order to reduce the bandwidth, the bridge holds a cache of info fields.
// If it sees an info field with the same value, it does not send it up via
// the Websocket as it knows that the configurator client has received this
// info already. This assumes that the configurator client caches the info
// itself.
//
// In order to keep the business logic working, upon connection all cachable
// items are initialized with 0xa5a5a5a5 (a value unlikely to appear), and the
// first TX_INFO is always sent along even if it is cached.
function cachePacket(packet) {
    // Early exit on illegal packets
    if (packet.length < 1  ||  packet.length > MAX_PACKET_SIZE) {
        return packet;
    }

    if (packet[0] != TX_INFO) {
        return packet;
    }

    var tweakedPacket = new Uint8Array(MAX_PACKET_SIZE);
    var tweakedPacketLength = 1;
    tweakedPacket[0] = TX_INFO;

    var offset = 1;

    while (packet.length >= offset + TX_INFO_ELEMENT_SIZE) {
        var item = packet[offset] + (packet[offset + 1] * 256);

        if (item < TX_INFO_CACHE_SIZE) {
            var value  = packet[offset + 2];
            value += packet[offset + 3] * 256;
            value += packet[offset + 4] * 256 * 256;
            value += packet[offset + 5] * 256 * 256 * 256;

            if (txInfoCache[item] != value) {
                txInfoCache[item] = value;

                for (var i = 0; i < TX_INFO_ELEMENT_SIZE; i++) {
                    tweakedPacket[tweakedPacketLength+i] = packet[offset+i];
                }
                tweakedPacketLength += TX_INFO_ELEMENT_SIZE;
            }
        }

        offset += TX_INFO_ELEMENT_SIZE;
    }

    if (tweakedPacketLength > 1) {
        firstTxInfo = false;
        return tweakedPacket.subarray(0, tweakedPacketLength);
    }

    if (firstTxInfo) {
        firstTxInfo = false;
        return packet;
    }

    return null;
}

function onWebsocketConnected() {
    packetCache = [];
    txInfoCache = [];
    firstTxInfo = true;
    ws_connected = true;
    console.log('\nConfigurator connected');

    uart.write(slip.encode(packets.CFG_DISCONNECT));
    server.sendTextPacket(packets.WS_MAX_PACKETS_IN_TRANSIT);
}

function onWebsocketDisconnected() {
    packetCache = [];
    ws_connected = false;
    console.log('Configurator disconnected');

    uart.write(slip.encode(packets.CFG_DISCONNECT));
}

function onWebsocketReceivedPacket(packet) {
    console.log('    <- WS           ', decode(packet));
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
    if (!ws_connected) {
        return;
    }

    if (uart  &&  packetCache.length) {
        var packet = packetCache.shift();
        uart.write(slip.encode(packet));
        console.log('NRF <-              ', decode(packet));
    }


    data = cachePacket(data);
    if (data) {
        if (data[0] !== TX_INFO) {
            console.log('NRF -> WS           ', decode(data));
        }
        server.sendTextPacket(data);
    }
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
        baudRate: 115200
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


