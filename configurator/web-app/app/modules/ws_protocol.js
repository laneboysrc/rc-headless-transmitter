'use strict';

var Utils = require('./utils');

class WebsocketProtocol {
  constructor() {
    this.ws = undefined;
    this.maxPacketsInTransit = 1;
    this.pending = [];
    this.inTransit = [];
  }

  //*************************************************************************
  open() {
    if (this.ws) {
      return;
    }

    // Connect to the Websocket of the bridge
    this.ws = new WebSocket('ws://' + location.hostname + ':9706/');
    this.maxPacketsInTransit = 1;

    // Set event handlers
    this.ws.onopen = this.onopen.bind(this);
    this.ws.onmessage = this.onmessage.bind(this);
    this.ws.onclose = this.onclose.bind(this);
    this.ws.onerror = this.onerror.bind(this);
  }

  //*************************************************************************
  close() {
    if (this.ws) {
      this.ws.close();
    }
  }

  //*************************************************************************
  _sendCfgPacket() {
    if (this.inTransit.length >= this.maxPacketsInTransit) {
      return;
    }

    if (this.pending.length) {
      let request = this.pending.shift();
      this.inTransit.push(request);

      // console.log('WS: sendCustomEventing ' + dumpUint8Array(request.packet));
      this.ws.send(request.packet);
    }
  }

  //*************************************************************************
  send(packet) {
    if (!(packet instanceof Uint8Array)) {
      throw new Error('WS: packet is not of type Uint8Array');
    }

    return new Promise((resolve, reject) => {
      this.pending.push({
        packet: packet,
        promise: {resolve: resolve, reject: reject}
      });
    });
  }

  //*************************************************************************
  makeReadPacket(offset, count) {
    if (count > 29) {
      count = 29;
    }

    let packet = new Uint8Array([0x72, 0, 0, 0]);
    Utils.setUint16(packet, offset, 1);
    packet[3] = count;
    return packet;
  }

  //*************************************************************************
  makeWritePacket(offset, data) {
    let packet = new Uint8Array(3 + data.length);
    packet[0] = 0x77;
    Utils.setUint16(packet, offset, 1);
    packet.set(data, 3);

    return packet;
  }


  //*************************************************************************
  _packetsMatch(request, response) {

    // Read
    if (response[0] === 0x52  &&  request.packet[0] === 0x72) {
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
    if (response[0] === 0x57  &&  request.packet[0] === 0x77) {
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

    return false;
  }

  //*************************************************************************
  _resolvePromises(data) {

    // Handle special Websocket only command that indicates the maximum number
    // of bytes that can be in transit (= packet buffer size in the bridge)
    if (data[0] === 0x42) {
      if (data[1] > 1) {
        this.maxPacketsInTransit = data[1];
      }
      return;
    }

    // Go through all packets in transit
    for (let i = 0; i < this.inTransit.length; i++) {
      let request = this.inTransit[i];

      // Remove packets where we don't expect a particular response
      if (request.packet[0] !== 0x77  &&  request.packet[0] !== 0x72) {
        request.promise.resolve(data);
        this.inTransit.splice(i, 1);
        --i;
        continue;
      }

      // Match packets to a specifc response
      if (this._packetsMatch(request, data)) {
          request.promise.resolve(data);
          this.inTransit.splice(i, 1);
          --i;
      }
    }

    // Also go through pending packets, in case duplicate requests are
    // in the queue
    for (let i = 0; i < this.pending.length; i++) {
      let request = this.pending[i];

      if (this._packetsMatch(request, data)) {
          request.promise.resolve(data);
          this.pending.splice(i, 1);
          --i;
      }
    }
  }

  //*************************************************************************
  onopen() {
    Utils.sendCustomEvent('ws-open');
  }

  //*************************************************************************
  onmessage(e) {
    // e.data contains received string

    if (!(e.data instanceof Blob)) {
      throw new Error('WS: onmessage: String received; should have been Blob');
    }

    let reader = new FileReader();

    reader.addEventListener("loadend", function () {
      let data = new Uint8Array(reader.result);

      // console.log(Utils.byte2string(data[0]))

      this._sendCfgPacket();
      this._resolvePromises(data);

      Utils.sendCustomEvent('ws-message', data);
    }.bind(this));

    reader.readAsArrayBuffer(e.data);
  }

  //*************************************************************************
  onerror(e) {
    // FIXME: what kind of error may we receive here, and how do we communicate
    // that to pending requests?
    Utils.sendCustomEvent('ws-error', e);
  }

  //*************************************************************************
  onclose() {
    this.ws = undefined;

    // FIXME: got through this.pending[] and this.inTransit[] and reject all promises
    this.pending = [];

    Utils.sendCustomEvent('ws-close');
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
