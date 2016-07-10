/*jslint browser: true */
/*global Path, Device, showPage */
"use strict";

var RFProtocol = {
    model_uuid: undefined,
    tx_uuid: undefined,

    db: ModelDatabase,
    offset: 0,

    init: function (params) {
        this.model_uuid = params.model_uuid;
        this.tx_uuid = params.tx_uuid;

        var address = ModelDatabase.get(this.model_uuid, 'RF_PROTOCOL_HK310_ADDRESS');
        var hop_channels = ModelDatabase.get(this.model_uuid, 'RF_PROTOCOL_HK310_HOP_CHANNELS');
        var value = '';

        value += byte2string(address[0]) + ':';
        value += byte2string(address[1]) + ':';
        value += byte2string(address[2]) + ':';
        value += byte2string(address[3]) + ':';
        value += byte2string(address[4]);
        document.querySelector('#app-rf_protocol-address').value = value;

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

