(function () {
    'use strict';

    var Limits = function Limits() {
        this.uuid = undefined;
        this.tx_uuid = undefined;
        this.channel = undefined;
    };
    window['Limits'] = new Limits();

    //*************************************************************************
    Limits.prototype.init = function (params) {
        this.uuid = params.model_uuid;
        this.tx_uuid = params.tx_uuid;
        this.channel = params.channel;

        var limits = Database.getSchema(this.uuid)['LIMITS'];
        var channel_index = Database.getNumberOfTypeMember(this.uuid, 'MIXER_UNITS_DST', this.channel);

        var offset = limits.s * channel_index;

        var mdl = new MDLHelper(this.uuid, offset);

        mdl.setTextContentRaw('#app-limits-channel', this.channel);
        mdl.setSlider('#app-limits-subtrim', 'LIMITS_SUBTRIM');
        mdl.setSlider('#app-limits-ep_l', 'LIMITS_EP_L');
        mdl.setSlider('#app-limits-ep_h', 'LIMITS_EP_H');
        mdl.setSlider('#app-limits-limit_l', 'LIMITS_LIMIT_L');
        mdl.setSlider('#app-limits-limit_h', 'LIMITS_LIMIT_H');
        mdl.setSlider('#app-limits-failsafe', 'LIMITS_FAILSAFE');
        mdl.setSlider('#app-limits-speed', 'LIMITS_SPEED');

        mdl.setSwitch('#app-limits-invert', 'LIMITS_INVERT');

        showPage('limits');
    };
})();

Limits.route = function () {
    'use strict';
    Limits.init(this.params);
};

