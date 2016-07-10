/*jslint browser: true */
/*global Path, Device, showPage */
"use strict";

var ModelDetails = {
    uuid: undefined,
    tx_uuid: undefined,

    offset: 0,
    setTextfield: MDLHelper.setTextfield,

    onChangeHandler: function (event) {
        let element = event.target;
        let item = element.getAttribute('data-source');
        let value = element.value;

        Database.set(ModelDetails.uuid, item, value, ModelDetails.offset);
    },

    init: function (params) {
        this.uuid = params.model_uuid;
        this.tx_uuid = params.tx_uuid;

        this.setTextfield('#app-model_details-name', 'NAME');

        document.querySelector('#app-model_details-mixer').setAttribute(
            'data-url', '#/mixer/' +  this.uuid);
        document.querySelector('#app-model_details-rf_protocol').setAttribute(
            'data-url', '#/rf_protocol/' +  this.uuid );

        // FIXME: show/hide the menu depending on whether tx_uuid is undefined

    },

    route: function () {
        ModelDetails.init(this.params);
        showPage('model_details');
    }
};

