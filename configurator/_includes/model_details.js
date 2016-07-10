/*jslint browser: true */
/*global Path, Device, showPage */
"use strict";

var ModelDetails = {
    model_uuid: undefined,
    tx_uuid: undefined,

    db: ModelDatabase,
    offset: 0,
    setTextfield: MDLHelper.setTextfield,

    onChangeHandler: function (event) {
        console.log(event.target.getAttribute('data-source'));
    },

    init: function (params) {
        this.model_uuid = params.model_uuid;
        this.tx_uuid = params.tx_uuid;

        document.querySelector('#app-model_details-mixer').setAttribute(
            'data-url', '#/mixer/' +  this.model_uuid + '/' + this.tx_uuid);
        document.querySelector('#app-model_details-rf_protocol').setAttribute(
            'data-url', '#/rf_protocol/' +  this.model_uuid + '/' + this.tx_uuid);

        this.setTextfield('#app-model_details-name', 'NAME');
        // var name = ModelDatabase.get(this.model_uuid, 'NAME');
        // document.querySelector('#app-model_details-name').value = name;
    },

    route: function () {
        ModelDetails.init(this.params);
        showPage('model_details');
    }
};

