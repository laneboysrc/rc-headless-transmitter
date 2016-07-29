'use strict';

var Utils       = require('./utils');
var DBObject    = require('./database_object');


//*************************************************************************
var Main = function () {
};

//*************************************************************************
Main.prototype.init = function () {
    dev.MODEL = undefined;
    dev.TX = undefined;

    Utils.showPage('main');
};

//*************************************************************************
Main.prototype.connect = function () {
    console.log('connect: loading dev.TX and dev.MODEL');

    var count = 2;
    var topic = 'main.entryRetrieved';


    Database.getEntry('c91c-abaa-44c9-11e6', function (data) {
        dev.MODEL = new DBObject(data);
        console.log('main: dev.MODEL loaded');
        Utils.PubSub.publish(topic);
    });

    Database.getEntry('4353-8fe8-44c9-11e6', function (data) {
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
        location.hash = Utils.buildURL(['model_details']);
    }

    Utils.PubSub.subscribe(topic, entryRetrievedCallback);
};

window['Main'] = new Main();
