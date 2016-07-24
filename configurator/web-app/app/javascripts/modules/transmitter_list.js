'use strict';

var Utils       = require('./utils');
var MDLHelper   = require('./mdl_helper');

var mdl = new MDLHelper('TX');


var TransmitterList = function () { };

//*************************************************************************
TransmitterList.prototype.init = function (params) {
    Utils.showPage('transmitter_list');
};

window['TransmitterList'] = new TransmitterList();
