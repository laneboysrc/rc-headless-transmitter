(function () {
    'use strict';

    var Main = function Main() {
        this.uuid = undefined;
        this.tx_uuid = undefined;
        this.channel = undefined;
    };
    window['Main'] = new Main();

    Main.prototype.connect = function () {
        var model_uuid = Database.list('MODEL')[0];
        var tx_uuid = Database.list('TX')[0];

        location.hash = '#/model_details/' + model_uuid + '/' + tx_uuid;
    };
})();
