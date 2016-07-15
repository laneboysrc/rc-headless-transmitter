(function () {
    'use strict';

    var routes = {
        // path: name
        '#/': function () { Utils.showPage('main'); },
        '#/about': function () { Utils.showPage('about'); },
        '#/model_details': ModelDetails.route,
        '#/mixer': Mixer.route,
        '#/mixer_unit/:index': MixerUnit.route,
        '#/limits/:channel': Limits.route,
        '#/rf_protocol': RFProtocol.route,
        '#/select_single/:devName/:item/:offset': SelectSingle.route,
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
})();
