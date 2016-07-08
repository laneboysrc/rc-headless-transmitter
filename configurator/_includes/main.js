/*jslint browser: true */
/*global Path, Device */
"use strict";

var Main = {
    'connect': function () {
        var dev = new Device();
        dev.useDummyDevice();
        var model_uuid = dev.model.uuid;
        var tx_uuid = dev.tx.uuid;

        location.hash = '#/model_details/' + model_uuid + '/' + tx_uuid;
    }
};


