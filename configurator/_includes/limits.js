/*jslint browser: true */
/*global Path, Device, showPage */
"use strict";

var Limits = {
    uuid: undefined,
    tx_uuid: undefined,
    channel: undefined,
    channel_index: undefined,

    offset: 0,
    setTextContent: MDLHelper.setTextContent,
    setSwitch: MDLHelper.setSwitch,
    setSlider: MDLHelper.setSlider,

    onChangeHandler: function (event) {
        console.log(event.target.getAttribute('data-source'));
    },

    init: function (params) {
        this.uuid = params.model_uuid;
        this.tx_uuid = params.tx_uuid;
        this.channel = params.channel;

        this.channel_index = channel2index(this.channel);
        this.offset = MODEL.LIMITS.s * this.channel_index;

        document.querySelector('#app-limits-channel').textContent = this.channel;
        this.setSlider('#app-limits-subtrim', 'LIMITS_SUBTRIM');
        this.setSlider('#app-limits-ep_l', 'LIMITS_EP_L');
        this.setSlider('#app-limits-ep_h', 'LIMITS_EP_H');
        this.setSlider('#app-limits-limit_l', 'LIMITS_LIMIT_L');
        this.setSlider('#app-limits-limit_h', 'LIMITS_LIMIT_H');
        this.setSlider('#app-limits-failsafe', 'LIMITS_FAILSAFE');
        this.setSlider('#app-limits-speed', 'LIMITS_SPEED');

        this.setSwitch('#app-limits-invert', 'LIMITS_INVERT');
    },

    route: function () {
        Limits.init(this.params);
        showPage('limits');
    }
};

