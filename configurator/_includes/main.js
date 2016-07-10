/*jslint browser: true */
/*global Path, Device */
"use strict";

var Main = {
    'connect': function () {
        let dbl = Database.list();
        let model_uuid = undefined;
        let tx_uuid = undefined;

        for (let entry in dbl) {
            let uuid = dbl[entry];
            if (Database.getSchema(uuid) === MODEL) {
                model_uuid = uuid;
            }
            else if (Database.getSchema(uuid) === TX) {
                tx_uuid = uuid;
            }

            if (model_uuid && tx_uuid) {
                break;
            }
        }

        location.hash = '#/model_details/' + model_uuid + '/' + tx_uuid;
    }
};


