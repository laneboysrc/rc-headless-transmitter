'use strict';

var Utils = require('./utils');

const VENDOR_ID = 0x6666;
const TEST_INTERFACE = 0;
const TEST_EP_OUT = 1;
const TEST_EP_IN = 2;
const EP_SIZE = 64;

const filters = [{ 'vendorId': VENDOR_ID }];


class WebusbTransport {
  constructor() {
    this.usb_device = undefined;
    this.maxPacketsInTransit = 1;
    this.pending = [];
    this.inTransit = [];
    this.timeout = null;
    this.opening = false;

    navigator.usb.addEventListener('connect', this._onopen.bind(this));
    navigator.usb.addEventListener('disconnect', this._onclose.bind(this));
  }

  //*************************************************************************
  async open() {
    if (this.usb_device) {
      return;
    }

    this.opening = true;

    let devices = await navigator.usb.getDevices();
    if (devices.length <= 0) {
      return;
    }

    let device = devices[0];
    try {
      await device.open();
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }

      await device.claimInterface(TEST_INTERFACE);
    }
    catch (e) {
      console.error('Failed to open the device', e);
      return;
    }

    console.log('Connected to device with serial number ' + device.serialNumber);

    this.usb_device = device;
  }

  //*************************************************************************
  async close() {
    this.opening = false;
    if (this.usb_device) {
      console.log('Webusb close', this.usb_device.url);
      await this.usb_device.close();
      this.usb_device = undefined;
    }
    else {
      console.log('Webusb close (this.usb_device is false)');
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
  _sendCfgPacket() {
    if (this.inTransit.length >= this.maxPacketsInTransit) {
      return;
    }

    if (this.pending.length) {
      let request = this.pending.shift();
      this.inTransit.push(request);

      // this.usb_device.send(request.packet);
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
    console.log('Webusb timeout');
    this.timeout = null;
    this.usb_device.close();
  }

  //*************************************************************************
  _onopen() {
    console.log('Webusb opened');
    this.opening = false;
    this._cancelTimeout();
    Utils.sendCustomEvent('transport-open');
  }

  //*************************************************************************
  _onerror(e) {
    console.log('Webusb error');

    if (!this.opening) {
      Utils.sendCustomEvent('transport-error', e);
    }
  }

  //*************************************************************************
  _onclose() {
    console.log('Websocket closed');

    this._cancelTimeout();

    // Go through this.pending[] and this.inTransit[] and reject all promises

    let request = this.inTransit.shift();
    while (request) {
      request.promise.reject('Webusb closed');
      request = this.inTransit.shift();
    }

    request = this.pending.shift();
    while (request) {
      request.promise.reject('Webusb closed');
      request = this.pending.shift();
    }

    this.usb_device = undefined;
    this.opening = false;
    Utils.sendCustomEvent('transport-close');
  }

  //*************************************************************************
  _onmessage(e) {
    // e.data contains received string

    let data = e.data;

    // Filter out TX_INFO and TX_FREE_TO_CONNECT, which are sent
    // by the Tx without and request.
    if (data[0] === Device.TX_INFO) {
      Device.onLiveMessage(data);
    }
    else if (data[0] === Device.TX_FREE_TO_CONNECT) {
      DeviceList.transmitterFreeToConnect(data);
    }
    else {
      this._resolvePromises(data);
    }
    this._sendCfgPacket();
    return;
  }
}

window['WebusbTransport'] = new WebusbTransport();
