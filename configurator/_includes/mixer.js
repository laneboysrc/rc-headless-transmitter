/*jslint browser: true */
/*global Path, Device, showPage */
"use strict";

var Mixer = {
    model_uuid: null,
    tx_uuid: null,

    populate: function () {
        let unused = typeLookupByNumber(MODEL.types[MODEL.MIXER_UNITS_SRC.t], 0);

        let mixer_list = document.querySelector('#app-mixer-list');
        let t = document.querySelector('#app-mixer-template');

        // Clear the app-mixer-list based on the class we've added when
        // instantiating the template
        while (mixer_list.querySelector('.can-delete')) {
            let elem = mixer_list.querySelector('.can-delete');
            elem.parentNode.removeChild(elem);
        }

        for (let i = 0; i < MODEL.MIXER_UNITS.c; i++) {
            let offset = i * MODEL.MIXER_UNITS.s;
            let src = ModelDatabase.get(this.model_uuid, 'MIXER_UNITS_SRC', offset);
            if (src === unused) {
                break;
            }

            let dst = ModelDatabase.get(this.model_uuid, 'MIXER_UNITS_DST', offset);
            let curve_type = ModelDatabase.get(this.model_uuid, 'MIXER_UNITS_CURVE_TYPE', offset);
            let op = ModelDatabase.get(this.model_uuid, 'MIXER_UNITS_OP', offset);

            t.content.querySelector('tr').classList.add('can-delete');
            t.content.querySelector('#app-mixer-template-src').textContent = src;
            t.content.querySelector('#app-mixer-template-dst').textContent = dst;
            t.content.querySelector('#app-mixer-template-mixer_unit').textContent = curve_type + ' ' + op;
            let clone = document.importNode(t.content, true);
            mixer_list.appendChild(clone);
        }
    },

    route: function () {
        // FIXME: error handling: uuids given; uuids exist in db
        if (this.params.model_uuid) {
            Mixer.model_uuid = this.params.model_uuid;
            Mixer.tx_uuid = this.params.tx_uuid;
            Mixer.populate();
            showPage('mixer');
        }
        else {
            location.hash = '#/';
        }
    }
};

