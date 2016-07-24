'use strict';

var Utils       = require('./utils');


var RFProtocol = function () {};

//*************************************************************************
RFProtocol.prototype.init = function (params) {
    var model = dev.MODEL;

    var address = model.get('RF_PROTOCOL_HK310_ADDRESS');
    var hop_channels = model.get('RF_PROTOCOL_HK310_HOP_CHANNELS');

    // FIXME: parse address and hop channels and put them back into the db

    var adress_string = address.map(Utils.byte2string).join(':');
    document.querySelector('#app-rf_protocol-address').value = adress_string;

    var hop_string = hop_channels.join(' ');
    document.querySelector('#app-rf_protocol-hop_channels').value = hop_string;

    Utils.showPage('rf_protocol');
};

window['RFProtocol'] = new RFProtocol();
