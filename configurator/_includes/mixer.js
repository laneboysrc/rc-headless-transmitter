/*jslint browser: true */
/*global Path, Device, showPage */
"use strict";

var Mixer = {
    'model_uuid': null,
    'tx_uuid': null,

    populate: function () {
    },

    route: function () {
        // FIXME: error handling: uuids given; uuids exist in db
        if (this.params.model_uuid) {
            Mixer.model_uuid = this.params.model_uuid;
            Mixer.tx_uuid = this.params.tx_uuid;
            showPage('mixer');
        }
        else {
            location.hash = '#/';
        }
    }
};

