'use strict';

// Polyfill for String.endsWith
// Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(searchString, position) {
    var subjectString = this.toString();
    if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
      position = subjectString.length;
    }
    position -= searchString.length;
    var lastIndex = subjectString.lastIndexOf(searchString, position);
    return lastIndex !== -1 && lastIndex === position;
  };
}

// Singletons
require('./ws_protocol');
require('./config');
require('./database');
require('./device');

// Singletons for pages
require('./main');
require('./about');
require('./device_list');
require('./edit_curve');
require('./edit_switch');
require('./hardware_inputs');
require('./hardware_inputs_order');
require('./limits');
require('./logical_inputs');
require('./mixer');
require('./mixer_unit');
require('./model_details');
require('./model_list');
require('./rf_protocol');
require('./select_icon');
require('./select_multiple');
require('./select_single');
require('./settings');
require('./transmitter_details');
require('./transmitter_list');

// All loaded, start routing!
require('./routes');
