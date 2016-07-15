(function () {
    'use strict';

    var ModelDetails = function ModelDetails() {
    };
    window['ModelDetails'] = new ModelDetails();

    //*************************************************************************
    ModelDetails.prototype.init = function (params) {
        var mdl = new MDLHelper('MODEL');

        mdl.setTextfield('#app-model_details-name', 'NAME');
        mdl.setDataURL('#app-model_details-mixer', ['mixer']);
        mdl.setDataURL('#app-model_details-rf_protocol', ['rf_protocol']);

        // FIXME: show/hide the menu depending on whether tx_uuid is undefined

        Utils.showPage('model_details');
    };
})();

ModelDetails.route = function () {
    'use strict';
    ModelDetails.init(this.params);
};
