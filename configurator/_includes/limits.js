/*jslint browser: true */
/*global Path, Device, showPage */
"use strict";

var Limits = {
    model_uuid: undefined,
    tx_uuid: undefined,
    channel: undefined,

    onChangeHandler: function (event) {
        console.log(event.target);
    },

    populate: function () {
        let channel_index = channel2index(this.channel);
        let offset = MODEL.LIMITS.s * channel_index;

        function setSlider(selector, item) {
            let value = ModelDatabase.get(Limits.model_uuid, item, offset);
            let element = document.querySelector(selector);
            element.MaterialSlider.change(value);
            element.onchange = Limits.onChangeHandler;
        }

        function setSwitch(selector, item) {
            let value = ModelDatabase.get(Limits.model_uuid, item, offset);
            let element = document.querySelector(selector);
            element.checked = value;
            element.parentNode.MaterialSwitch.checkToggleState();
            element.onchange = Limits.onChangeHandler;
        }

        setSlider('#app-limits-subtrim', 'LIMITS_SUBTRIM');
        setSlider('#app-limits-ep_l', 'LIMITS_EP_L');
        setSlider('#app-limits-ep_h', 'LIMITS_EP_H');
        setSlider('#app-limits-limit_l', 'LIMITS_LIMIT_L');
        setSlider('#app-limits-limit_h', 'LIMITS_LIMIT_H');
        setSlider('#app-limits-failsafe', 'LIMITS_FAILSAFE');
        setSlider('#app-limits-speed', 'LIMITS_SPEED');

        setSwitch('#app-limits-invert', 'LIMITS_INVERT');
    },

    route: function () {
        Limits.model_uuid = this.params.model_uuid;
        Limits.tx_uuid = this.params.tx_uuid;
        Limits.channel = this.params.channel;
        Limits.populate();
        showPage('limits');
    }
};

