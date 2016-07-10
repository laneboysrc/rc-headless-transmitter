/*jslint browser: true */
/*global Path, Device */
"use strict";

var Main = {
    'connect': function () {
        let model_uuid = ModelDatabase.get(ModelDatabase.list(), 'UUID');
        let tx_uuid = TransmitterDatabase.get(TransmitterDatabase.list(), 'UUID');

        location.hash = '#/model_details/' + model_uuid + '/' + tx_uuid;
    }
};


