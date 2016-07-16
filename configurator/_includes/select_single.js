(function () {
    'use strict';

    var SelectSingle = function SelectSingle() {
        this.devName = undefined;
        this.item = undefined;
        this.offset = 0;

        this.template = document.querySelector('#app-select_single-template').content;
        this.list = document.querySelector('#app-select_single-list');

    };
    window['SelectSingle'] = new SelectSingle();

    //*************************************************************************
    SelectSingle.prototype.accept_choice = function () {
        var list = document.querySelector('#app-select_single-list');
        var value = list.querySelector('input[type="radio"]:checked').value;

        dev[this.devName].set(this.item, value, {offset: this.offset});
        history.go(-1);
    };

    //*************************************************************************
    SelectSingle.prototype.init = function (params) {
        this.devName = params.devName;
        this.item = params.item;
        this.offset = parseInt(params.offset);

        var mdl = new MDLHelper(this.devName);

        // Ged rid of existing elements
        mdl.clearDynamicElements(this.list);

        var device = dev[this.devName];

        var name = device.getHumanFriendlyText(this.item);
        mdl.setTextContentRaw('#app-select_single-name', name);
        // FIXME: need to get item description
        mdl.setTextContentRaw('#app-select_single-description', 'FIXME');

        var current_choice = device.get(this.item, {offset: this.offset});

        var type = device.getType(this.item);
        var choices = device.getTypeMembers(type);

        var t = this.template;

        for (let i = 0; i < choices.length; i++) {
            var entry = choices[i];

            t.querySelector('span').textContent = entry;
            t.querySelector('input').id = 'app-select_single__item' + i;
            t.querySelector('input').value = entry;
            t.querySelector('label').setAttribute('for', 'app-select_single__item' + i);

            var clone = document.importNode(t, true);
            if (entry === current_choice) {
                clone.querySelector('input').checked = true;
            }
            this.list.appendChild(clone);
        }

        Utils.showPage('select_single');
    };
})();
