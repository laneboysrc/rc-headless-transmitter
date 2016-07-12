(function () {
    'use strict';

    var Mixer = function Mixer() {
        this.uuid = null;

        this.offset = 0;
        this.setTextContent = MDLHelper.setTextContent;
        this.setSwitch = MDLHelper.setSwitch;
    };
    window['Mixer'] = new Mixer();

    //*************************************************************************
    Mixer.prototype.init = function (params) {
        this.uuid = params.model_uuid;

        var config = Database.getConfig(this.uuid);
        var types = config.TYPES;
        var src_choices = types[config.MODEL.MIXER_UNITS_SRC.t];
        var unused = typeLookupByNumber(src_choices, 0);
        var mixer_list = document.querySelector('#app-mixer-list');

        // Clear the app-mixer-list based on the class we've added when
        // instantiating the template
        while (mixer_list.querySelector('.can-delete')) {
            var elem = mixer_list.querySelector('.can-delete');
            elem.parentNode.removeChild(elem);
        }

        var t = document.querySelector('#app-mixer-template');

        for (var i = 0; i < config.MODEL.MIXER_UNITS.c; i++) {
            var offset = i * config.MODEL.MIXER_UNITS.s;
            var src = Database.get(this.uuid, 'MIXER_UNITS_SRC', offset);
            if (src === unused) {
                break;
            }

            var dst = Database.get(this.uuid, 'MIXER_UNITS_DST', offset);
            var curve_type = Database.get(this.uuid, 'MIXER_UNITS_CURVE_TYPE', offset);
            var op = Database.get(this.uuid, 'MIXER_UNITS_OP', offset);

            t.content.querySelector('tr').classList.add('can-delete');
            t.content.querySelector('#app-mixer-template-src').textContent = src;
            t.content.querySelector('#app-mixer-template-mixer_unit').textContent = curve_type + ' ' + op;
            t.content.querySelector('#app-mixer-template-mixer_unit').setAttribute('data-url', '#/mixer_unit/' + this.uuid + '/' + i);
            t.content.querySelector('#app-mixer-template-dst').textContent = dst;
            t.content.querySelector('#app-mixer-template-dst').setAttribute('data-url', '#/limits/' + this.uuid + '/' + dst);
            var clone = document.importNode(t.content, true);
            mixer_list.appendChild(clone);
        }
    };
})();


Mixer.route = function () {
    Mixer.init(this.params);
    showPage('mixer');
};

