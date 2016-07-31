'use strict';

var Utils = require('./utils');

class Main {
  init  () {
    dev.MODEL = undefined;
    dev.TX = undefined;
    dev.UNDO = undefined;
    dev.disableCommunication();

    Utils.showPage('main');
  }

  connect (event) {
    Utils.cancelBubble(event);
    location.hash = Utils.buildURL(['device_list']);
  }
}

//*************************************************************************

// //*************************************************************************
// Main.prototype.connect = function () {
//     console.log('connect: loading dev.TX and dev.MODEL');

//     var count = 2;
//     var topic = 'main.entryRetrieved';


//     Database.getEntry('c91c-abaa-44c9-11e6', function (data) {
//         dev.MODEL = new DBObject(data);
//         console.log('main: dev.MODEL loaded');
//         Utils.PubSub.publish(topic);
//     });

//     Database.getEntry('4353-8fe8-44c9-11e6', function (data) {
//         dev.TX = new DBObject(data);
//         console.log('main: dev.TX loaded');
//         Utils.PubSub.publish(topic);
//     });

//     function entryRetrievedCallback() {
//         count = count - 1;
//         if (count) {
//             return;
//         }

//         console.log('main: Both getEntry() finished, launching page');
//         Utils.PubSub.removeTopic(topic);

//         // Show the model details page
//         location.hash = Utils.buildURL(['model_details']);
//     }

//     Utils.PubSub.subscribe(topic, entryRetrievedCallback);
// };

window['Main'] = new Main();
