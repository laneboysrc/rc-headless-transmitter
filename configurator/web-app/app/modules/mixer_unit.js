'use strict';

var Utils = require('./utils');
var MDLHelper = require('./mdl_helper');
var CurveView = require('./curve_view');


class MixerUnit {
  constructor() {
    this.offset = 0;

    this.curveViewSVG = document.querySelector('#app-mixer_unit-curve_view');
    this.curveView = new CurveView(this.curveViewSVG, true);

    document.querySelector('#app-mixer_unit-offset').addEventListener('input', this._offsetChanged.bind(this));
    document.querySelector('#app-mixer_unit-scalar').addEventListener('input', this._scalarChanged.bind(this));
  }

  //*************************************************************************
  init(params) {
    this.index = params.index;

    let mixer_units = Device.MODEL.getSchema()['MIXER_UNITS'];
    this.offset = mixer_units.s * this.index;

    let mdl = new MDLHelper('MODEL', {offset: this.offset});

    mdl.setTextContent('#app-mixer_unit-src', 'MIXER_UNITS_SRC');
    mdl.setSwitch('#app-mixer_unit-invert_source', 'MIXER_UNITS_INVERT_SOURCE');
    mdl.setTextContent('#app-mixer_unit-dst', 'MIXER_UNITS_DST');
    mdl.setTextContent('#app-mixer_unit-op', 'MIXER_UNITS_OP');
    mdl.setSwitch('#app-mixer_unit-apply_trim', 'MIXER_UNITS_APPLY_TRIM');
    mdl.setTextContent('#app-mixer_unit-curve', 'MIXER_UNITS_CURVE_TYPE');
    mdl.setTextContent('#app-mixer_unit-sw', 'MIXER_UNITS_SW_SW');

    mdl.setDataURL('#app-mixer_unit-curve__edit', ['edit_curve', this.offset]);
    mdl.setDataURL('#app-mixer_unit-sw__edit', ['edit_switch', this.offset]);
    mdl.setDataURL('#app-mixer_unit-src__edit',
      ['select_single', 'MODEL', 'MIXER_UNITS_SRC', this.offset]);
    mdl.setDataURL('#app-mixer_unit-dst__edit',
      ['select_single', 'MODEL', 'MIXER_UNITS_DST', this.offset]);
    mdl.setDataURL('#app-mixer_unit-op__edit',
      ['select_single', 'MODEL', 'MIXER_UNITS_OP', this.offset]);

    mdl.setSlider('#app-mixer_unit-scalar', 'MIXER_UNITS_SCALAR');
    mdl.setSlider('#app-mixer_unit-offset', 'MIXER_UNITS_OFFSET');


    // Set the curve view display to the curve settings
    this.curveView.type = Device.MODEL.getItem('MIXER_UNITS_CURVE_TYPE', {offset: this.offset});;
    this.curveView.smoothing = Device.MODEL.getItemNumber('MIXER_UNITS_CURVE_SMOOTHING', {offset: this.offset});
    this.curveView.points = Device.MODEL.getItemNumber('MIXER_UNITS_CURVE_POINTS', {offset: this.offset});
    this._offsetChanged();
    this._scalarChanged();

    Utils.showPage('mixer_unit');
  }

  //*************************************************************************
  back() {
    history.back();
  }

  //*************************************************************************
  delete(event) {
    Utils.cancelBubble(event);

    Mixer.deleteMixerUnit(this.index);
    history.back();
  }

  //*************************************************************************
  _offsetChanged() {
    this.curveView.offset = parseInt(document.querySelector('#app-mixer_unit-offset').value);
  }

  //*************************************************************************
  _scalarChanged() {
    this.curveView.scalar = parseInt(document.querySelector('#app-mixer_unit-scalar').value);
  }
}

window['MixerUnit'] = new MixerUnit();
