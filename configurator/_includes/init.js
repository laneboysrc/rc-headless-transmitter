/*jslint browser: true */
/*globals Path */
"use strict";

(function (w) {
    var routes = {
        // path: name
        '#/': 'main',
        '#/about': 'about',
        '#/edit_curve': 'edit_curve',
        '#/edit_switch': 'edit_switch',
        '#/limits': 'limits',
        '#/mixer': 'mixer',
        '#/mixer_unit': 'mixer_unit',
        '#/model_details': 'model_details',
        '#/model_list': 'model_list',
        '#/rf_protocol': 'rf_protocol',
        '#/select_multiple': 'select_multiple',
        '#/select_single': 'select_single',
        '#/transmitter_details': 'transmitter_details',
        '#/transmitter_list': 'transmitter_list',
    };

    function showPage(path) {
        if (path in routes) {
            for (let page of document.querySelectorAll('.app-page')) {
                page.classList.add('hidden');
            }

            document.querySelector('#page_' + routes[path]).classList.remove('hidden');
        }
        else {
            console.error('Route ' + path + ' not in routes[]')
        }
    }

    for (var path in routes) {
        if (routes.hasOwnProperty(path)) {
            Path.map(path).to(function () {
                showPage(this.path);
            });
        }
    }

    // Path.map('#/').to(function () {
    //     showPage('main');
    // });

    // Path.map('#/about').to(function () {
    //     showPage('about');
    // });

    Path.root('#/');
    Path.listen();

})(window);

