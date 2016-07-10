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
        this.offset = parseInt(params.offset);

        let list = document.querySelector('#app-select_single-list');

        // Clear the app-mixer-list based on the class we've added when
        // instantiating the template
        while (list.querySelector('.can-delete')) {
            let elem = list.querySelector('.can-delete');
            elem.parentNode.removeChild(elem);
        }

        let t = document.querySelector('#app-select_single-template');
        let type = Database.getType(this.uuid, this.item);
        let choices = Object.keys(TYPES[type]);

        console.log(this.uuid, this.item, this.offset);
        let current_choice = Database.get(this.uuid, this.item, this.offset);
        console.log(current_choice);


        for (let i = 0; i < choices.length; i++) {
            let entry = choices[i];

            t.content.querySelector('span').textContent = entry;
            t.content.querySelector('input').id = 'app-select_single__item' + i;
            t.content.querySelector('label').setAttribute('for', 'app-select_single__item' + i);

            let clone = document.importNode(t.content, true);
            if (entry === current_choice) {
                clone.querySelector('input').checked = true;
            }
            list.appendChild(clone);
        }
    },

    route: function () {
        SelectSingle.init(this.params);
        showPage('select_single');
    }
};

