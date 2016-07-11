/*jslint browser: true */
/*global Path, Device, showPage */
"use strict";

var MixerUnit = {
    uuid: undefined,
    index: undefined,

    offset: 0,
    setTextContent: MDLHelper.setTextContent,
    setSwitch: MDLHelper.setSwitch,

    onChangeHandler: function (event) {
        let element = event.target;
        let item = element.getAttribute('data-source');
        let value = element.checked ? 1 : 0;

        Database.set(MixerUnit.uuid, item, value, MixerUnit.offset);
    },

    init: function (params) {
        this.uuid = params.model_uuid;
        this.index = params.index;

        let config = Database.getConfig(this.uuid);
        this.offset = config.MODEL.MIXER_UNITS.s * this.index;

        this.setTextContent('#app-mixer_unit-src', 'MIXER_UNITS_SRC')
        this.setSwitch('#app-mixer_unit-invert_source', 'MIXER_UNITS_INVERT_SOURCE');
        this.setTextContent('#app-mixer_unit-dst', 'MIXER_UNITS_DST')
        this.setTextContent('#app-mixer_unit-sw', 'MIXER_UNITS_SW_SW')
        this.setTextContent('#app-mixer_unit-op', 'MIXER_UNITS_OP')
        this.setSwitch('#app-mixer_unit-apply_trim', 'MIXER_UNITS_APPLY_TRIM');

        MDLHelper.setDataURL('#app-mixer_unit-src__edit',
            ['select_single', this.uuid, 'MIXER_UNITS_SRC', this.offset]);
        MDLHelper.setDataURL('#app-mixer_unit-dst__edit',
            ['select_single', this.uuid, 'MIXER_UNITS_DST', this.offset]);
        MDLHelper.setDataURL('#app-mixer_unit-op__edit',
            ['select_single', this.uuid, 'MIXER_UNITS_OP', this.offset]);
    },

    route: function () {
        MixerUnit.init(this.params);
        showPage('mixer_unit');
    }
};

