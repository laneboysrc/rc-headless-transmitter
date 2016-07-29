// Pull in the Roboto font
require('./fonts/roboto.css');

// Pull in Material Design Lite files
require('./stylesheets/material.deep_orange-blue.min.css');
require('./fonts/materialicons.css');
require('./javascripts/material.min.js');

// Pull in our custom stylesheet
require('./stylesheets/styles.css');

// Pull in icons and other files that are needed for the various browsers
require('./images/android-chrome-192x192.png');
require('./images/mstile-150x150.png');
require('./images/favicon.ico');
require('./static/browserconfig.xml');


// Pull in all application modules
// Actually this pulls in modules/index.js, which in turn requires all app
// modules
require('./modules');
