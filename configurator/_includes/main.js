(function () {
    'use strict';

    var Main = function Main() {
    };
    window['Main'] = new Main();

    Main.prototype.connect = function () {

        location.hash = '#/model_details';
    };
})();
