'use strict';

var Utils = require('./utils');
var dialogPolyfill = require('dialog-polyfill');


class RFProtocol{
  constructor() {
    this.hopChannelDialog = document.querySelector('#app-rf_protocol-hop_channel_dialog');
    if (! this.hopChannelDialog.showModal) {
      dialogPolyfill.registerDialog(this.hopChannelDialog);
    }

    this.address = document.querySelector('#app-rf_protocol-address');
    this.hopChannels = document.querySelector('#app-rf_protocol-hop_channels');

    this.address.addEventListener('change', this._onAddressChange.bind(this));
    this.hopChannels.addEventListener('change', this._onHopChannelsChange.bind(this));
  }

  //*************************************************************************
  init() {
    let model = Device.MODEL;

    let protocol_index = model.getItemNumber('RF_PROTOCOL_TYPE');
    let address = model.getItem('RF_PROTOCOL_HK310_ADDRESS');
    let hopChannels = model.getItem('RF_PROTOCOL_HK310_HOP_CHANNELS');

    let adressString = this._address2string(address);
    this.address.value = adressString;

    let hopString = hopChannels.join(' ');
    this.hopChannels.value = hopString;

    const protocol_elements = document.querySelectorAll('input[name="protocol"]');
    protocol_elements[protocol_index].parentNode.MaterialRadio.check();

    Utils.showPage('rf_protocol');
  }

  //*************************************************************************
  back() {
    history.back();
  }

  //*************************************************************************
  newHopChannels(type) {
    var hopChannels = [];
    var isNearBindChannel;
    var channelAlreadyUsed;
    var random = new Uint8Array(1);
    var channel;

    var cryptoObj = window.crypto || window.msCrypto; // for IE 11

    switch (type) {
    case 'ism':
      random = new Uint8Array(20);


      cryptoObj.getRandomValues(random);

      for (let i = 0; i < 20; i++) {
        do {
          cryptoObj.getRandomValues(random);
          channel = random[0] % 70;

          // Avoid duplicate channels
          channelAlreadyUsed = (hopChannels.indexOf(channel) >= 0);
        } while (channelAlreadyUsed);
        hopChannels[i] = channel;
      }
      break;

    case 'nrf':
      for (let i = 0; i < 20; i++) {
        do {
          cryptoObj.getRandomValues(random);
          channel = random[0] % 125;

          // Avoid duplicate channels
          channelAlreadyUsed = (hopChannels.indexOf(channel) >= 0);

          // Avoid channels between 79 and 83, which are close to the bind
          // channel 81
          isNearBindChannel = (channel >= 79  &&  channel <= 83);
        } while (isNearBindChannel || channelAlreadyUsed);

        hopChannels[i] = channel;
      }
      break;

    // case 'hobbyking':
    default:
      cryptoObj.getRandomValues(random);

      let firstChannel = random[0] % 49;
      for (let i = 0; i < 20; i++) {
        hopChannels[i] = firstChannel + i;
      }
      break;
    }

    return hopChannels;
  }

  //*************************************************************************
  generateRandomAddress(event) {
    Utils.cancelBubble(event);

    let address = Utils.newRandomAddress();
    let adressString = this._address2string(address);
    this.address.value = adressString;

    Device.MODEL.setItem('RF_PROTOCOL_HK310_ADDRESS', address);
  }

  //*************************************************************************
  showHopChannelDialog(event) {
    Utils.cancelBubble(event);

    // Select the first element
    this.hopChannelDialog.querySelector('input').checked = true;

    this.hopChannelDialog.showModal();
  }

  //*************************************************************************
  hopDialogOk(event) {
    Utils.cancelBubble(event);
    this.hopChannelDialog.close();

    let value = this.hopChannelDialog.querySelector('input[type="radio"]:checked').value;
    let hopChannels = this.newHopChannels(value);
    let hopString = hopChannels.join(' ');
    this.hopChannels.value = hopString;

    Device.MODEL.setItem('RF_PROTOCOL_HK310_HOP_CHANNELS', hopChannels);
  }

  //*************************************************************************
  hopDialogCancel(event) {
    Utils.cancelBubble(event);
    this.hopChannelDialog.close();
  }

  //*************************************************************************
  _address2string(address) {
    return address.map(Utils.byte2string).join(':');
  }

  //*************************************************************************
  _onAddressChange() {
    let data = this._update(this.address, 'RF_PROTOCOL_HK310_ADDRESS', 16);
    Device.MODEL.setItem('RF_PROTOCOL_HK310_ADDRESS', data);
  }

  //*************************************************************************
  _onHopChannelsChange() {
    let data = this._update(this.hopChannels, 'RF_PROTOCOL_HK310_HOP_CHANNELS', 10);

    data = data.map(channel => { return Math.min(channel, 124); });
    Device.MODEL.setItem('RF_PROTOCOL_HK310_HOP_CHANNELS', data);
  }

  //*************************************************************************
  _update(element, key, radix) {

    if (!element.validity.valid) {
      return;
    }

    const re = new RegExp(element.pattern);
    const match = re.exec(element.value);
    const schema = Device.MODEL.getSchema();
    const matchLength = schema[key].c + 1;

    if (!match  ||  match.length !== matchLength) {
      console.log(`${key} pattern regexp failed!`);
      return;
    }

    let data = [];
    for (let i = 1; i < matchLength; i++) {
      data.push(parseInt(match[i], radix));
    }
    return data;
  }

  //*************************************************************************
  rf_protocol_changed(event) {
    Utils.cancelBubble(event);

    let list = document.querySelector('#app-rf_protocol');
    let value = list.querySelector('input[type="radio"]:checked').value;

    Device.MODEL.setItem('RF_PROTOCOL_TYPE', value);
  }
}

window['RFProtocol'] = new RFProtocol();
