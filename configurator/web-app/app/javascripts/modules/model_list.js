'use strict';

var Utils       = require('./utils');
var MDLHelper   = require('./mdl_helper');
var DBObject    = require('./database_object');

var mdl = new MDLHelper('MODEL');
var models = [];

//*************************************************************************
var ModelList = function () {
    this.list = document.querySelector('#app-model_list-list');
    this.container = document.querySelector('#app-model_list-list__container');
    this.template = document.querySelector('#app-model_list-list__template').content;

    this.mode = 'edit';
};

//*************************************************************************
ModelList.prototype.init = function (params) {
    // If we are called to select a model to load to the transmitter then hide
    // the 'add model' functionality
    this.mode = 'edit';
    if (params.tx) {
        this.mode = 'load';
    }
    this.updateItemVisibility();

    models = [];
    mdl.clearDynamicElements(this.list);

    Database.listEntries(this.databaseCallback.bind(this));

    Utils.showPage('model_list');
};

//*************************************************************************
ModelList.prototype.databaseCallback = function (cursor) {
    // console.log(cursor)
    if (cursor) {
        var data = cursor.value;
        if (data.schemaName === 'MODEL') {
            var dev = new DBObject(data);
            models.push({
                name: dev.get('NAME'),
                uuid: data.uuid
            });
        }
        cursor.continue();
    }
    else {
        this.updateModelList();
    }
};

//*************************************************************************
ModelList.prototype.updateModelList = function () {
    mdl.clearDynamicElements(this.list);

    var t = this.template;
    for (var i = 0; i < models.length; i += 1) {
        t.querySelector('div').classList.add('can-delete');
        t.querySelector('button').setAttribute('data-index', i);
        mdl.setTextContentRaw('#app-model_list-list__template-name', models[i].name, t);

        var clone = document.importNode(t, true);
        this.container.appendChild(clone);
    }
    this.updateItemVisibility();
};

//*************************************************************************
ModelList.prototype.addModel = function (ev) {
    console.log('addModel', ev)
};

//*************************************************************************
ModelList.prototype.editModel = function (element) {
    var index = element.getAttribute('data-index');

    Database.getEntry(models[index].uuid, function (data) {
        dev.MODEL = new DBObject(data);
        location.hash = Utils.buildURL(['model_details']);
    });
};

//*************************************************************************
ModelList.prototype.updateItemVisibility = function () {
    if (this.mode === 'load') {
        Utils.addClassToSelector('.app-model_list--edit', 'hidden');
        Utils.removeClassFromSelector('.app-model_list--load', 'hidden');
    }
    else {
        Utils.addClassToSelector('.app-model_list--load', 'hidden');
        Utils.removeClassFromSelector('.app-model_list--edit', 'hidden');
    }
};


window['ModelList'] = new ModelList();
