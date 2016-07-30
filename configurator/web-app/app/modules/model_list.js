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

    this.loading = document.querySelector('#app-model_list-loading_model');
    this.name = document.querySelector('#app-model_list-loading_model__name');
    this.progress = document.querySelector('#app-model_list-loading_model__progress');

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
    this.list.classList.add('hidden');
    this.loading.classList.add('hidden');

    models = [];
    mdl.clearDynamicElements(this.list);

    Database.listEntries(this.databaseCallback.bind(this));

    Utils.showPage('model_list');
};

//*************************************************************************
ModelList.prototype.back = function (params) {
    history.back();
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
        t.querySelector('button.app-model_list--load').setAttribute('data-index', i);
        t.querySelector('button.app-model_list--edit').setAttribute('data-index', i);
        mdl.setTextContentRaw('.app-model_list-list__template-name', models[i].name, t);

        var clone = document.importNode(t, true);
        this.container.appendChild(clone);
    }

    if (models.length !==  0) {
        this.list.classList.remove('hidden');
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
ModelList.prototype.loadModel = function (element) {
    var index = element.getAttribute('data-index');
    console.log('loadModel', index, dev.MODEL, models[index].uuid);

    // If the same model as the currently loaded one is selected then ignore
    // the request and return to model_details
    if (dev.MODEL  &&  dev.MODEL.uuid === models[index].uuid) {
        history.back();
        return;
    }

    // Show loading indicator
    this.list.classList.add('hidden');
    this.loading.classList.remove('hidden');
    this.progress.classList.add('mdl-progress--indeterminate');
    this.name.textContent = models[index].name;

    let uuid = models[index].uuid;
    let newModel;

    new Promise((resolve, reject) => {
        Database.getEntry(uuid, data => {
            if (!data) {
                reject(Error('loadModel: Model not in database?!'));
                return;
            }
            resolve(new DBObject(data));
        });
    }).then(dbentry => {
        newModel = dbentry;
        let offset = newModel.getSchema().o;
        return dev.write(offset, newModel.data);
    }).then(_ => {
        dev.MODEL = newModel;

        // Note: we have changed the model, so the URL UUID will be wrong.
        // We pop one item from the history, but immediately replace the
        // location hash with the new URL. This way the back button works
        // despite that we create a loop
        history.back();
        location.hash = Utils.buildURL(['model_details']);
    }).catch(error => {
        console.log(error);
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
