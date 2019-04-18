console.log('GIT VERSION:', VERSION_HASH + VERSION_DIRTY);

// Pull in Material Design Lite files
require('./stylesheets/material.deep_orange-blue.min.configurator.css');
require('./stylesheets/dialog-polyfill.css');
require('./fonts/materialicons.css');
require('./javascripts/material.min.js');

window['saveAs'] = require('./javascripts/FileSaver.min.js');
window['strftime'] = require('./javascripts/strftime.js');
window['Sortable'] = require('./javascripts/Sortable.js');

// Pull in the service worker registration script
require('./javascripts/service-worker-registration.js');

// Pull in our custom stylesheet
require('./stylesheets/styles.css');

// Pull in icons and other files that are needed for the various browsers
// Those are not referenced in HTML so we need to drag them in manually.
require('./images/favicon.ico');
require('./images/laneboysrc-logo-144.png');
require('./images/laneboysrc-logo-192.png');


// Pull in all application modules
// Actually this pulls in modules/index.js, which in turn requires all app
// modules
require('./modules');
