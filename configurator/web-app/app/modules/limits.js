'use strict';

var Utils       = require('./utils');
var MDLHelper   = require('./mdl_helper');


var Limits = function () {
    this.channel = undefined;
};

//*************************************************************************
Limits.prototype.init = function (params) {
    this.channel = params.channel;

    var model = dev.MODEL;

    var limits = model.getSchema()['LIMITS'];
    var channel_index = model.getNumberOfTypeMember('MIXER_UNITS_DST', this.channel);

    var offset = limits.s * channel_index;

    var mdl = new MDLHelper('MODEL', {offset: offset});

    mdl.setTextContentRaw('#app-limits-channel', this.channel);
    mdl.setSlider('#app-limits-subtrim', 'LIMITS_SUBTRIM');
    mdl.setSlider('#app-limits-ep_l', 'LIMITS_EP_L');
    mdl.setSlider('#app-limits-ep_h', 'LIMITS_EP_H');
    mdl.setSlider('#app-limits-limit_l', 'LIMITS_LIMIT_L');
    mdl.setSlider('#app-limits-limit_h', 'LIMITS_LIMIT_H');
    mdl.setSlider('#app-limits-failsafe', 'LIMITS_FAILSAFE');
    mdl.setSlider('#app-limits-speed', 'LIMITS_SPEED');

    mdl.setSwitch('#app-limits-invert', 'LIMITS_INVERT');

    Utils.showPage('limits');
};

//*************************************************************************
Limits.prototype.back = function (params) {
    history.back();
};

window['Limits'] = new Limits();
