/*jslint browser: true */
/*global Path, Device, showPage */
"use strict";

var Mixer = {
    uuid: null,

    offset: 0,
    setTextContent: MDLHelper.setTextContent,
    setSwitch: MDLHelper.setSwitch,

    init: function (params) {
        this.uuid = params.model_uuid;

        let config = Database.getConfig(this.uuid);
        let types = config.TYPES;
        let src_choices = types[config.MODEL.MIXER_UNITS_SRC.t];
        let unused = typeLookupByNumber(src_choices, 0);
        let mixer_list = document.querySelector('#app-mixer-list');

        // Clear the app-mixer-list based on the class we've added when
        // instantiating the template
        while (mixer_list.querySelector('.can-delete')) {
            let elem = mixer_list.querySelector('.can-delete');
            elem.parentNode.removeChild(elem);
        }

        let t = document.querySelector('#app-mixer-template');

        for (let i = 0; i < config.MODEL.MIXER_UNITS.c; i++) {
            let offset = i * config.MODEL.MIXER_UNITS.s;
            let src = Database.get(this.uuid, 'MIXER_UNITS_SRC', offset);
            if (src === unused) {
                break;
            }

            let dst = Database.get(this.uuid, 'MIXER_UNITS_DST', offset);
            let curve_type = Database.get(this.uuid, 'MIXER_UNITS_CURVE_TYPE', offset);
            let op = Database.get(this.uuid, 'MIXER_UNITS_OP', offset);

            t.content.querySelector('tr').classList.add('can-delete');
            t.content.querySelector('#app-mixer-template-src').textContent = src;
            t.content.querySelector('#app-mixer-template-mixer_unit').textContent = curve_type + ' ' + op;
            t.content.querySelector('#app-mixer-template-mixer_unit').setAttribute('data-url', '#/mixer_unit/' + this.uuid + '/' + i);
            t.content.querySelector('#app-mixer-template-dst').textContent = dst;
            t.content.querySelector('#app-mixer-template-dst').setAttribute('data-url', '#/limits/' + this.uuid + '/' + dst);
            let clone = document.importNode(t.content, true);
            mixer_list.appendChild(clone);
        }
    },

    route: function () {
        Mixer.init(this.params);
        showPage('mixer');
    }
};

