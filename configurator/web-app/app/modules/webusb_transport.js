'use strict';

var Utils = require('./utils');
var Slip = require('./slip');


const BRIDGE_INTERFACE = 0;
const BRIDGE_EP_OUT = 1;
const BRIDGE_EP_IN = 2;
const EP_SIZE = 64;


class WebusbTransport {
  constructor() {
    this.usb_device = undefined;
    this.maxPacketsInTransit = 1;
    this.pending = [];
    this.inTransit = [];
    this.opening = false;
    this.slip = undefined;

    if (typeof navigator.usb !== 'undefined') {
      // navigator.usb.addEventListener('connect', this._onopen.bind(this));
      navigator.usb.addEventListener('disconnect', this._ondisconnected.bind(this));
    }
  }

  //*************************************************************************
  async open() {
    if (this.usb_device) {
      return;
    }

    this.opening = true;

    let devices = await navigator.usb.getDevices();
    if (devices.length <= 0) {
      console.log('No USB bridge present or authorized');
      return;
    }

    let device = devices[0];
    try {
      await device.open();
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }

      await device.claimInterface(BRIDGE_INTERFACE);
    }
    catch (e) {
      console.error('Failed to open the device', e);
      return;
    }

    console.log('Connected to device with serial number ' + device.serialNumber);

    this.usb_device = device;
    this.opening = false;
    this.slip = new Slip();
    this._receivePackets();
    Utils.sendCustomEvent('transport-open');
  }

  //*************************************************************************
  async close() {
    this.opening = false;
    if (this.usb_device) {
      console.log('Closing the USB bridge');
      await this.usb_device.close();
      this.usb_device = undefined;
    }
    else {
      console.log('WebusbTransport.close() (this.usb_device is false)');
    }
  }

  //*************************************************************************
  async send(packet) {
    try {
      let result = await this.usb_device.transferOut(BRIDGE_EP_OUT, this.slip.encode(packet));
      if (result.status != 'ok') {
        console.error('transferOut() failed:', result.status);
      }
    }
    catch (e) {
      console.error('transferOut() exception:', e);
      return;
    }
  }

  //*************************************************************************
  _ondisconnected(connection_event) {
    console.log('_ondisconnected', connection_event);

    const disconnected_device = connection_event.device;
    if (!this.usb_device  ||  disconnected_device != this.usb_device) {
      return;
    }

    this.usb_device = undefined;
    this.opening = false;
    Utils.sendCustomEvent('transport-close');
  }

  //*************************************************************************
  async _receivePackets() {
    for (;;) {
      try {
        let result = await this.usb_device.transferIn(BRIDGE_EP_IN, EP_SIZE);
        if (result.status == 'ok') {
          let buffer = new Uint8Array(result.data.buffer);
          for (let byte of buffer) {
            const message = this.slip.decode(byte);
            if (message) {
              // console.log('WebusbTransport._receivePackets()', message);
              Device.onTransportMessage(message);
            }
          }
        }
        else {
          console.log('transferIn() failed:', result.status);
        }
      }
      catch (e) {
        console.log('Device disconnected, shutting down WebusbTransport._receivePackets()');
        return;
      }
    }
  }
}

window['WebusbTransport'] = new WebusbTransport();
