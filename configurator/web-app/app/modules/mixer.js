'use strict';

var Utils = require('./utils');
var MDLHelper = require('./mdl_helper');


class Mixer {
  constructor() {
    this.template = document.querySelector('#app-mixer-template').content;
    this.mixerList = document.querySelector('#app-mixer-sortable');
    this.cardAddMixerUnit = document.querySelector('#app-mixer-add');
    this.menuAddMixerUnit = document.querySelector('#app-mixer-menu');

    // Number of used mixer units
    this.mixerUnitCount = 0;
    // Maximum number of mixer units
    this.mixerUnitMaxCount = 0;

    this.sortable = undefined;

    this.UNDO = undefined;
    this.snackbarMessage = document.querySelector('#app-mixer-snackbar__message').content.textContent;
    this.snackbarActionText = document.querySelector('#app-mixer-snackbar__action_text').content.textContent;
  }

  //*************************************************************************
  init() {
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
    Device.MODEL.setItem('MIXER_UNITS_SCALAR', 100, {offset: offset});
    Device.MODEL.setItem('MIXER_UNITS_APPLY_TRIM', 1, {offset: offset});
    location.hash = Utils.buildURL(['mixer_unit', this.mixerUnitCount]);
  }

  //*************************************************************************
  editMixerUnit(event, button) {
    Utils.cancelBubble(event);
    location.hash = button.getAttribute('data-url');
  }

  //*************************************************************************
  limits(event, button) {
    Utils.cancelBubble(event);
    location.hash = button.getAttribute('data-url');
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
      message: this.snackbarMessage,
      timeout: 5000,
      actionHandler: this._undoDeleteMixerUnit.bind(this),
      actionText: this.snackbarActionText
    };
    Utils.showSnackbar(data);
  }

  //*************************************************************************
  _populateMixerUnitList() {
    let mdl = new MDLHelper('MODEL');
    let model = Device.MODEL;
    let mixer_units = model.getSchema()['MIXER_UNITS'];

    this.mixerUnitMaxCount = mixer_units.c;
    this.mixerUnitSize = mixer_units.s;

    if (this.sortable) {
      this.sortable.destroy();
      this.sortable = undefined;
    }

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

      this.mixerList.appendChild(t, this.cardAddMixerUnit);
    }

    this._updateUpDownButtonVisibility();

    this.sortable = new Sortable(this.mixerList, {
      handle: '.sortable-handle',
      onEnd: this._reordered.bind(this),
    });
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

    Utils.cancelSnackbar();

    location.hash = Utils.buildURL(['mixer_unit', this.UNDO.index]);
    this.UNDO = undefined;
  }

  //*************************************************************************
  _reordered(evt) {
    const oldIndex = evt.oldIndex;
    const newIndex = evt.newIndex;

    if (oldIndex === newIndex) {
      return;
    }

    console.log(`_reordered ${oldIndex}->${newIndex}`);

    const model = Device.MODEL;
    const schema = model.getSchema();
    const offset = schema.MIXER_UNITS.o;
    const size = schema.MIXER_UNITS.s;

    const movedMixerUnit = model.getItem('MIXER_UNITS', {index: oldIndex});

    if (oldIndex > newIndex) {
      // Item moved up in the list: Move units betwen newIndex and oldIndex
      // backwards by one
      const index = newIndex;
      const src = offset + (index * size);
      const dst = offset + ((index + 1) * size);
      const count = (oldIndex - newIndex) * size;
      model.rawCopy(src, dst, count);
    }
    else {
      // Item moved down in the list: Bring all mixer units between oldIndex
      // and newIndex forward by one
      const index = oldIndex;
      const dst = offset + (index * size);
      const src = offset + ((index + 1) * size);
      const count = (newIndex - oldIndex) * size;
      model.rawCopy(src, dst, count);
    }

    // Put the moved item into its new position
    model.setItem('MIXER_UNITS', movedMixerUnit, {index: newIndex});

    // Update the screen so that all data attributes match the new order
    this._populateMixerUnitList();
  }
}

window['Mixer'] = new Mixer();
