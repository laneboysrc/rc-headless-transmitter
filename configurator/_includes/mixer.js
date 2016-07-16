(function () {
    'use strict';

    var Mixer = function Mixer() {
        this.template = document.querySelector('#app-mixer-template').content;
        this.mixer_list = document.querySelector('#app-mixer-list');
    };
    window['Mixer'] = new Mixer();

    //*************************************************************************
    Mixer.prototype.init = function (params) {
        var mdl = new MDLHelper('MODEL');
        var model = dev.MODEL;
        var mixer_units = model.getSchema()['MIXER_UNITS'];

        // Empty the list of mixers
        mdl.clearDynamicElements(this.mixer_list);

        for (var i = 0; i < mixer_units.c; i++) {
            var offset = i * mixer_units.s;
            var src = model.get('MIXER_UNITS_SRC', {offset: offset});

            // End-of-list is indicated by the mixer unit source being 0
            if (src === 0) {
                break;
            }

            mdl.offset = offset;
            var curve_type = model.get('MIXER_UNITS_CURVE_TYPE', {offset: offset});
            var op = model.get('MIXER_UNITS_OP', {offset: offset});
            var curve = curve_type + ' ' + op;
            var dst = model.get('MIXER_UNITS_DST', {offset: offset});

            var t = this.template;
            t.querySelector('tr').classList.add('can-delete');
            mdl.setTextContent('#app-mixer-template-src', 'MIXER_UNITS_SRC', t);
            mdl.setTextContent('#app-mixer-template-dst', 'MIXER_UNITS_DST', t);
            mdl.setTextContentRaw('#app-mixer-template-mixer_unit', curve, t);
            mdl.setDataURL('#app-mixer-template-mixer_unit', ['mixer_unit', i], t);
            mdl.setDataURL('#app-mixer-template-dst', ['limits', dst], t);

            var clone = document.importNode(t, true);
            this.mixer_list.appendChild(clone);
        }

        Utils.showPage('mixer');
    };
})();
