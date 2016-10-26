'use strict';

var Utils = require('./utils');
var dialogPolyfill = require('dialog-polyfill');


class MDLHelper {
  constructor(devName, options) {
    options = options || {
      offset: 0,
      index: undefined,
      formatter: undefined,
      parser: undefined
    };

    this.icons = {
      0: 'directions_car',      // Car
      1: 'flight',              // Airplane
      2: 'local_shipping',      // Truck
      3: 'directions_boat',     // Boat
      4: 'motorcycle',          // Motorcycle
      5: 'zoom_out_map',        // Quadcopter
    };

    this.devName = devName;
    this.offset = options.offset;
    this.index = options.index;
    this.formatter = options.formatter;
    this.parser = options.parser;
    this.timer = null;

    // The change handler function is called in context of another
    // function, so we need to bind this object to it.
    this.onChangeHandler = this._onchange.bind(this);
    this.onInputHandler = this._oninput.bind(this);

    this.sliderDialog = document.querySelector('#app-slider-fine-adjustment_dialog');
    this.sliderDialogElements = {};
    this.sliderDialogElements.done = this.sliderDialog.querySelector('.mdl-dialog__actions button');
    this.sliderDialogElements.number = this.sliderDialog.querySelector('.mdl-dialog__content input');
    this.sliderDialogElements.decrement = this.sliderDialog.querySelector('.mdl-dialog__content button');
    this.sliderDialogElements.increment = this.sliderDialog.querySelector('.mdl-dialog__content button:nth-child(3)');

    if (! this.sliderDialog.showModal) {
      dialogPolyfill.registerDialog(this.sliderDialog);
    }

  }


  createSpan(text, classes) {
    let span = document.createElement('span');
    let textNode = document.createTextNode(text);
    span.appendChild(textNode);

    if (Utils.isDefined(classes)) {
      span.className = classes;
    }

    return span;
  }

  cancelSnackbar(snackbarElement) {
    // Hack: we are accessing internal MaterialSnackbar stuff here
    if (snackbarElement.MaterialSnackbar.active) {
      snackbarElement.MaterialSnackbar.cleanup_();
    }
  }

  setTextContent(selector, item, root) {
    root = root || document;

    let value = Device[this.devName].getItem(item, {offset: this.offset});
    if (this.formatter) {
      value = this.formatter(value);
    }

    root.querySelector(selector).textContent = value;
  }

  setTextContentRaw(selector, value, root) {
    root = root || document;

    root.querySelector(selector).textContent = value;
  }

  setSwitch(selector, item, root) {
    root = root || document;

    let options = {
      offset: this.offset,
      index: this.index
    };
    let value = Device[this.devName].getItem(item, options);
    let element = root.querySelector(selector);

    // Ensure the element is already upgraded. This is important for dynamically
    // added items
    componentHandler.upgradeElement(element);

    element.checked = value;
    element.parentNode.MaterialSwitch.checkToggleState();
    this.setChangeHandler(element, item);
  }

  setSlider(selector, item, root) {
    root = root || document;

    let options = {
      offset: this.offset,
      index: this.index
    };
    let value = Device[this.devName].getItem(item, options);
    if (this.formatter) {
      value = this.formatter(value);
    }

    let element = root.querySelector(selector);

    // Ensure the element is already upgraded. This is important for dynamically
    // added items
    componentHandler.upgradeElement(element);

    element.MaterialSlider.change(value);
    this.setChangeHandler(element, item);
    element.oninput = this.onInputHandler;

    // If the slider is in a table row, then we set the double-click handler
    // of the row to trigger fine-selection and numerical entry of the slider
    if (element.parentNode  &&
        element.parentNode.parentNode  &&
        element.parentNode.parentNode.parentNode) {
      let left = element.parentNode.parentNode.parentNode;
      if (left.tagName === 'TR') {
        left.ondblclick = this._ondblclick.bind(this, element);
      }
    }
  }

  setTextfield(selector, item, root) {
    root = root || document;

    let value = Device[this.devName].getItem(item, {offset: this.offset});
    if (this.formatter) {
      value = this.formatter(value);
    }

    let element = root.querySelector(selector);
    element.value = value;
    this.setChangeHandler(element, item);
  }

  setIcon(selector, tag, root) {
    root = root || document;

    let element = root.querySelector(selector);
    let value = Utils.isNumber(tag) ? tag : Device[this.devName].getItem('TAG');

    if (!this.icons.hasOwnProperty(value)) {
      value = 0;
    }
    element.textContent = this.icons[value];
  }

  setChangeHandler(element, item) {
    element.setAttribute('data-mdlhelper', item);
    element.onchange = this.onChangeHandler;
  }

  setDataURL(selector, list, root) {
    let url = Utils.buildURL(list);
    this.setAttribute(selector, 'data-url', url, root);
  }

  setAttribute(selector, attribute, value, root) {
    root = root || document;

    let element = root.querySelector(selector);
    element.setAttribute(attribute, value);
  }

  _onchange(event) {
    let element = event.target;

    let value = element.value;
    if (element.type === 'checkbox') {
      value = element.checked ? 1 : 0;
    }

    // If the element has a pattern attribute then check its validity
    // and use the pattern to parse the value. This way we can remove
    // whitespace, and convert string made from lists back into lists.
    if (element.validity) {
      if (! element.validity.valid) {
        console.log(element.id + ': Input invalid, not saving!');
        return;
      }

      let pattern = element.getAttribute('pattern');
      if (pattern) {
        let re = new RegExp(pattern);

        let parsed = re.exec(value);
        if (parsed) {
          if (parsed.length === 2) {
            value = parsed[1];
          }
          else {
            value = parsed.slice(1);
          }
        }
      }
    }

    // For elements where we need to do more advanced parsing than the
    // regex in pattern can provide, and to do validation of elements,
    // we can call a parser callback. If the callback returns 'undefine'
    // then parsing/validation failed.
    if (this.parser) {
      value = this.parser(value);
      if (typeof value === 'undefined') {
        console.log(element.id + ': Parser returned undefined, not saving!');
        return;
      }
    }

    let item = element.getAttribute('data-mdlhelper');
    let options = {offset: this.offset, index: this.index};

    // Update the DatabaseObject
    Device[this.devName].setItem(item, value, options);
  }

  _oninput(event) {
    let element = event.target;
    let value = element.value;
    let item = element.getAttribute('data-mdlhelper');
    let options = {offset: this.offset, index: this.index, preview: true};
    let self = this;

    this.timerParameters = {item: item, value: value, options: options};

    function timerExpired() {
      self.timer = null;
      let p = self.timerParameters;
      Device[self.devName].setItem(p.item, p.value, p.options);
    }

    if (this.timer === null) {
      this.timer = setTimeout(timerExpired, 100);
    }
  }

  _ondblclick(element, event) {
    Utils.cancelBubble(event);

    this.sliderDialogElements.slider = element;
    this.sliderDialogElements.number.value = element.value;
    this.sliderDialogElements.number.onchange = this._onNumberChange.bind(this);
    this.sliderDialogElements.decrement.onclick = this._onDecrement.bind(this);
    this.sliderDialogElements.increment.onclick = this._onIncrement.bind(this);
    this.sliderDialogElements.done.onclick = this._sliderDialogOk.bind(this);

    this.sliderDialog.showModal();
  }

  _onDecrement() {
    const e = this.sliderDialogElements;
    e.slider.MaterialSlider.change(parseInt(e.slider.value) - 1);
    e.number.value = e.slider.value;

    var newEvent = new Event('input', {
      target: e.slider
    });

    e.slider.dispatchEvent(newEvent);
  }

  _onIncrement() {
    const e = this.sliderDialogElements;
    e.slider.MaterialSlider.change(parseInt(e.slider.value) + 1);
    e.number.value = e.slider.value;

    var newEvent = new Event('input', {
      target: e.slider
    });

    e.slider.dispatchEvent(newEvent);
  }

  _onNumberChange() {
    const e = this.sliderDialogElements;
    e.slider.MaterialSlider.change(parseInt(e.number.value));
    e.number.value = e.slider.value;

    // this._onchange({"target": e.slider});

    var newEvent = new Event('input', {
      target: e.slider
    });

    e.slider.dispatchEvent(newEvent);
  }

  _sliderDialogOk(event) {
    Utils.cancelBubble(event);
    this.sliderDialog.close();

    const e = this.sliderDialogElements;

    var newEvent = new Event('change', {
      target: e.slider
    });

    e.slider.dispatchEvent(newEvent);
  }


}
module.exports = MDLHelper;
