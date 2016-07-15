(function () {
    'use strict';

    var EditCurve = function EditCurve() {
        this.offset = 0;
    };
    window['EditCurve'] = new EditCurve();

    //*************************************************************************
    EditCurve.prototype.init = function (params) {
        this.offset = params.offset;

        var mdl = new MDLHelper('MODEL', this.offset);


        mdl.setTextContent('#app-edit_curve-curve_type', 'MIXER_UNITS_CURVE_TYPE');
        mdl.setDataURL('#app-edit_curve-curve_type__edit',
            ['select_single', 'MODEL', 'MIXER_UNITS_CURVE_TYPE', this.offset]);

        mdl.setTextContent('#app-edit_curve-curve_smoothing', 'MIXER_UNITS_CURVE_SMOOTHING');
        mdl.setDataURL('#app-edit_curve-curve_smoothing__edit',
            ['select_single', 'MODEL', 'MIXER_UNITS_CURVE_SMOOTHING', this.offset]);

        var points = dev.MODEL.get('MIXER_UNITS_CURVE_POINTS', this.offset);


        for (var i = 0; i < points.length; i += 1) {
            var point = points[i];
            console.log(i, point);

        }


        Utils.showPage('edit_curve');
    };
})();

EditCurve.route = function () {
    'use strict';
    EditCurve.init(this.params);
};
