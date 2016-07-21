
// Singletons
require('./device');
require('./config');
require('./database');

// Singletons for pages
require('./main');
require('./mixer');
require('./mixer_unit');
require('./model_details');
require('./rf_protocol');
require('./select_single');
require('./limits');
require('./edit_curve');
require('./edit_switch');

// All loaded, start routing!
require('./routes');
