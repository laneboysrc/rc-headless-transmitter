'use strict';

var Utils = require('./utils');


class WebsocketProtocol {
  constructor() {
    this.ws = undefined;
    this.maxPacketsInTransit = 1;
    this.pending = [];
    this.inTransit = [];
    this.timeout = null;

    this._initPotentialBridges();
  }

  //*************************************************************************
  open() {
    if (this.ws) {
      return;
    }

    // Connect to the Websocket of the bridge
    this.ws = new WebSocket(this._getNextPotentialBridge());
    this.maxPacketsInTransit = 1;

    // Set event handlers
    this.ws.onopen = this._onopen.bind(this);
    this.ws.onmessage = this._onmessage.bind(this);
    this.ws.onclose = this._onclose.bind(this);
    this.ws.onerror = this._onerror.bind(this);

    this.timeout = window.setTimeout(this._ontimeout.bind(this), 1000);
  }

  //*************************************************************************
  close() {
    if (this.ws) {
      this.ws.close();
    }
  }

  //*************************************************************************
  send(packet) {
    if (!(packet instanceof Uint8Array)) {
      throw new Error('WS: packet is not of type Uint8Array');
    }

    return new Promise((resolve, reject) => {
      // Check if a write packet with exactly the same offset and length
      // exists in pending[]. If yes remove (and resolve) the earlier write
      // requests before adding the new write packet.
      //
      // This optimization improves performance on slow clients like
      // Smartphones.
      if (packet[0] === Device.CFG_WRITE) {
        for (let i = 0; i < this.pending.length; i++) {
          let request = this.pending[i];

          if (request.packet[0] !== Device.CFG_WRITE) {
            continue;
          }

          // Check length
          if (request.packet.length !== packet.length) {
            continue;
          }

          // Check offset
          if (request.packet[1] !== packet[1]) {
            continue;
          }

          if (request.packet[2] !== packet[2]) {
            continue;
          }

          // CFG_WRITE offset and length match, resolve the old request and
          // remove it from the list of pending requests
          let data = [Device.TX_WRITE_SUCCESSFUL, request.packet[1],
            request.packet[2], request.packet.length - 3];
          request.promise.resolve(data);

          this.pending.splice(i, 1);
          --i;
        }
      }

      this.pending.push({
        packet: packet,
        promise: {resolve: resolve, reject: reject}
      });

      this._sendCfgPacket();
    });
  }

  //*************************************************************************
  makeReadPacket(offset, count) {
    if (count > 29) {
      count = 29;
    }

    let packet = new Uint8Array([Device.CFG_READ, 0, 0, count]);
    Utils.setUint16(packet, offset, 1);
    return packet;
  }

  //*************************************************************************
  makeWritePacket(offset, data) {
    let packet = new Uint8Array(3 + data.length);
    packet[0] = Device.CFG_WRITE;
    Utils.setUint16(packet, offset, 1);
    packet.set(data, 3);

    return packet;
  }

  //*************************************************************************
  makeCopyPacket(src, dst, count) {
    let packet = new Uint8Array(1 + 2 + 2 + 2);
    packet[0] = Device.CFG_COPY;
    Utils.setUint16(packet, src, 1);
    Utils.setUint16(packet, dst, 1 + 2);
    Utils.setUint16(packet, count, 1 + 2 + 2);

    return packet;
  }

  //*************************************************************************
  _sendCfgPacket() {
    if (this.inTransit.length >= this.maxPacketsInTransit) {
      return;
    }

    if (this.pending.length) {
      let request = this.pending.shift();
      this.inTransit.push(request);

      this.ws.send(request.packet);
    }
  }

  //*************************************************************************
  _packetsMatch(request, response) {

    // Read
    if (response[0] === Device.TX_REQUESTED_DATA  &&  request.packet[0] === Device.CFG_READ) {
      for (let j = 1; j < 3; j++) {
        if (response[j] !== request.packet[j]) {
          return false;
        }
      }
      if ((response.length - 3) !== request.packet[3]) {
        return false;
      }
      return true;
    }

    // Write
    if (response[0] === Device.TX_WRITE_SUCCESSFUL  &&  request.packet[0] === Device.CFG_WRITE) {
      for (let i = 1; i < 3; i++) {
        if (response[i] !== request.packet[i]) {
          return false;
        }
      }
      if ((request.packet.length - 3) !== response[3]) {
        return false;
      }
      return true;
    }

    // Copy
    if (response[0] === Device.TX_COPY_SUCCESSFUL  &&  request.packet[0] === Device.CFG_COPY) {
      for (let i = 1; i < 7; i++) {
        if (response[i] !== request.packet[i]) {
          return false;
        }
      }
      return true;
    }

    return false;
  }

  //*************************************************************************
  _resolvePromises(data) {
    // Handle special Websocket only command that indicates the maximum number
    // of bytes that can be in transit (= packet buffer size in the bridge)
    if (data[0] === Device.WS_MAX_PACKETS_IN_TRANSIT) {
      if (data[1] > 1) {
        this.maxPacketsInTransit = data[1];
      }
      return;
    }

    // Go through all packets in transit
    for (let i = 0; i < this.inTransit.length; i++) {
      let request = this.inTransit[i];

      // Remove packets where we don't expect a particular response
      if (request.packet[0] !== Device.CFG_WRITE  &&  request.packet[0] !== Device.CFG_READ  &&  request.packet[0] !== Device.CFG_COPY) {
        request.promise.resolve(data);
        this.inTransit.splice(i, 1);
        --i;
        continue;
      }

      // Match packets to a specifc response
      if (this._packetsMatch(request, data)) {
        request.promise.resolve(data);
        this.inTransit.splice(i, 1);
        // After the first packet matches, stop looking for further ones
        return;
      }
    }
  }

  //*************************************************************************
  _cancelTimeout() {
    if (! this.timeout) {
      return;
    }

    window.clearTimeout(this.timeout);
    this.timeout = null;
  }

  //*************************************************************************
  _ontimeout() {
    console.log('Websocket timeout', this.ws.url);
    this.timeout = null;
    this.close();
  }

  //*************************************************************************
  _onopen() {
    console.log('Websocket opened', this.ws.url);
    this._cancelTimeout();
    this._bridgeConnected();
    Utils.sendCustomEvent('ws-open');
  }

  //*************************************************************************
  _onmessage(e) {
    // e.data contains received string

    if (!(e.data instanceof Blob)) {
      throw new Error('WS: _onmessage: String received; should have been Blob');
    }

    let reader = new FileReader();

    reader.addEventListener('loadend', function () {
      let data = new Uint8Array(reader.result);

      // console.log(Utils.byte2string(data[0]))

      if (data[0] !== Device.TX_INFO) {
        this._resolvePromises(data);
      }
      this._sendCfgPacket();
      Utils.sendCustomEvent('ws-message', data);
    }.bind(this));

    reader.readAsArrayBuffer(e.data);
  }

  //*************************************************************************
  _onerror(e) {
    console.log('Websocket error', this.ws.url);

    // FIXME: what kind of error may we receive here, and how do we communicate
    // that to pending requests?
    Utils.sendCustomEvent('ws-error', e);
  }

  //*************************************************************************
  _onclose() {
    console.log('Websocket closed', this.ws.url);

    this._cancelTimeout();
    this.ws = undefined;

    // Go through this.pending[] and this.inTransit[] and reject all promises

    let request = this.inTransit.shift();
    while (request) {
      request.promise.reject('Websocket closed');
      request = this.inTransit.shift();
    }

    request = this.pending.shift();
    while (request) {
      request.promise.reject('Websocket closed');
      request = this.pending.shift();
    }

    Utils.sendCustomEvent('ws-close');
  }

  //*************************************************************************
  _initPotentialBridges() {

    // We look for Websocket Bridges on the current host as well as on the
    // fixed IP address 192.168.4.1 (which is the IP address of the ESP8622
    // based configurator).
    //
    // This way we can either run a bridge on the development computer, or
    // point our Wi-Fi to the ESP8622 configurator after loading the app.
    // Note that the app could be pre-cached already on the device, in which
    // case we can start it even if there is no access to the Internet.
    //
    //
    // Note that we exclude .github.io as potential host, where we will
    // ultimately host the configurator (it provides HTTPS so we can use
    // a service worker for caching, giving us full off-line support).
    //
    // We do not foresee that we will run a configurator on Github, though
    // that may change if we e.g. decide to run a simulator so that users
    // can play around with the system.

    this.bridges = {
      locations: ['ws://192.168.4.1:9706/'],
      index: 0,
    };

    let host = window.location.hostname;
    if (! host.endsWith('.github.io')) {
      this.bridges.locations.push(`ws://${host}:9706/`);
    }
  }

  //*************************************************************************
  _getNextPotentialBridge() {
    const b = this.bridges;
    const current = b.index % b.locations.length;

    b.index = (current + 1) % b.locations.length;

    return b.locations[current];
  }

  //*************************************************************************
  _bridgeConnected() {
    // If we successfully connected to a bridge that set the index of
    // bridge URLs so that next time we try that bridge first.
    const b = this.bridges;
    if (b.index > 0) {
      b.index -= 1;
    }
    else {
      b.index = b.locations.length - 1;
    }
  }
}

// *************************************************************************
// function dumpUint8Array(data) {
//   var result = [];
//   data.forEach(function (byte) {
//     result.push(Utils.byte2string(byte));
//   });

//   var response = result.join(' ');

//   while (response.length < ((32 * 3) + 2)) {
//     response += ' ';
//   }

//   data.forEach(function (byte) {
//     if (byte <= 32  ||  byte > 126) {
//       response += '.';
//     }
//     else {
//       response += String.fromCharCode(byte);
//     }
//   });

//   return response;
// }

window['WebsocketProtocol'] = new WebsocketProtocol();
