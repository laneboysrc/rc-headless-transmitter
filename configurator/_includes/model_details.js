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

        var mdl = new MDLHelper(this);

        mdl.setTextfield('#app-model_details-name', 'NAME');
        mdl.setDataURL('#app-model_details-mixer', ['mixer', this.uuid]);
        mdl.setDataURL('#app-model_details-rf_protocol', ['rf_protocol', this.uuid]);

        // FIXME: show/hide the menu depending on whether tx_uuid is undefined
    };

    //*************************************************************************
    ModelDetails.prototype.onChangeHandler = function (event) {
        var element = event.target;
        var item = element.getAttribute('data-source');
        var value = element.value;
        var self = window['ModelDetails'];

        // FIXME: check if value changed. If not, don't update the database

        Database.set(self.uuid, item, value);
    };

})();


ModelDetails.route = function () {
    ModelDetails.init(this.params);
    showPage('model_details');
};



// var ModelDetails = {
//     uuid: undefined,
//     tx_uuid: undefined,

//     offset: 0,
//     setTextfield: MDLHelper.setTextfield,

//     onChangeHandler: function (event) {
//         let element = event.target;
//         let item = element.getAttribute('data-source');
//         let value = element.value;

//         // FIXME: check if value changed. If not, don't update the database

//         Database.set(ModelDetails.uuid, item, value, ModelDetails.offset);
//     },

//     init: function (params) {
//         this.uuid = params.model_uuid;
//         this.tx_uuid = params.tx_uuid;

//         this.setTextfield('#app-model_details-name', 'NAME');

//         document.querySelector('#app-model_details-mixer').setAttribute(
//             'data-url', '#/mixer/' +  this.uuid);
//         document.querySelector('#app-model_details-rf_protocol').setAttribute(
//             'data-url', '#/rf_protocol/' +  this.uuid );

//         // FIXME: show/hide the menu depending on whether tx_uuid is undefined

//     },

//     route: function () {
//         ModelDetails.init(this.params);
//         showPage('model_details');
//     }
// };

