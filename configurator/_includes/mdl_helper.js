"use strict";

var MDLHelper = {
    setTextContent: function (selector, item) {
        let value = Database.get(this.uuid, item, this.offset);
        document.querySelector(selector).textContent = value;
    },

    setSwitch: function (selector, item) {
        let value = Database.get(this.uuid, item, this.offset);
        let element = document.querySelector(selector);
        element.checked = value;
        element.parentNode.MaterialSwitch.checkToggleState();
        element.setAttribute('data-source', item);
        element.onchange = this.onChangeHandler;
    },

   setSlider: function (selector, item) {
        let value = Database.get(this.uuid, item, this.offset);
        let element = document.querySelector(selector);
        element.MaterialSlider.change(value);
        element.setAttribute('data-source', item);
        element.onchange = this.onChangeHandler;
    },

    setTextfield: function (selector, item) {
        let value = Database.get(this.uuid, item, this.offset);
        let element = document.querySelector(selector);
        element.value = value;
        element.setAttribute('data-source', item);
        element.onblur = this.onChangeHandler;
    }
};