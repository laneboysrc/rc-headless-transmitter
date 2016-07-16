(function () {
    'use strict';

    var Main = function Main() {
    };
    window['Main'] = new Main();

    Main.prototype.connect = function () {
        location.hash = Utils.buildURL(['model_details']);
    };
})();
