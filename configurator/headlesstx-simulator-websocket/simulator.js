#!/usr/bin/env nodejs
'use strict';

console.log("=============================================");
console.log("Simulator: Headless TX bridged over Websocket");
console.log("=============================================\n");

var ws = require("nodejs-websocket");
// var dbObject = require("./database_object");

// console.log(dbObject);

// Import the configuration binary data we exported from a Headless TX
// global TEST_CONFIG_DATA
require('node-import');
imports('../web-app/_includes/test_data.js');

var PORT = 9706;

// Delay in milliseconds between packets, a Headless TX uses 5 ms
var PACKET_REPEAT_TIME_MS = 1000;


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


var tx_name = new Uint8Array(TEST_CONFIG_DATA.buffer, 20, 16);
console.log(uint8array2string(tx_name));

var wsConnection;

// Configurator protocol state
var STATE = {NOT_CONNECTED: 'NOT_CONNECTED', CONNECTED: 'CONNECTED'};
var state = STATE.NOT_CONNECTED;


ws.createServer(function (con) {
    if (wsConnection) {
        console.warn('Client already connected, closing connection');
        con.close();
        return;
    }

    console.log('Websocket client connected');
    wsConnection = con;

    con.on("text", function (str) {
        console.log('Websocket received: "' + str + '"');
    });

    con.on("close", function (code, reason) {
        console.log("Websocket connection closed");
        wsConnection = undefined;
    });
}).listen(PORT);

function rfBurstLoop() {
    if (wsConnection) {
        wsConnection.sendText('TX_PACKET');
    }

    setTimeout(rfBurstLoop, PACKET_REPEAT_TIME_MS);
}


setTimeout(rfBurstLoop, PACKET_REPEAT_TIME_MS);

console.log("Websocket server started, please contact me at port " + PORT);
