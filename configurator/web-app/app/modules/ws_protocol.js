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
    this.ws.onopen = this._onopen.bind(this);
    this.ws.onmessage = this._onmessage.bind(this);
    this.ws.onclose = this._onclose.bind(this);
    this.ws.onerror = this._onerror.bind(this);
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
          // --i;
          // After the first packet matches, stop looking for further ones
          return;
      }
    }

    // Also go through pending packets, in case duplicate requests are
    // in the queue
    // for (let i = 0; i < this.pending.length; i++) {
    //   let request = this.pending[i];

    //   if (this._packetsMatch(request, data)) {
    //       request.promise.resolve(data);
    //       this.pending.splice(i, 1);
    //       --i;
    //   }
    // }
  }

  //*************************************************************************
  _onopen() {
    Utils.sendCustomEvent('ws-open');
  }

  //*************************************************************************
  _onmessage(e) {
    // e.data contains received string

    if (!(e.data instanceof Blob)) {
      throw new Error('WS: _onmessage: String received; should have been Blob');
    }

    let reader = new FileReader();

    reader.addEventListener("loadend", function () {
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
    // FIXME: what kind of error may we receive here, and how do we communicate
    // that to pending requests?
    Utils.sendCustomEvent('ws-error', e);
    console.log('Websocket error: ', e)
  }

  //*************************************************************************
  _onclose() {
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
