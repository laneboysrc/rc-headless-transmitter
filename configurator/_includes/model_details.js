(function () {
    'use strict';

    var ModelDetails = function ModelDetails() {
        this.uuid = undefined;
        this.tx_uuid = undefined;
    };
    window['ModelDetails'] = new ModelDetails();

    //*************************************************************************
    ModelDetails.prototype.init = function (params) {
        this.uuid = params.model_uuid;
        this.tx_uuid = params.tx_uuid;

        var mdl = new MDLHelper(this.uuid);

        mdl.setTextfield('#app-model_details-name', 'NAME');
        mdl.setDataURL('#app-model_details-mixer', ['mixer', this.uuid]);
        mdl.setDataURL('#app-model_details-rf_protocol', ['rf_protocol', this.uuid]);

        // FIXME: show/hide the menu depending on whether tx_uuid is undefined

        showPage('model_details');
    };
})();

ModelDetails.route = function () {
    'use strict';
    ModelDetails.init(this.params);
};
