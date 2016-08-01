'use strict';

var Utils = require('./utils');
var DatabaseObject = require('./database_object');


//*************************************************************************
// Split up the requested read/write block into small chunks since a single
// read/write request can only handle up to 29 bytes. We return those chunks in
// a list that can be requested one-by-one.
function buildChunks(offset, count, maxChunkSize) {
  let chunks = [];

  maxChunkSize = maxChunkSize || 29;

  while (count) {
    let len = count > maxChunkSize ? maxChunkSize : count;
    chunks.push({
      o: offset,
      c: len
    });

    offset += len;
    count -= len;
  }

  return chunks;
}


// A global object that holds the currently loaded transmitter and model
// object.
//
// These objects determine the values shown and manipulated on almost all
// pages of the configurator app.
class Device {
  constructor () {
    this.MODEL = undefined;
    this.TX = undefined;
    this.UNDO = undefined;
    this.connected = false;
    this.wsOpen = false;

    document.addEventListener('ws-close', this.onclose.bind(this));
  }

  //*************************************************************************
  enableCommunication () {
    this.wsOpen = true;
    WebsocketProtocol.open();
  }

  //*************************************************************************
  disableCommunication () {
    // stop WS, kill restart timer
    this.wsOpen = false;
    WebsocketProtocol.close();
  }

  //*************************************************************************
  connect (uuid, address, hop_channels) {
    console.log(`Device.connect uuid=${uuid}`)

    let connectPacket = new Uint8Array([
      0x31,
      0x12, 0x13, 0x14, 0x15, 0x16,
      0x40, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49,
      0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50, 0x51, 0x52, 0x53]);

    return new Promise((resolve, reject) => {
      function onmessage(event) {
        let packet = event.detail;

        if (packet[0] === 0x49) {
          dev.connected = true;
          document.removeEventListener('ws-message', onmessage);
          document.removeEventListener('ws-close', onclose);
          resolve();
          return;
        }

        WebsocketProtocol.send(connectPacket);
      }

      function onclose(event) {
        document.removeEventListener('ws-message', onmessage);
        document.removeEventListener('ws-close', onclose);
        reject(new Error('Connection closed'));
      }

      document.addEventListener('ws-message', onmessage);
      document.addEventListener('ws-close', onclose);
      WebsocketProtocol.send(connectPacket);
    });
  }

  //*************************************************************************
  disconnect () {
    if (!dev.connected) {
      return Promise.reject(new Error('Device.disconnect: not connected'));
    }

    return new Promise((resolve, reject) => {
      function onmessage(event) {
        let disconnectPacket = new Uint8Array([0x64]);

        WebsocketProtocol.send(disconnectPacket);

        dev.connected = false;
        document.removeEventListener('ws-message', onmessage);
        document.removeEventListener('ws-close', onclose);
        resolve();
      }

      function onclose(event) {
        document.removeEventListener('ws-message', onmessage);
        document.removeEventListener('ws-close', onclose);
        reject(new Error('Connection closed'));
      }

      document.addEventListener('ws-message', onmessage);
      document.addEventListener('ws-close', onclose);
    });
  }

  //*************************************************************************
  read (offset, count) {
    console.log(`Device.read o=${offset} c=${count}`)

    if (!dev.connected) {
      return Promise.reject(new Error('Device.read: not connected'));
    }

    // FIXME: needs a 600ms timeout (between individual reads)
    // FIXME: progress callback using reacChunks initial length as reference

    return new Promise((resolve, reject) => {
      let data = new Uint8Array(count);
      let readChunks = buildChunks(offset, count);
      let nextChunk = 0;

      function onmessage(event) {
        const packet = event.detail;

        // FIXME: check packet validity (size)
        if (packet[0] === 0x52) {
          const o = Utils.getUint16(packet, 1);
          const c = packet.length - 3;

            // Check if the read data is one of the chunks we are looking
            // for. If yes, store the data at the appropriate offset
            // and remove the chunk from our request list.
            const index = readChunks.findIndex((element, index, array) => {
              return element.o === o  &&  element.c === c;
            });
            if (index >= 0) {
              data.set(packet.slice(3), o - offset);
              readChunks.splice(index, 1);
            }
          }

        // Read the next chunk regardless if we received the previous
        // data or not. On slow computers this causes quite a bit of
        // redundant read requests, but it also automatically retries until
        // all data was received.
        readChunk();
      }

      function onclose(event) {
        document.removeEventListener('ws-message', onmessage);
        document.removeEventListener('ws-close', onclose);
        reject(new Error('Connection closed'));
      }

      function readChunk() {
        if (readChunks.length === 0) {
          document.removeEventListener('ws-message', onmessage);
          document.removeEventListener('ws-close', onclose);
          resolve(data);
          return;
        }

        // Important: we modulo readRequest.length here, because the
        // readRequest may have had elements removed. The modulo also causes
        // us to automatically loop through all chunks until we don't have
        // any thing to request.
        let request = readChunks[nextChunk % readChunks.length];
        let packet = WebsocketProtocol.makeReadPacket(request.o, request.c);
        WebsocketProtocol.send(packet);

        nextChunk++;
      }

      document.addEventListener('ws-message', onmessage);
      document.addEventListener('ws-close', onclose);
      readChunk();
    });
  }

  //*************************************************************************
  write (offset, data) {
    console.log(`Device.write o=${offset} c=${data.length}`)

    if (!dev.connected) {
      return Promise.reject(new Error('Device.write: not connected'));
    }

    // FIXME: needs a 600ms timeout (between individual reads)
    // FIXME: progress callback using writeChunks initial length as reference

    return new Promise((resolve, reject) => {
      let writeChunks = buildChunks(offset, data.length);
      let nextChunk = 0;

      function onmessage(event) {
        const packet = event.detail;

        if (packet[0] === 0x57) {
          const o = Utils.getUint16(packet, 1);
          const c = packet[3];

          // Check if the read data is one of the chunks we are looking
          // for. If yes, store the data at the appropriate offset
          // and remove the chunk from our request list.
          const index = writeChunks.findIndex((element, index, array) => {
            return element.o === o  &&  element.c === c;
          });
          if (index >= 0) {
            writeChunks.splice(index, 1);
          }
        }

        // Read the next chunk regardless if we received the previous
        // data or not. On slow computers this causes quite a bit of
        // redundant read requests, but it also automatically retries until
        // all data was received.
        writeChunk();
      }

      function onclose(event) {
        document.removeEventListener('ws-message', onmessage);
        document.removeEventListener('ws-close', onclose);
        reject(new Error('Connection closed'));
      }

      function writeChunk() {
        if (writeChunks.length === 0) {
          document.removeEventListener('ws-message', onmessage);
          document.removeEventListener('ws-close', onclose);
          resolve();
          return;
        }

        // Important: we modulo readRequest.length here, because the
        // readRequest may have had elements removed. The modulo also causes
        // us to automatically loop through all chunks until we don't have
        // any thing to request.
        const request = writeChunks[nextChunk % writeChunks.length];

        const dataOffset = request.o - offset;
        const packet = WebsocketProtocol.makeWritePacket(
          request.o, data.slice(dataOffset, dataOffset + request.c));
        WebsocketProtocol.send(packet);

        nextChunk++;
      }

      document.addEventListener('ws-message', onmessage);
      document.addEventListener('ws-close', onclose);
      writeChunk();
    });
  }

  //*************************************************************************
  // Receives Websocket events
  onclose (event, data) {
    // console.log('Device ws: ', event, event.detail);
    this.connected = false;
    if (this.wsOpen) {
      Utils.sendCustomEvent('dev-connectionlost');

      // Retry in 2 seconds
      setTimeout(function () {
        WebsocketProtocol.open();
      }, 2000);
    }
  }

  //*************************************************************************
  makeNewDevice (configVersion, schemaName) {
    let newDevice = {};

    const schema = CONFIG_VERSIONS[configVersion][schemaName];

    newDevice.configVersion = configVersion;
    newDevice.schemaName = schemaName;
    newDevice.data = new Uint8Array(schema.s);
    newDevice.lastChanged = 0;
    newDevice.uuid = Utils.newUUID();

    return new DatabaseObject(newDevice);
  }
}

window['dev'] = new Device();
