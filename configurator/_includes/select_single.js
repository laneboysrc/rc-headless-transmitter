/*jslint browser: true */
/*global Path, Device, showPage */
"use strict";

var SelectSingle = {
    uuid: undefined,
    item: undefined,

    offset: 0,

    init: function (params) {
        this.uuid = params.uuid;
        this.item = params.item;
        this.offset = params.offset;

        let t = document.querySelector('#app-select_single-template');
        let type = Database.getType(this.uuid, this.item);
        console.log(type);
        let choices = Object.keys(TYPES[type]);
        console.log(choices);



    },

    route: function () {
        SelectSingle.init(this.params);
        showPage('select_single');
    }
};

