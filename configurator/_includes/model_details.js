/*jslint browser: true */
/*global Path, Device */
"use strict";

var ModelDetails = {
    'model': null,
    'tx': null,
    'populate': function () {
        console.log('ModelDetails.populate_view()');
        document.querySelector('#app__model_details__name').value = this.model.name;
    }
};


Path.map('#/model_details(/:model_uuid)(/:tx_uuid)').to(function () {

    document.querySelector('#app__model_details__name').value = '';

    if (this.params.model_uuid) {
        // FIXME: Look up model_uuid and tx_uuid in the database
        var dev = new Device();
        dev.useDummyDevice();
        ModelDetails.model = dev.model;
        ModelDetails.tx = dev.tx;

        ModelDetails.populate();
    }

    // FIXME: DRY
    for (let page of document.querySelectorAll('.app-page')) {
        page.classList.add('hidden');
    }
    document.querySelector('#page_model_details').classList.remove('hidden');
});