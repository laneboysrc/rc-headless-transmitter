'use strict';

var Utils = require('./utils');

class MDLHelper {
  constructor (devName, options) {
    options = options || {
      offset: 0,
      index: undefined,
      formatter: undefined,
      parser: undefined
    };

    this.devName = devName;
    this.offset = options.offset;
    this.index = options.index;
    this.formatter = options.formatter;
    this.parser = options.parser;

    // The change handler function is called in context of another
    // function, so we need to bind this object to it.
    this.onChangeHandler = this.onChangeHandler.bind(this);
  }

  setTextContent (selector, item, root) {
    root = root || document;

    let value = dev[this.devName].getItem(item, {offset: this.offset});
    if (this.formatter) {
      value = this.formatter(value);
    }

    root.querySelector(selector).textContent = value;
  }

  setTextContentRaw (selector, value, root) {
    root = root || document;

    root.querySelector(selector).textContent = value;
  }

  setSwitch (selector, item, root) {
    root = root || document;

    let options = {
      offset: this.offset,
      index: this.index
    };
    let value = dev[this.devName].getItem(item, options);
    let element = root.querySelector(selector);
    element.checked = value;
    element.parentNode.MaterialSwitch.checkToggleState();
    this.setChangeHandler(element, item);
  }

  setSlider (selector, item, root) {
    root = root || document;

    let options = {
      offset: this.offset,
      index: this.index
    };
    let value = dev[this.devName].getItem(item, options);
    if (this.formatter) {
      value = this.formatter(value);
    }

    let element = root.querySelector(selector);
    element.MaterialSlider.change(value);
    this.setChangeHandler(element, item);
  }

  setTextfield (selector, item, root) {
    root = root || document;

    let value = dev[this.devName].getItem(item, {offset: this.offset});
    if (this.formatter) {
      value = this.formatter(value);
    }

    let element = root.querySelector(selector);
    element.value = value;
    this.setChangeHandler(element, item);
  }

  setChangeHandler (element, item) {
    element.setAttribute('data-mdlhelper', item);
    element.onchange = this.onChangeHandler;
  }

  setDataURL (selector, list, root) {
    root = root || document;

    let element = root.querySelector(selector);
    let url = Utils.buildURL(list);
    element.setAttribute('data-url', url);
  }

  clearDynamicElements (element) {
    let child = element.querySelector('.can-delete');

    while (child) {
      child.parentNode.removeChild(child);
      child = element.querySelector('.can-delete');
    }
  }

  onChangeHandler (event) {
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
    dev[this.devName].setItem(item, value, options);
  }
}

module.exports = MDLHelper;
