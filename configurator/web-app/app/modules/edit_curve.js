'use strict';

var Utils = require('./utils');
var MDLHelper = require('./mdl_helper');

function getCurvePoints(curveType)
{

  // FIXME: get this from the CONFIG
  switch (curveType) {
    case 'Fixed value':
    case 'Min/Max':
    case '0/Max':
    case '>0':
    case '<0':
    case 'Absolute':
        return ['Point1'];

    case 'Expo':
    case 'Deadband':
      return ['Point1', 'Point2'];

    case '3-Point':
      return ['Point1', 'Point2', 'Point3'];

    case '5-Point':
      return ['Point1', 'Point2', 'Point3', 'Point4', 'Point5'];

    case '7-Point':
      return ['Point1', 'Point2', 'Point3', 'Point4', 'Point5', 'Point6', 'Point7'];

    case '9-Point':
      return ['Point1', 'Point2', 'Point3', 'Point4', 'Point5', 'Point6', 'Point7', 'Point8', 'Point9'];

    case '11-Point':
      return ['Point1', 'Point2', 'Point3', 'Point4', 'Point5', 'Point6', 'Point7', 'Point8', 'Point9', 'Point10', 'Point11'];

    case '13-Point':
      return ['Point1', 'Point2', 'Point3', 'Point4', 'Point5', 'Point6', 'Point7', 'Point8', 'Point9', 'Point10', 'Point11', 'Point12', 'Point13'];

    default:
      return [];
  }
}


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

    let type = Device.MODEL.getItem('MIXER_UNITS_CURVE_TYPE', {offset: this.offset});
    let points = getCurvePoints(type);
    let sliderCount = 13;

    console.log(type, points)

    // FIXME: add curves by using a template

    for (let i = 0; i < sliderCount; i++) {
      Utils.setVisibility('#app-edit_curve-point' + (i + 1) + '__enable', (i < points.length));

      if (i < points.length) {
        let options = {offset: this.offset, index: i};
        let mdlSlider = new MDLHelper('MODEL', options);
        mdlSlider.setSlider('#app-edit_curve-point' + (i + 1), 'MIXER_UNITS_CURVE_POINTS');
      }
    }

    Utils.showPage('edit_curve');
  }

  //*************************************************************************
  back() {
    history.back();
  }
}

window['EditCurve'] = new EditCurve();
