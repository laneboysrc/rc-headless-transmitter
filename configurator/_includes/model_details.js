/*jslint browser: true */
/*global Path, Device, showPage */
"use strict";

var ModelDetails = {
    'model_uuid': null,
    'tx_uuid': null,

    'populate': function () {
        var name = ModelDatabase.get(this.model_uuid, 'name');
        document.querySelector('#app__model_details__name').value = name;
    },

    'route': function () {
        // FIXME: error handling: uuids given; uuids exist in db
        if (this.params.model_uuid) {
            ModelDetails.model_uuid = this.params.model_uuid;
            ModelDetails.populate();
            showPage('model_details');
        }
        else {
            location.hash = '#/';
        }
    }
};

