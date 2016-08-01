'use strict';

var Utils = require('./utils');
var MDLHelper = require('./mdl_helper');
var DBObject = require('./database_object');

var mdl = new MDLHelper('MODEL');
var models = [];

class ModelList {
  constructor () {
    this.list = document.querySelector('#app-model_list-list');
    this.container = document.querySelector('#app-model_list-list__container');
    this.template = document.querySelector('#app-model_list-list__template').content;

    this.loading = document.querySelector('#app-model_list-loading_model');
    this.name = document.querySelector('#app-model_list-loading_model__name');
    this.progress = document.querySelector('#app-model_list-loading_model__progress');

    this.snackbar = document.querySelector('#app-model_list-snackbar');

    this.mode = 'edit';
  }

  //*************************************************************************
  init (params) {
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
  }

  //*************************************************************************
  back (params) {
    history.back();
  }

  //*************************************************************************
  databaseCallback (cursor) {
    // console.log(cursor)
    if (cursor) {
      let data = cursor.value;
      if (data.schemaName === 'MODEL') {
        let dev = new DBObject(data);
        models.push({
          name: dev.getItem('NAME'),
          uuid: data.uuid
        });
      }
      cursor.continue();
    }
    else {
      this.updateModelList();
    }
  }

  //*************************************************************************
  updateModelList () {
    mdl.clearDynamicElements(this.list);

    // FIXME: sort models[] by name

    let t = this.template;
    for (let i = 0; i < models.length; i++) {
      t.querySelector('div').classList.add('can-delete');
      t.querySelector('button.app-model_list--load').setAttribute('data-index', i);
      t.querySelector('button.app-model_list--edit').setAttribute('data-index', i);
      mdl.setTextContentRaw('.app-model_list-list__template-name', models[i].name, t);

      let clone = document.importNode(t, true);
      this.container.appendChild(clone);
    }

    if (models.length !==  0) {
      this.list.classList.remove('hidden');
    }

    this.updateItemVisibility();
  }

  //*************************************************************************
  createModel (event) {
    Utils.cancelBubble(event);

    let newModel = dev.makeNewDevice('1', 'MODEL');

    // The new model name is "ModelX" where is is the current number
    // of models + 1. This way we should get unique initial names.
    newModel.setItem('NAME', `Model${models.length + 1}`);
    newModel.setItem('UUID', newModel.uuid);

    // NOTE: setting the name has automatically added the device to the
    // database!

    newModel.setItem('RF_PROTOCOL_HK310_ADDRESS', RFProtocol.newRandomAddress());
    newModel.setItem('RF_PROTOCOL_HK310_HOP_CHANNELS', RFProtocol.newHopChannels());

    // FIXME: load a template with a basic mixer (car steering and throttle?)

    dev.MODEL = newModel;
    location.hash = Utils.buildURL(['model_details']);
  }

  //*************************************************************************
  editModel (element) {
    let index = element.getAttribute('data-index');

    Database.getEntry(models[index].uuid, function (data) {
      dev.MODEL = new DBObject(data);
      location.hash = Utils.buildURL(['model_details']);
    });
  }

  //*************************************************************************
  loadModel (element) {
    let index = element.getAttribute('data-index');
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
          reject(new Error('loadModel: Model not in database?!'));
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
      history.replaceState(null, '', Utils.buildURL(['model_details']));
    }).catch(error => {
      console.log(error);
    });
  }

  //*************************************************************************
  updateItemVisibility () {
    if (this.mode === 'load') {
      Utils.addClassToSelector('.app-model_list--edit', 'hidden');
      Utils.removeClassFromSelector('.app-model_list--load', 'hidden');
    }
    else {
      Utils.addClassToSelector('.app-model_list--load', 'hidden');
      Utils.removeClassFromSelector('.app-model_list--edit', 'hidden');
    }
  }

  //*************************************************************************
  deleteModel (model) {
    dev.UNDO = model;
    Database.deleteEntry(model);

    this.snackbar.classList.remove('hidden');
    let data = {
      message: 'Model deleted.',
      timeout: 5000,
      actionHandler: this.undoDeleteModel.bind(this),
      actionText: 'Undo'
    };
    this.snackbar.MaterialSnackbar.showSnackbar(data);
  }

  //*************************************************************************
  undoDeleteModel () {
    console.log('undoDeleteModel');
    if (!dev.UNDO) {
      return;
    }

    dev.MODEL = dev.UNDO;
    Database.setEntry(dev.MODEL);
    location.hash = Utils.buildURL(['model_details']);
    this.snackbar.classList.add('hidden');
  }
}

window['ModelList'] = new ModelList();
