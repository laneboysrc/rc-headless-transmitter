/*jslint browser: true */
/*global Path, Device, showPage */
"use strict";

var RFProtocol = {
    'model_uuid': null,
    'tx_uuid': null,

    populate: function () {
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
        // FIXME: error handling: uuids given; uuids exist in db
        if (this.params.model_uuid) {
            RFProtocol.model_uuid = this.params.model_uuid;
            RFProtocol.tx_uuid = this.params.tx_uuid;
            RFProtocol.populate();
            showPage('rf_protocol');
        }
        else {
            location.hash = '#/';
        }
    }
};

