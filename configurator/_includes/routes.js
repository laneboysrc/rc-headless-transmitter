/*jslint browser: true */
/*globals Path */
"use strict";

var routes = {
    // path: name
    '#/': 'main',
    '#/about': 'about',
    '#/edit_curve': 'edit_curve',
    '#/edit_switch': 'edit_switch',
    '#/limits': 'limits',
    // '#/mixer': 'mixer',
    '#/mixer_unit': 'mixer_unit',
    // '#/model_details(/:model_uuid)(/:transmitter_uuid)': 'model_details',
    '#/model_list': 'model_list',
    '#/rf_protocol': 'rf_protocol',
    '#/select_multiple': 'select_multiple',
    '#/select_single': 'select_single',
    '#/transmitter_details': 'transmitter_details',
    '#/transmitter_list': 'transmitter_list',
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
Path.map('#/model_details(/:model_uuid)(/:tx_uuid)').to(ModelDetails.route);
Path.map('#/mixer(/:model_uuid)(/:tx_uuid)').to(Mixer.route);
Path.map('#/rf_protocol(/:model_uuid)(/:tx_uuid)').to(RFProtocol.route);

Path.root('#/');
Path.listen();


