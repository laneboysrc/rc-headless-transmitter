(function () {
    'use strict';
    var MDLHelper = function MDLHelper(master) {
        this.uuid = master.uuid;
        this.offset = master.offset || 0;
        this.onChangeHandler = master.onChangeHandler;
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
        element.setAttribute('data-source', item);
        element.onchange = this.onChangeHandler;
    };

   MDLHelper.prototype.setSlider = function (selector, item, root=document) {
        var value = Database.get(this.uuid, item, this.offset);
        var element = root.querySelector(selector);
        element.MaterialSlider.change(value);
        element.setAttribute('data-source', item);
        element.onchange = this.onChangeHandler;
    };

    MDLHelper.prototype.setTextfield = function (selector, item, root=document) {
        var value = Database.get(this.uuid, item, this.offset);
        var element = root.querySelector(selector);
        element.value = value;
        element.setAttribute('data-source', item);
        element.onblur = this.onChangeHandler;
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
})();

