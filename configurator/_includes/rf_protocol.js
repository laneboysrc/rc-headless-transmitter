(function () {
    'use strict';

    var RFProtocol = function RFProtocol() {
    };
    window['RFProtocol'] = new RFProtocol();

    //*************************************************************************
    RFProtocol.prototype.init = function (params) {
        var model = dev.MODEL;

        var address = model.get('RF_PROTOCOL_HK310_ADDRESS');
        var hop_channels = model.get('RF_PROTOCOL_HK310_HOP_CHANNELS');
        var value = '';

        value += Utils.byte2string(address[0]) + ':';
        value += Utils.byte2string(address[1]) + ':';
        value += Utils.byte2string(address[2]) + ':';
        value += Utils.byte2string(address[3]) + ':';
        value += Utils.byte2string(address[4]);
        document.querySelector('#app-rf_protocol-address').value = value;

        value = '';
        for (let channel of hop_channels) {
            value += channel.toString() + " ";
        }
        document.querySelector('#app-rf_protocol-hop_channels').value = value;

        Utils.showPage('rf_protocol');
    };
})();

RFProtocol.route = function () {
    'use strict';
    RFProtocol.init(this.params);
};
