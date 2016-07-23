'use strict';

var Utils       = require('./utils');
var DBObject    = require('./database_object');


var Main = function Main() {};
window['Main'] = new Main();


Main.prototype.connect = function () {
    console.log('connect: loading dev.TX and dev.MODEL');

    var count = 2;
    var topic = 'main.entryRetrieved';

    dev.MODEL = undefined;
    dev.TX = undefined;

    Database.getEntry('c91cabaa-44c9-11e6-9bc2-03ac25e30b5b', function (data) {
        dev.MODEL = new DBObject(data);
        console.log('main: dev.MODEL loaded');
        Utils.PubSub.publish(topic);
    });

    Database.getEntry('43538fe8-44c9-11e6-9f17-af7be9c4479e', function (data) {
        dev.TX = new DBObject(data);
        console.log('main: dev.TX loaded');
        Utils.PubSub.publish(topic);
    });

    function entryRetrievedCallback() {
        count = count - 1;
        if (count) {
            return;
        }

        console.log('main: Both getEntry() finished, launching page');
        Utils.PubSub.removeTopic(topic);

        // Show the model details page
        // location.hash = Utils.buildURL(['model_details']);
        location.hash = '#/device_list';
    }

    Utils.PubSub.subscribe(topic, entryRetrievedCallback);
};
