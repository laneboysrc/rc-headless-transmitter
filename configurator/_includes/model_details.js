/*jslint browser: true */
/*global Path, Device, showPage */
"use strict";

var ModelDetails = {
    'model_uuid': null,
    'tx_uuid': null,

    populate: function () {
        var name = ModelDatabase.get(this.model_uuid, 'NAME');
        document.querySelector('#app__model_details__name').value = name;
    },

    showMixer: function () {
        location.hash = '#/mixer/' +  this.model_uuid + '/' + this.tx_uuid;;
    },

    showRFProtocol: function () {
        location.hash = '#/rf_protocol/' +  this.model_uuid + '/' + this.tx_uuid;;
    },

    route: function () {
        // FIXME: error handling: uuids given; uuids exist in db
        if (this.params.model_uuid) {
            ModelDetails.model_uuid = this.params.model_uuid;
            ModelDetails.tx_uuid = this.params.tx_uuid;
            ModelDetails.populate();
            showPage('model_details');
        }
        else {
            location.hash = '#/';
        }
    }
};

