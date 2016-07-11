/*jslint browser: true */
/*global Path, Device */
"use strict";

var Main = {
    'connect': function () {

        let config = CONFIG_VERSIONS[1];

        let model_uuid = Database.list('MODEL')[0]
        let tx_uuid = Database.list('TX')[0]

        location.hash = '#/model_details/' + model_uuid + '/' + tx_uuid;
    }
};


