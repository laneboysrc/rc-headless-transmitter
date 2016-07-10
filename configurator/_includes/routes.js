/*jslint browser: true */
/*globals Path */
"use strict";

function showPage(name) {
    // Hide all sections with class 'app-page'
    for (let page of document.querySelectorAll('.app-page')) {
        page.classList.add('hidden');
    }

    document.querySelector('#page_' + name).classList.remove('hidden');
}

var routes = {
    // path: name
    '#/': function () {showPage('main')},
    '#/about': function () {showPage('about')},
    '#/model_details/:model_uuid/:tx_uuid': ModelDetails.route,
    '#/mixer/:model_uuid/:tx_uuid': Mixer.route,
    '#/mixer_unit/:model_uuid/:tx_uuid/:index': MixerUnit.route,
    '#/limits/:model_uuid/:tx_uuid/:channel': Limits.route,
    '#/rf_protocol(/:model_uuid)(/:tx_uuid)': RFProtocol.route,
};

for (var path in routes) {
    if (routes.hasOwnProperty(path)) {
        Path.map(path).to(routes[path]);
    }
}

Path.root('#/');

window.onload = function() {
    Path.listen();
};



