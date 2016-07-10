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



    },

    route: function () {
        SelectSingle.init(this.params);
        showPage('select_single');
    }
};

