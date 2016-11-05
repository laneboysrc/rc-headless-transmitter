'use strict';

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
