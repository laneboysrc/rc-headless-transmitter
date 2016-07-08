/*jslint browser: true */
/*global Path, Device */
"use strict";

var ModelDetails = {
    'model': null,
    'tx': null,

    'populate': function () {
        document.querySelector('#app__model_details__name').value = this.model.name;
    },

    'route': function () {

        // FIXME: Look up model_uuid and tx_uuid in the database
        document.querySelector('#app__model_details__name').value = '';
        if (this.params.model_uuid) {
            var dev = new Device();
            dev.useDummyDevice();
            ModelDetails.model = dev.model;
            ModelDetails.tx = dev.tx;

            ModelDetails.populate();
        }

        // FIXME: DRY
        for (var page of document.querySelectorAll('.app-page')) {
            page.classList.add('hidden');
        }
        document.querySelector('#page_model_details').classList.remove('hidden');
    }
};

