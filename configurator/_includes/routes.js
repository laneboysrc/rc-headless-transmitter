/*jslint browser: true */
/*globals Path */
"use strict";

var routes = {
    // path: name
    '#/': 'main',
    '#/about': 'about',
};

function showPage(name) {
    for (let page of document.querySelectorAll('.app-page')) {
        page.classList.add('hidden');
    }

    document.querySelector('#page_' + name).classList.remove('hidden');
}


function routeTo(route) {
    var path = route.path;
    if (path in routes) {
        showPage(routes[path]);
    }
    else {
        console.error('Route ' + path + ' not in routes[]')
    }
}


for (var path in routes) {
    if (routes.hasOwnProperty(path)) {
        Path.map(path).to(function () {
            routeTo(this);
        });
    }
}

// FIXME: this needs to be generalized
Path.map('#/model_details/:model_uuid/:tx_uuid').to(ModelDetails.route);
Path.map('#/mixer/:model_uuid/:tx_uuid').to(Mixer.route);
Path.map('#/mixer_unit/:model_uuid/:tx_uuid/:index').to(MixerUnit.route);
Path.map('#/limits/:model_uuid/:tx_uuid/:channel').to(Limits.route);
Path.map('#/rf_protocol(/:model_uuid)(/:tx_uuid)').to(RFProtocol.route);

Path.root('#/');

window.onload = function() {
    Path.listen();
};



