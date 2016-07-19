'use strict';
var ws = require('nodejs-websocket');

var configuratorConnection;
var listeners = {};
var showLog = false;

function log(message) {
    if (showLog) {
        console.log(message);
    }
}

function startServer(port) {
    ws.createServer(function (con) {
        if (configuratorConnection) {
            log('Websocket: A client is already connected, not accepting another connection');
            con.close();
            return;
        }

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
                if (listeners.onpacket) {
                    log('Websocket: calling ', listeners.onpacket);
                    listeners.onpacket(new Uint8Array(data));
                }
            });
        });

        con.on('close', function (code, reason) {
            log('Websocket: connection closed');
            configuratorConnection = undefined;
            if (listeners.ondisconnect) {
                listeners.ondisconnect();
            }
        });

        log('Websocket: client connected');
        configuratorConnection = con;
        if (listeners.onconnect) {
            listeners.onconnect();
        }
    }).listen(port);
}

function isConnected() {
    return !!configuratorConnection;
}

function setEventListener(listener, callback) {
    listeners[listener] = callback;
}

function sendPacket(packet) {
    if (configuratorConnection) {
        configuratorConnection.send(new Buffer(packet));
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
    setEventListener: setEventListener,
    isConnected: isConnected,
    sendPacket: sendPacket,
    debug: debug,
};
