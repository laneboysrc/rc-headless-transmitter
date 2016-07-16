(function () {
    'use strict';

    var MDLHelper = function MDLHelper(devName, offset=0, index=null) {
        this.devName = devName;
        this.offset = offset;
        this.index = index;
        this.onChangeHandler = onChangeHandler;
    };

    window['MDLHelper'] = MDLHelper;

    MDLHelper.prototype.setTextContent = function (selector, item, root=document) {
        var value = dev[this.devName].get(item, this.offset);
        root.querySelector(selector).textContent = value;
    };

    MDLHelper.prototype.setTextContentRaw = function (selector, value, root=document) {
        root.querySelector(selector).textContent = value;
    };

    MDLHelper.prototype.setSwitch = function (selector, item, root=document) {
        var value = dev[this.devName].get(item, this.offset, this.index);
        var element = root.querySelector(selector);
        element.checked = value;
        element.parentNode.MaterialSwitch.checkToggleState();
        this.setChangeHandler(element, item);
    };

   MDLHelper.prototype.setSlider = function (selector, item, root=document) {
        var value = dev[this.devName].get(item, this.offset, this.index);
        var element = root.querySelector(selector);
        element.MaterialSlider.change(value);
        this.setChangeHandler(element, item);
    };

    MDLHelper.prototype.setTextfield = function (selector, item, root=document) {
        var value = dev[this.devName].get(item, this.offset);
        var element = root.querySelector(selector);
        element.value = value;
        this.setChangeHandler(element, item);
    };

    MDLHelper.prototype.setChangeHandler = function (element, item) {
        var obj = {
            item: item,
            devName: this.devName,
            offset: this.offset,
            index: this.index
        };
        var attribute = JSON.stringify(obj);
        var attributeBase64 = window.btoa(attribute);

        element.setAttribute('data-mdlhelper', attributeBase64);
        element.onchange = this.onChangeHandler;
    };

    MDLHelper.prototype.setDataURL = function (selector, list, root=document) {
        var element = root.querySelector(selector);
        var url = '#/' + list.join('/');
        element.setAttribute('data-url', url);
    };

    MDLHelper.prototype.clearDynamicElements = function (element) {
        var child = element.querySelector('.can-delete');

        while (child) {
            child.parentNode.removeChild(child);
            child = element.querySelector('.can-delete');
        }
    };

    function onChangeHandler (event) {
        var element = event.target;
        var attributeBase64 = element.getAttribute('data-mdlhelper');
        var attribute = window.atob(attributeBase64);
        var obj = JSON.parse(attribute);

        var value = element.value;
        if (element.type === 'checkbox') {
            value = element.checked ? 1 : 0;
        }

        // Update the DBObject
        dev[obj.devName].set(obj.item, value, obj.offset, obj.index);
    }
})();

