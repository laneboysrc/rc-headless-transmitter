'use strict';

var Utils = require('./utils');


var MDLHelper = function MDLHelper(devName, options) {
    options = options || {
        offset: 0,
        index: undefined,
        formatter: undefined,
        parser: undefined};

    this.devName = devName;
    this.offset = options.offset;
    this.index = options.index;
    this.formatter = options.formatter;
    this.parser = options.parser;

    // The change handler function is called in context of another
    // function, so we need to bind this object to it.
    this.onChangeHandler = this.onChangeHandler.bind(this);
};

MDLHelper.prototype.setTextContent = function (selector, item, root) {
    root = root || document;

    var value = dev[this.devName].get(item, {offset: this.offset});
    if (this.formatter) {
        value = this.formatter(value);
    }

    root.querySelector(selector).textContent = value;
};

MDLHelper.prototype.setTextContentRaw = function (selector, value, root) {
    root = root || document;

    root.querySelector(selector).textContent = value;
};

MDLHelper.prototype.setSwitch = function (selector, item, root) {
    root = root || document;

    var options = {
        offset: this.offset,
        index: this.index
    };
    var value = dev[this.devName].get(item, options);
    var element = root.querySelector(selector);
    element.checked = value;
    element.parentNode.MaterialSwitch.checkToggleState();
    this.setChangeHandler(element, item);
};

MDLHelper.prototype.setSlider = function (selector, item, root) {
    root = root || document;

    var options = {
        offset: this.offset,
        index: this.index
    };
    var value = dev[this.devName].get(item, options);
    if (this.formatter) {
        value = this.formatter(value);
    }

    var element = root.querySelector(selector);
    element.MaterialSlider.change(value);
    this.setChangeHandler(element, item);
};

MDLHelper.prototype.setTextfield = function (selector, item, root) {
    root = root || document;

    var value = dev[this.devName].get(item, {offset: this.offset});
    if (this.formatter) {
        value = this.formatter(value);
    }

    var element = root.querySelector(selector);
    element.value = value;
    this.setChangeHandler(element, item);
};

MDLHelper.prototype.setChangeHandler = function (element, item) {
    element.setAttribute('data-mdlhelper', item);
    element.onchange = this.onChangeHandler;
};

MDLHelper.prototype.setDataURL = function (selector, list, root) {
    root = root || document;

    var element = root.querySelector(selector);
    var url = Utils.buildURL(list);
    element.setAttribute('data-url', url);
};

MDLHelper.prototype.clearDynamicElements = function (element) {
    var child = element.querySelector('.can-delete');

    while (child) {
        child.parentNode.removeChild(child);
        child = element.querySelector('.can-delete');
    }
};

MDLHelper.prototype.onChangeHandler = function (event) {
    var element = event.target;

    var value = element.value;
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

        var pattern = element.getAttribute('pattern');
        if (pattern) {
            var re = new RegExp(pattern);

            var parsed = re.exec(value);
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

    var item = element.getAttribute('data-mdlhelper');
    var options = {offset: this.offset, index: this.index};

    // Update the DBObject
    dev[this.devName].set(item, value, options);
};


module.exports = MDLHelper;
