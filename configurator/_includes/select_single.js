"use strict";

var SelectSingle = {
    uuid: undefined,
    item: undefined,

    offset: 0,

    accept_choice: function () {
        let list = document.querySelector('#app-select_single-list');
        let value = list.querySelector('input[type="radio"]:checked').value;

        Database.set(SelectSingle.uuid, SelectSingle.item, value, SelectSingle.offset);
        history.go(-1);
    },

    init: function (params) {
        this.uuid = params.uuid;
        this.item = params.item;
        this.offset = parseInt(params.offset);

        let name = Database.getHumanFriendlyText(this.uuid, this.item);
        document.querySelector('#app-select_single-name').textContent = name;
        // FIXME: need to get item description
        document.querySelector('#app-select_single-description').textContent = 'FIXME';

        let list = document.querySelector('#app-select_single-list');

        // Clear the app-mixer-list based on the class we've added when
        // instantiating the template
        while (list.querySelector('.can-delete')) {
            let elem = list.querySelector('.can-delete');
            elem.parentNode.removeChild(elem);
        }

        let t = document.querySelector('#app-select_single-template');
        let type = Database.getType(this.uuid, this.item);
        let config = Database.getConfig(this.uuid);
        let choices = Object.keys(config.TYPES[type]);

        let current_choice = Database.get(this.uuid, this.item, this.offset);

        for (let i = 0; i < choices.length; i++) {
            let entry = choices[i];

            t.content.querySelector('span').textContent = entry;
            t.content.querySelector('input').id = 'app-select_single__item' + i;
            t.content.querySelector('input').value = entry;
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
        Utils.showPage('select_single');
    }
};

