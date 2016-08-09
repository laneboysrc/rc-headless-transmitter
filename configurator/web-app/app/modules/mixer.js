'use strict';

var Utils = require('./utils');
var MDLHelper = require('./mdl_helper');


class Mixer {
  constructor() {
    this.template = document.querySelector('#app-mixer-template').content;
    this.mixerList = document.querySelector('#app-mixer-list');
    this.cardAddMixerUnit = document.querySelector('#app-mixer-add');
    this.menuAddMixerUnit = document.querySelector('#app-mixer-menu');

    // Number of used mixer units
    this.mixerUnitCount = 0;
    // Maximum number of mixer units
    this.mixerUnitMaxCount = 0;

    this.UNDO = undefined;
    this.snackbar = document.querySelector('#app-mixer-snackbar');
  }

  //*************************************************************************
  init(params) {
    this._populateMixerUnitList();

    // Show/hide addMixderUnit card depending on available space
    Utils.setVisibility(this.cardAddMixerUnit, this.mixerUnitCount < this.mixerUnitMaxCount);
    Utils.setVisibility(this.menuAddMixerUnit, this.mixerUnitCount < this.mixerUnitMaxCount);

    Utils.showPage('mixer');
  }

  //*************************************************************************
  back() {
    history.back();
  }

  //*************************************************************************
  add(event) {
    Utils.cancelBubble(event);
    let offset = this.mixerUnitCount * this.mixerUnitSize;

    // A mixer is valid if the MIXER_UNITS_SRC field is not 0. We therefore
    // create a mixer by setting the MIXER_UNITS_SRC field to the first
    // available value.
    let type = Device.MODEL.getType('MIXER_UNITS_SRC');
    let typeValues = Device.MODEL.getTypeMembers(type);
    Device.MODEL.setItem('MIXER_UNITS_SRC', typeValues[0], {offset: offset});
    location.hash = Utils.buildURL(['mixer_unit', this.mixerUnitCount]);
  }

  //*************************************************************************
  editMixerUnit(event) {
    Utils.cancelBubble(event);
    location.hash = event.target.getAttribute('data-url');
  }

  //*************************************************************************
  limits(event) {
    Utils.cancelBubble(event);
    location.hash = event.target.getAttribute('data-url');
  }

  //*************************************************************************
  deleteMixerUnit(index) {
    index = parseInt(index);

    this.UNDO = {
      index: index,
      data: Device.MODEL.getItem('MIXER_UNITS', {index: index})
    };

    // Bring all mixer units behind 'index' forward
    let schema = Device.MODEL.getSchema();
    let offset = schema.MIXER_UNITS.o;
    let size = schema.MIXER_UNITS.s;

    let dst = offset + (index * size);
    let src = offset + ((index + 1) * size);
    let count = (this.mixerUnitMaxCount - 1 - index) * size;

    Device.MODEL.rawCopy(src, dst, count);

    // Make the last item to an unused mixer unit
    Device.MODEL.setItem('MIXER_UNITS', new Uint8Array(size), {index: this.mixerUnitMaxCount - 1});

    let data = {
      message: 'Mixer unit deleted.',
      timeout: 5000,
      actionHandler: this._undoDeleteMixerUnit.bind(this),
      actionText: 'Undo'
    };
    this.snackbar.MaterialSnackbar.showSnackbar(data);
  }

  //*************************************************************************
  up(event, button) {
    Utils.cancelBubble(event);

    let mixerUnitIndex = parseInt(button.getAttribute('data-index'));

    // Safety bail-out
    if (mixerUnitIndex < 1) {
      return;
    }

    this._swap(mixerUnitIndex, mixerUnitIndex - 1);
  }

  //*************************************************************************
  down(event, button) {
    Utils.cancelBubble(event);

    let mixerUnitIndex = parseInt(button.getAttribute('data-index'));

    // Safety bail-out
    if (mixerUnitIndex >= (this.mixerUnitCount - 1)) {
      return;
    }

    this._swap(mixerUnitIndex, mixerUnitIndex + 1);
  }

  //*************************************************************************
  _populateMixerUnitList() {
    let mdl = new MDLHelper('MODEL');
    let model = Device.MODEL;
    let mixer_units = model.getSchema()['MIXER_UNITS'];

    this.mixerUnitMaxCount = mixer_units.c;
    this.mixerUnitSize = mixer_units.s;

    // Empty the list of mixers
    Utils.clearDynamicElements(this.mixerList);

    for (let i = 0; i < this.mixerUnitMaxCount; i++) {
      let offset = i * this.mixerUnitSize;
      let src = model.getItem('MIXER_UNITS_SRC', {offset: offset});

      // End-of-list is indicated by the mixer unit source being 0
      if (src === 0) {
        this.mixerUnitCount = i;
        break;
      }

      mdl.offset = offset;
      let curve_type = model.getItem('MIXER_UNITS_CURVE_TYPE', {offset: offset});
      let op = model.getItem('MIXER_UNITS_OP', {offset: offset});
      let curve = curve_type + ' ' + op;
      let dst = model.getItem('MIXER_UNITS_DST', {offset: offset});

      let t = document.importNode(this.template, true);
      mdl.setTextContent('.app-mixer-template-src', 'MIXER_UNITS_SRC', t);
      mdl.setTextContent('.app-mixer-template-dst', 'MIXER_UNITS_DST', t);
      mdl.setTextContentRaw('.app-mixer-template-mixer_unit', curve, t);
      mdl.setDataURL('.app-mixer-template-mixer_unit', ['mixer_unit', i], t);
      mdl.setDataURL('.app-mixer-template-dst', ['limits', dst], t);
      mdl.setAttribute('.app-mixer-template-up', 'data-index', i, t);
      mdl.setAttribute('.app-mixer-template-down', 'data-index', i, t);

      this.mixerList.insertBefore(t, this.cardAddMixerUnit);
    }

    this._updateUpDownButtonVisibility();
  }

  //*************************************************************************
  _updateUpDownButtonVisibility() {
    // Enable all but the first up button
    let up = document.querySelectorAll('.app-mixer-template-up');
    for (let i = 0; i < up.length; i++) {
      up[i].disabled = (i === 0);
    }

    // Enable all but the last down button
    let down = document.querySelectorAll('.app-mixer-template-down');
    for (let i = 0; i < down.length; i++) {
      down[i].disabled = (i === (down.length - 1));
    }
  }

  //*************************************************************************
  _undoDeleteMixerUnit() {
    console.log('_undoDeleteMixerUnit');
    if (!this.UNDO) {
      return;
    }

    // Move units from this.UNDO.index on backwards
    let index = this.UNDO.index;
    let schema = Device.MODEL.getSchema();
    let offset = schema.MIXER_UNITS.o;
    let size = schema.MIXER_UNITS.s;

    let src = offset + (index * size);
    let dst = offset + ((index + 1) * size);
    let count = (this.mixerUnitMaxCount - 1 - index) * size;

    Device.MODEL.rawCopy(src, dst, count);

    // Put the deleted item back in place
    Device.MODEL.setItem('MIXER_UNITS', this.UNDO.data, {index: index});

    let mdl = new MDLHelper();
    mdl.cancelSnackbar(this.snackbar);

    location.hash = Utils.buildURL(['mixer_unit', this.UNDO.index]);
    this.UNDO = undefined;
  }

  //*************************************************************************
  _swap(index1, index2) {
    let model = Device.MODEL;

    let unit1 = model.getItem('MIXER_UNITS', {index: index1});
    let unit2 = model.getItem('MIXER_UNITS', {index: index2});

    model.setItem('MIXER_UNITS', unit2, {index: index1});
    model.setItem('MIXER_UNITS', unit1, {index: index2});

    // Rebuild the list of mixer units
    this._populateMixerUnitList();
  }

}

  window['Mixer'] = new Mixer();
