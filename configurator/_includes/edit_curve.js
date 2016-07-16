(function () {
    'use strict';

    var EditCurve = function EditCurve() {
        this.offset = 0;
    };
    window['EditCurve'] = new EditCurve();

    //*************************************************************************
    EditCurve.prototype.init = function (params) {
        this.offset = params.offset;

        var mdl = new MDLHelper('MODEL', {offset: this.offset});

        mdl.setTextContent('#app-edit_curve-curve_type', 'MIXER_UNITS_CURVE_TYPE');
        mdl.setDataURL('#app-edit_curve-curve_type__edit',
            ['select_single', dev.MODEL.uuid, dev.TX.uuid, 'MODEL', 'MIXER_UNITS_CURVE_TYPE', this.offset]);

        mdl.setTextContent('#app-edit_curve-curve_smoothing', 'MIXER_UNITS_CURVE_SMOOTHING');
        mdl.setDataURL('#app-edit_curve-curve_smoothing__edit',
            ['select_single', dev.MODEL.uuid, dev.TX.uuid, 'MODEL', 'MIXER_UNITS_CURVE_SMOOTHING', this.offset]);

        var points = dev.MODEL.get('MIXER_UNITS_CURVE_POINTS', {offset: this.offset});

        for (var i = 0; i < points.length; i += 1) {
            var options = {offset: this.offset, index: i};
            var mdlSlider = new MDLHelper('MODEL', options);
            mdlSlider.setSlider('#app-edit_curve-point' + (i + 1), 'MIXER_UNITS_CURVE_POINTS');
        }

        Utils.showPage('edit_curve');
    };
})();