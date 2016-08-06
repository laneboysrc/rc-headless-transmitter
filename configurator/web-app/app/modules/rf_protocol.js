'use strict';

var Utils = require('./utils');
var dialogPolyfill = require('dialog-polyfill');

class RFProtocol{
  constructor () {
    this.hopChannelDialog = document.querySelector('#app-rf_protocol-hop_channel_dialog');
    if (! this.hopChannelDialog.showModal) {
      dialogPolyfill.registerDialog(this.hopChannelDialog);
    }
  }

  //*************************************************************************
  init (params) {
    let model = Device.MODEL;

    let address = model.getItem('RF_PROTOCOL_HK310_ADDRESS');
    let hopChannels = model.getItem('RF_PROTOCOL_HK310_HOP_CHANNELS');

    // FIXME: parse address and hop channels and put them back into the db
    let adressString = this.address2string(address);
    document.querySelector('#app-rf_protocol-address').value = adressString;

    let hopString = hopChannels.join(' ');
    document.querySelector('#app-rf_protocol-hop_channels').value = hopString;

    Utils.showPage('rf_protocol');
  }

  //*************************************************************************
  back (params) {
    history.back();
  }

  //*************************************************************************
  address2string (address) {
    return address.map(Utils.byte2string).join(':');
  }

  //*************************************************************************
  generateRandomAddress (event) {
    Utils.cancelBubble(event);

    let address = Utils.newRandomAddress();
    let adressString = this.address2string(address);
    document.querySelector('#app-rf_protocol-address').value = adressString;

    Device.MODEL.setItem('RF_PROTOCOL_HK310_ADDRESS', address);
  }

  //*************************************************************************
  showHopChannelDialog (event) {
    Utils.cancelBubble(event);

    // Select the first element
    this.hopChannelDialog.querySelector('input').checked = true;

    this.hopChannelDialog.showModal();
  }

  //*************************************************************************
  hopDialogOk (event) {
    Utils.cancelBubble(event);
    this.hopChannelDialog.close();

    let value = this.hopChannelDialog.querySelector('input[type="radio"]:checked').value;
    let hopChannels = this.newHopChannels(value);
    let hopString = hopChannels.join(' ');
    document.querySelector('#app-rf_protocol-hop_channels').value = hopString;

    Device.MODEL.setItem('RF_PROTOCOL_HK310_HOP_CHANNELS', hopChannels);
  }

  //*************************************************************************
  hopDialogCancel (event) {
    Utils.cancelBubble(event);
    this.hopChannelDialog.close();
  }

  //*************************************************************************
  newHopChannels (type) {
    var hopChannels = [];
    var isNearBindChannel;
    var channelAlreadyUsed;
    var random = new Uint8Array(1);
    var channel;

    switch (type) {
      case 'ism':
        random = new Uint8Array(20);
        window.crypto.getRandomValues(random);

        for (let i = 0; i < 20; i++) {
          do {
            window.crypto.getRandomValues(random);
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
            window.crypto.getRandomValues(random);
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
        window.crypto.getRandomValues(random);

        let firstChannel = random[0] % 49;
        for (let i = 0; i < 20; i++) {
          hopChannels[i] = firstChannel + i;
        }
        break;
    }

    return hopChannels;
  }
}

window['RFProtocol'] = new RFProtocol();
