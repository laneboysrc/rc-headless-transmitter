'use strict';

var Utils       = require('./utils');


class RFProtocol{

  init (params) {
    let model = dev.MODEL;

    let address = model.get('RF_PROTOCOL_HK310_ADDRESS');
    let hop_channels = model.get('RF_PROTOCOL_HK310_HOP_CHANNELS');

    // FIXME: parse address and hop channels and put them back into the db
    let adressString = this.address2string(address);
    document.querySelector('#app-rf_protocol-address').value = adressString;

    let hopString = hop_channels.join(' ');
    document.querySelector('#app-rf_protocol-hop_channels').value = hopString;

    Utils.showPage('rf_protocol');
  }

  back (params) {
    history.back();
  }

  address2string (address) {
    return address.map(Utils.byte2string).join(':');
  }

  generateRandomAddress (event) {
    Utils.cancelBubble(event);

    let address = this.getRandomAddress();
    let adressString = this.address2string(address);
    document.querySelector('#app-rf_protocol-address').value = adressString;

    dev.MODEL.set('RF_PROTOCOL_HK310_ADDRESS', address);
  }

  getRandomAddress () {
    let address = new Uint8Array(5);
    window.crypto.getRandomValues(address);
    return Array.from(address);
  }
}


window['RFProtocol'] = new RFProtocol();
