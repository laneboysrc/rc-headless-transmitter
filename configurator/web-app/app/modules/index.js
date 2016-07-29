'use strict';

// Singletons
require('./ws_protocol');
require('./config');
require('./database');
require('./device');

// Singletons for pages
require('./main');
require('./device_list');
require('./edit_curve');
require('./edit_switch');
require('./limits');
require('./mixer');
require('./mixer_unit');
require('./model_details');
require('./model_list');
require('./rf_protocol');
require('./select_single');
require('./transmitter_list');

// All loaded, start routing!
require('./routes');



// var schema = CONFIG_VERSIONS[1].TX;
// var newDev = {};
// var dbEntry;

// const Utils = require('./utils');

// new Promise((resolve, reject) => {
//         console.log('STARTING')
//     console.log('BEFORE DEVICE.READ')
//     dev.read(schema['UUID'].o, schema['UUID'].s).then(data => {
//         console.log('DEVICE.READ.then')
//         data = new Uint8Array(8);

//         newDev.uuid = Utils.uuid2string(data);
//         if (!Utils.isValidUUID(newDev.uuid)) {
//             newDev.uuid = Utils.newUUID();
//             console.log('BEFORE DEVICE.WRITE')
//             return dev.write(schema['UUID'].o, schema['UUID'].s,
//                 Utils.string2uuid(newDev.uuid));
//         }
//         console.log('Promise.resolve')
//         return Promise.resolve();
//     }).then(_ => {
//         // return Database.get(newDev.uuid);
//         console.log('BEFORE DATABASE.get')
//         return new Promise((resolve, reject) => {
//             resolve(new Uint8Array(8));
//         });
//     }).then(data => {
//         console.log('DATABASE.get.then')
//         dbEntry = data;
//         // if (dbEntry.get('UUID') === newDev.uuid)  {
//         //     console.log('Device is in the database already');
//         // }
//         console.log('ALL DONE')
//     });
// });
