'use strict';

var Utils       = require('./utils');
// var MDLHelper   = require('./mdl_helper');


var DeviceList = function DeviceList() { };
window['DeviceList'] = new DeviceList();

//*************************************************************************
DeviceList.prototype.init = function (params) {
    // var mdl = new MDLHelper('TX');


    Utils.showPage('device_list');
};

