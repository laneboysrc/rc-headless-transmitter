'use strict';

var Utils = require('./utils');
var MDLHelper = require('./mdl_helper');

function getCurvePoints(curveType)
{

  let config = Device.MODEL.getConfig();
  let curvePoints = config.TYPES.curve_points_t;

  if (curvePoints.hasOwnProperty(curveType)) {
    return curvePoints[curveType];
  }
  return [];
}


class EditCurve {
  constructor () {
    this.offset = 0;
    this.container = document.querySelector('#app-edit_curve-container');
    this.template = document.querySelector('#app-edit_curve-template').content;
  }

  //*************************************************************************
  init (params) {
    this.offset = params.offset;

    let mdl = new MDLHelper('MODEL', {offset: this.offset});
    let type = Device.MODEL.getItem('MIXER_UNITS_CURVE_TYPE', {offset: this.offset});
    let points = getCurvePoints(type);

    Utils.clearDynamicElements(this.container);

    mdl.setTextContent('#app-edit_curve-curve_type', 'MIXER_UNITS_CURVE_TYPE');
    mdl.setDataURL('#app-edit_curve-curve_type__edit',
      ['select_single', 'MODEL', 'MIXER_UNITS_CURVE_TYPE', this.offset]);


    mdl.setTextContent('#app-edit_curve-curve_smoothing', 'MIXER_UNITS_CURVE_SMOOTHING');
    mdl.setDataURL('#app-edit_curve-curve_smoothing__edit',
      ['select_single', 'MODEL', 'MIXER_UNITS_CURVE_SMOOTHING', this.offset]);

    for (let i = 0; i < points.length; i++) {
      let options = {offset: this.offset, index: i};
      let mdlSlider = new MDLHelper('MODEL', options);
      let t = document.importNode(this.template, true);

      mdlSlider.setTextContentRaw('.app-edit_curve-template--label', points[i], t);
      mdlSlider.setSlider('input', 'MIXER_UNITS_CURVE_POINTS', t);
      this.container.appendChild(t);
    }

    // Show the smoothing checkbox only if there are 3 or more curve points
    // (as the smoothing applies to 3-point an up only)
    Utils.setVisibility("#app-edit_curve-curve_smoothing__enable", points.length > 2);

    Utils.showPage('edit_curve');
  }

  //*************************************************************************
  back() {
    history.back();
  }
}

window['EditCurve'] = new EditCurve();
