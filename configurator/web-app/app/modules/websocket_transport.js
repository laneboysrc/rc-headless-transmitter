'use strict';

var Utils = require('./utils');


class WebsocketTransport {
  constructor() {
    this.ws = undefined;
    this.timeout = null;
    this.opening = false;

    this._initPotentialBridges();
  }

  //*************************************************************************
  open() {
    if (this.ws) {
      return;
    }

    this.opening = true;
    this.bridges.index = 0;
    this._openURL(this.bridges.locations[this.bridges.index]);
  }

  //*************************************************************************
  _openURL(url) {
    // Connect to the Websocket of the bridge
    this.ws = new WebSocket(url);
    this.maxPacketsInTransit = 1;

    // Set event handlers
    this.ws.onopen = this._onopen.bind(this);
    this.ws.onmessage = this._onmessage.bind(this);
    this.ws.onclose = this._onclose.bind(this);
    this.ws.onerror = this._onerror.bind(this);

    this.timeout = window.setTimeout(this._ontimeout.bind(this), 1000);

    console.log('Websocket open', this.ws.url);
  }

  //*************************************************************************
  close() {
    this.opening = false;
    if (this.ws) {
      console.log('Websocket close', this.ws.url);
      this.ws.close();
    }
    else {
      console.log('Websocket close (this.ws is false)');
    }
  }

  //*************************************************************************
  send(packet) {
    this.ws.send(Utils.hexlify(packet));
  }

  //*************************************************************************
  _cancelTimeout() {
    if (! this.timeout) {
      return;
    }

    window.clearTimeout(this.timeout);
    this.timeout = null;
  }

  //*************************************************************************
  _ontimeout() {
    console.log('Websocket timeout', this.ws.url);
    this.timeout = null;
    this.ws.close();
  }

  //*************************************************************************
  _onopen() {
    console.log('Websocket opened', this.ws.url);
    this.opening = false;
    this._cancelTimeout();
    Utils.sendCustomEvent('transport-open');
  }

  //*************************************************************************
  _onerror(e) {
    console.log('Websocket error', this.ws.url);

    if (!this.opening) {
      Utils.sendCustomEvent('transport-error', e);
    }
  }

  //*************************************************************************
  _onclose() {
    console.log('Websocket closed', this.ws.url);

    this._cancelTimeout();
    this.ws = undefined;

    if (this.opening  &&  this.bridges.index < (this.bridges.locations.length - 1)) {
      ++this.bridges.index;
      this._openURL(this.bridges.locations[this.bridges.index]);
    }
    else {
      this.opening = false;
      Utils.sendCustomEvent('transport-close');
    }
  }

  //*************************************************************************
  _onmessage(e) {
    // e.data contains received string
    if (!(e.data instanceof Blob)) {
      let data = Utils.unhexlify(e.data);
      Device.onTransportMessage(data);
      return;
    }

    // Parsing binary websocket data via FileReader is very slow on Chrome.
    // We therefore switched to hex-encoded strings. The binary handling
    // code is still left here for reference.
    let reader = new FileReader();

    reader.addEventListener('loadend', function () {
      let data = new Uint8Array(reader.result);
      // console.log(Utils.byte2string(data[0]));
      Device.onTransportMessage(data);
    });

    reader.readAsArrayBuffer(e.data);
  }

  //*************************************************************************
  _initPotentialBridges() {

    // We look for Websocket Bridges on the current host as well as on the
    // fixed IP address 192.168.4.1 (which is the IP address configurator).
    //
    // This way we can either run a bridge on the development computer, or
    // point our Wi-Fi to the configurator after loading the app.
    // Note that the app could be pre-cached already on the device, in which
    // case we can start it even if there is no access to the Internet.
    //
    //
    // Note that we exclude .github.io as potential host, where we host
    // the web-app (it provides HTTPS so we can use a service worker for
    // caching, giving us full off-line support).
    //
    // We add secure (wss) versions in all cases, but insecure (ws) versions
    // only when the page is not served via HTTPS. If we try to access ws://
    // when the configurator runs over https:// get a security exception.

    this.bridges = {
      locations: [],
      index: 0,
    };

    const isHTTPS = (window.location.protocol === 'https:');
    const loc = this.bridges.locations;

    // The preferred location is 192.168.4.1/ws, port 443. This way we can
    // ask the user easily to add a security exception for https://192.168.4.1
    // which will immediately apply for the web-socket.
    //
    // Originally we used port 9707, but Firefox differentiates security
    // exceptions by port number [Chrome does not]
    loc.push('wss://192.168.4.1/ws');

    if (!isHTTPS) {
      loc.push('ws://192.168.4.1:9706/');
    }

    let host = window.location.hostname;
    if (! host.endsWith('.github.io')) {
      loc.push(`ws://${host}:9706/`);
    }
  }
}

// *************************************************************************
// function dumpUint8Array(data) {
//   var result = [];
//   data.forEach(function (byte) {
//     result.push(Utils.byte2string(byte));
//   });

//   var response = result.join(' ');

//   while (response.length < ((32 * 3) + 2)) {
//     response += ' ';
//   }

//   data.forEach(function (byte) {
//     if (byte <= 32  ||  byte > 126) {
//       response += '.';
//     }
//     else {
//       response += String.fromCharCode(byte);
//     }
//   });

//   return response;
// }

window['WebsocketTransport'] = new WebsocketTransport();
