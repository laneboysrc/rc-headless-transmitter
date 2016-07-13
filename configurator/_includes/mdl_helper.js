(function () {
    'use strict';

    var MDLHelper = function MDLHelper(uuid, offset=0) {
        this.uuid = uuid;
        this.offset = offset;
        this.onChangeHandler = onChangeHandler;
    };

    window['MDLHelper'] = MDLHelper;

    MDLHelper.prototype.setTextContent = function (selector, item, root=document) {
        var value = Database.get(this.uuid, item, this.offset);
        root.querySelector(selector).textContent = value;
    };

    MDLHelper.prototype.setTextContentRaw = function (selector, value, root=document) {
        root.querySelector(selector).textContent = value;
    };

    MDLHelper.prototype.setSwitch = function (selector, item, root=document) {
        var value = Database.get(this.uuid, item, this.offset);
        var element = root.querySelector(selector);
        element.checked = value;
        element.parentNode.MaterialSwitch.checkToggleState();
        this.setChangeHandler(element, item);
    };

   MDLHelper.prototype.setSlider = function (selector, item, root=document) {
        var value = Database.get(this.uuid, item, this.offset);
        var element = root.querySelector(selector);
        element.MaterialSlider.change(value);
        this.setChangeHandler(element, item);
    };

    MDLHelper.prototype.setTextfield = function (selector, item, root=document) {
        var value = Database.get(this.uuid, item, this.offset);
        var element = root.querySelector(selector);
        element.value = value;
        this.setChangeHandler(element, item);
    };

    MDLHelper.prototype.setChangeHandler = function (element, item) {
        element.setAttribute('data-source', item);
        element.setAttribute('data-uuid', this.uuid);
        element.setAttribute('data-offset', this.offset);
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
        console.log('MDLHelper.onChangeHandler');
        var element = event.target;
        var item = element.getAttribute('data-source');
        var uuid = element.getAttribute('data-uuid');
        var offset = element.getAttribute('data-offset');

        var value = element.value;
        if (element.type === 'checkbox') {
            value = element.checked ? 1 : 0;
        }

        Database.set(uuid, item, value, offset);
    }
})();

