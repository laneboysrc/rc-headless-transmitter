(function () {
    'use strict';

    var routes = {
        // path: name
        '#/': function () { Utils.showPage('main'); },
        '#/about': function () { Utils.showPage('about'); },
        '#/model_details/:model_uuid(/:tx_uuid)': ModelDetails.route,
        '#/mixer/:model_uuid': Mixer.route,
        '#/mixer_unit/:model_uuid/:index': MixerUnit.route,
        '#/limits/:model_uuid/:channel': Limits.route,
        '#/rf_protocol/:model_uuid': RFProtocol.route,
        '#/select_single/:uuid/:item/:offset': SelectSingle.route,
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
