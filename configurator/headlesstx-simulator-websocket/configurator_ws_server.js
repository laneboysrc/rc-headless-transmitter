'use strict';
var ws = require('nodejs-websocket');

var configuratorConnection;
var showLog = false;

function log(message) {
    if (showLog) {
        console.log(message);
    }
}

function startServer(port, onPacketCallback) {
    ws.createServer(function (con) {
        if (configuratorConnection) {
            log('Websocket: A client is already connected, not accepting another connection');
            con.close();
            return;
        }

        log('Websocket: client connected');
        configuratorConnection = con;

        con.sendPacket = function (packet) {
            con.send(new Buffer(packet));
        };

        con.on('text', function (str) {
            log('Websocket: received TEXT "' + str + '", ignored');
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
                log('Websocket: received ' + data.length + ' bytes of binary data');
                if (onPacketCallback) {
                    log('Websocket: calling ', onPacketCallback);
                    onPacketCallback(new Uint8Array(data));
                }
            });
        });

        con.on('close', function (code, reason) {
            log('Websocket: connection closed');
            configuratorConnection = undefined;
        });
    }).listen(port);
}

function isConnected() {
    return !!configuratorConnection;
}

function sendPacket(packet) {
    if (configuratorConnection) {
        configuratorConnection.sendPacket(packet);
    }
}

function debug(on) {
    // If the on parameter is not given then set showLog to TRUE
    if (typeof on === 'undefined') {
        on = true;
    }
    showLog = on;
}

module.exports = {
    start: startServer,
    isConnected: isConnected,
    sendPacket: sendPacket,
    debug: debug,
};
