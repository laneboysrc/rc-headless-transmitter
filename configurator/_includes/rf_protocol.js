/*jslint browser: true */
/*global Path, Device, showPage */
"use strict";

var RFProtocol = {
    uuid: undefined,
    tx_uuid: undefined,

    offset: 0,

    init: function (params) {
        this.uuid = params.model_uuid;
        this.tx_uuid = params.tx_uuid;

        var address = Database.get(this.uuid, 'RF_PROTOCOL_HK310_ADDRESS');
        var hop_channels = Database.get(this.uuid, 'RF_PROTOCOL_HK310_HOP_CHANNELS');
        var value = '';

        value += byte2string(address[0]) + ':';
        value += byte2string(address[1]) + ':';
        value += byte2string(address[2]) + ':';
        value += byte2string(address[3]) + ':';
        value += byte2string(address[4]);
        document.querySelector('#app-rf_protocol-address').value = value;

        // FIXME: make hop channel edit field wider

        value = ''
        for (let channel of hop_channels) {
            value += channel.toString() + " ";
        }
        document.querySelector('#app-rf_protocol-hop_channels').value = value;
    },

    route: function () {
        RFProtocol.init(this.params);
        showPage('rf_protocol');
    }
};

