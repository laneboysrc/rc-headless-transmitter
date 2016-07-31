'use strict';

var Utils       = require('./utils');
var MDLHelper   = require('./mdl_helper');


var EditCurve = function () {
    this.offset = 0;
};

//*************************************************************************
EditCurve.prototype.init = function (params) {
    this.offset = params.offset;

    var mdl = new MDLHelper('MODEL', {offset: this.offset});

    mdl.setTextContent('#app-edit_curve-curve_type', 'MIXER_UNITS_CURVE_TYPE');
    mdl.setDataURL('#app-edit_curve-curve_type__edit',
        ['select_single', 'MODEL', 'MIXER_UNITS_CURVE_TYPE', this.offset]);

    mdl.setTextContent('#app-edit_curve-curve_smoothing', 'MIXER_UNITS_CURVE_SMOOTHING');
    mdl.setDataURL('#app-edit_curve-curve_smoothing__edit',
        ['select_single', 'MODEL', 'MIXER_UNITS_CURVE_SMOOTHING', this.offset]);

    var points = dev.MODEL.getItem('MIXER_UNITS_CURVE_POINTS', {offset: this.offset});

    for (var i = 0; i < points.length; i += 1) {
        var options = {offset: this.offset, index: i};
        var mdlSlider = new MDLHelper('MODEL', options);
        mdlSlider.setSlider('#app-edit_curve-point' + (i + 1), 'MIXER_UNITS_CURVE_POINTS');
    }

    Utils.showPage('edit_curve');
};

//*************************************************************************
EditCurve.prototype.back = function (params) {
    history.back();
};

window['EditCurve'] = new EditCurve();
