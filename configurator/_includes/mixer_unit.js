/*jslint browser: true */
/*global Path, Device, showPage */
"use strict";

var MixerUnit = {
    db: ModelDatabase,
    model_uuid: undefined,
    tx_uuid: undefined,
    index: undefined,
    offset: 0,

    setTextContent: MDLHelper.setTextContent,
    setSwitch: MDLHelper.setSwitch,

    onChangeHandler: function (event) {
        console.log(event.target);
    },

    init: function (params) {
        this.model_uuid = params.model_uuid;
        this.tx_uuid = params.tx_uuid;
        this.index = params.index;

        this.offset = MODEL.MIXER_UNITS.s * this.index;

        this.setTextContent('#app-mixer_unit-src', 'MIXER_UNITS_SRC')
        this.setTextContent('#app-mixer_unit-dst', 'MIXER_UNITS_DST')
        this.setTextContent('#app-mixer_unit-op', 'MIXER_UNITS_OP')
        this.setSwitch('#app-mixer_unit-apply_trim', 'MIXER_UNITS_APPLY_TRIM');
        this.setSwitch('#app-mixer_unit-invert_source', 'MIXER_UNITS_INVERT_SOURCE');
    },

    route: function () {
        MixerUnit.init(this.params);
        showPage('mixer_unit');
    }
};

