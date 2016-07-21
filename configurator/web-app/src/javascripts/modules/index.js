// FIXME: require all the modules of the app

var app = {};

app.Utils = require('./utils');
app.Main = require('./main');

window['app'] = app;

app.Utils.showPage('main');
