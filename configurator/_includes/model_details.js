/*jslint browser: true */
/*global Path, Device, showPage */
"use strict";

var ModelDetails = {
    uuid: undefined,
    tx_uuid: undefined,

    offset: 0,
    setTextfield: MDLHelper.setTextfield,

    onChangeHandler: function (event) {
        console.log(event.target.getAttribute('data-source'));
    },

    init: function (params) {
        this.uuid = params.model_uuid;
        this.tx_uuid = params.tx_uuid;

        document.querySelector('#app-model_details-mixer').setAttribute(
            'data-url', '#/mixer/' +  this.uuid + '/' + this.tx_uuid);
        document.querySelector('#app-model_details-rf_protocol').setAttribute(
            'data-url', '#/rf_protocol/' +  this.uuid + '/' + this.tx_uuid);

        this.setTextfield('#app-model_details-name', 'NAME');
    },

    route: function () {
        ModelDetails.init(this.params);
        showPage('model_details');
    }
};

