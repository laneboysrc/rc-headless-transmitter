/*jslint browser: true */
/*global  */
"use strict";

var Database = function () {
    this.data = {};
};

Database.prototype.get = function (uuid, key) {
    if (uuid in this.data) {
        var entry = this.data[uuid];

        if (key in entry) {
            return entry[key];
        }
    }
    return null;
};

Database.prototype.set = function (uuid, key) {
    // FIXME: not implemented yet
};

Database.prototype.add = function (item) {
    this.data[item.uuid] = item;
};


var ModelDatabase = new Database();
var TransmitterDatabase = new Database();

var dev = new Device();
dev.useDummyDevice();
ModelDatabase.add(dev.model);
TransmitterDatabase.add(dev.tx);
