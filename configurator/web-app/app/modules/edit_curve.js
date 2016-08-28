'use strict';

var Utils = require('./utils');
var MDLHelper = require('./mdl_helper');


class EditCurve {
  constructor () {
    this.offset = 0;
  }

  //*************************************************************************
  init (params) {
    this.offset = params.offset;

    let mdl = new MDLHelper('MODEL', {offset: this.offset});

    mdl.setTextContent('#app-edit_curve-curve_type', 'MIXER_UNITS_CURVE_TYPE');
    mdl.setDataURL('#app-edit_curve-curve_type__edit',
      ['select_single', 'MODEL', 'MIXER_UNITS_CURVE_TYPE', this.offset]);

    mdl.setTextContent('#app-edit_curve-curve_smoothing', 'MIXER_UNITS_CURVE_SMOOTHING');
    mdl.setDataURL('#app-edit_curve-curve_smoothing__edit',
      ['select_single', 'MODEL', 'MIXER_UNITS_CURVE_SMOOTHING', this.offset]);

    let points = Device.MODEL.getItem('MIXER_UNITS_CURVE_POINTS', {offset: this.offset});

    for (let i = 0; i < points.length; i++) {
      let options = {offset: this.offset, index: i};
      let mdlSlider = new MDLHelper('MODEL', options);
      mdlSlider.setSlider('#app-edit_curve-point' + (i + 1), 'MIXER_UNITS_CURVE_POINTS');
    }

    Utils.showPage('edit_curve');
  }

  //*************************************************************************
  back() {
    history.back();
  }
}

window['EditCurve'] = new EditCurve();
