'use strict';

export function cancelBubble(event) {
  if (event  &&  event.cancelBubble) {
    event.cancelBubble = true;
  }
}

export function sendCustomEvent(eventName, data) {
  let event = new CustomEvent(eventName, {
    detail: data,
    cancelable: false
  });
  document.dispatchEvent(event);
}

export function rollbackHistoryToRoot() {
  let lastHistoryLength = 0;
  let elementsAdded = 0;

  // Unfortunately repetitive calls to history.back() don't work on Chrome
  // while the page is reloading. So we fill up the history stack with
  // elements of our apps root, which has the same effect except that
  // the user no longer can go back to where he launched the app from.
  // Not a big deal since we believe this will be launched from a bookmark
  // or device root.
  //
  // Both Firefox and Chrome have 50 history elements. However, this may be
  // coincidence and other browersers have different values. So we fill
  // up the history until history.length no longer changes, and we have
  // added the maximum history.length number of '#/' entries.
  do {
    lastHistoryLength = history.length;

    history.pushState(null, '', '#/');
    elementsAdded++;

    if (elementsAdded > 100) {
      break;
    }
  } while (lastHistoryLength !== history.length  ||  elementsAdded < history.length);

  // This works on Firefox, but fails on Chrome.
  //
  // history.go(-(history.length - 1));
  //
  // On Chrome it does not execute and destroys any subsequence history
  // manipulation through history.pushState. location.hash after history.go is
  // fine on Chrome (except that the history.go is not executed) but fails
  // on Firefox.
  // So we don't execute history.go here and use pushState for both browsers.
  // While this keeps the history full with '#/' entries, the functional impact
  // for the user is imperceptible. At least we don't have reminescence of
  // URLs that may no longer be available in the history stack!
}

export function byte2string(byte) {
  let s = byte.toString(16);

  return (s.length < 2) ? ('0' + s)  : s;
}

export function uuid2string(uuid_bytes) {
  let result = '';

  result += byte2string(uuid_bytes[0]);
  result += byte2string(uuid_bytes[1]);
  result += '-';
  result += byte2string(uuid_bytes[2]);
  result += byte2string(uuid_bytes[3]);
  result += '-';
  result += byte2string(uuid_bytes[4]);
  result += byte2string(uuid_bytes[5]);
  result += '-';
  result += byte2string(uuid_bytes[6]);
  result += byte2string(uuid_bytes[7]);

  return result;
}

export function string2uuid(s) {
    // "c91c-abaa-44c9-11e6"
    let result = new Uint8Array(8);

    result[0] = parseInt(s.slice(0, 2), 16);
    result[1] = parseInt(s.slice(2, 4), 16);

    result[2] = parseInt(s.slice(5, 7), 16);
    result[3] = parseInt(s.slice(7, 9), 16);

    result[4] = parseInt(s.slice(10, 12), 16);
    result[5] = parseInt(s.slice(12, 14), 16);

    result[6] = parseInt(s.slice(15, 17), 16);
    result[7] = parseInt(s.slice(17, 19), 16);

    return result;
  }

export function uint8array2string(bytes) {
  let result = '';

  for (let i = 0; i < bytes.length; i++) {
    let code = bytes[i];
    if (code === 0) {
      return result;
    }
    result += String.fromCharCode(code);
  }

  return result;
}

export function string2uint8array(s, byte_count) {
  let bytes = new Uint8ClampedArray(byte_count);
  let count = s.length < byte_count ? s.length : byte_count;

  for (let i = 0; i < count; i++) {
    bytes[i] = s.charCodeAt(i);
  }
  return bytes;
}

// Source: http://stackoverflow.com/questions/1303646/check-whether-variable-is-number-or-string-in-javascript
export function isNumber(obj) {
  return !isNaN(parseInt(obj));
}

export function showPage(name) {
  // Hide all sections with class 'app-page'
  let pages = document.querySelectorAll('.app-page');
  for (let i = 0; i < pages.length; i++) {
    let page = pages[i];
    page.classList.add('hidden');
  }

  document.querySelector('#page_' + name).classList.remove('hidden');
}

export function buildURL(list) {
  let url_fragments = ['#'];

  url_fragments = url_fragments.concat(list);

  // FIXME: document why we need this...
  if (Device.MODEL && Device.MODEL.uuid) {
    url_fragments.push('m');
    url_fragments.push(Device.MODEL.uuid);
  }
  if (Device.TX && Device.TX.uuid) {
    url_fragments.push('t');
    url_fragments.push(Device.TX.uuid);
  }

  return url_fragments.join('/');
}

export function getUint16(packet, index) {
  let dv = new DataView(packet.buffer, index);
  return dv.getUint16(0, true);
}

export function getUint32(packet, index) {
  let dv = new DataView(packet.buffer, index);
  return dv.getUint32(0, true);
}

export function getInt16(packet, index) {
  let dv = new DataView(packet.buffer, index);
  return dv.getInt16(0, true);
}

export function getInt32(packet, index) {
  let dv = new DataView(packet.buffer, index);
  return dv.getInt32(0, true);
}

export function setUint16(packet, value, index) {
  let dv = new DataView(packet.buffer, index);
  return dv.setUint16(0, value, true);
}

export function setUint32(packet, value, index) {
  let dv = new DataView(packet.buffer, index);
  return dv.setUint32(0, value, true);
}

export function setInt16(packet, value, index) {
  let dv = new DataView(packet.buffer, index);
  return dv.setInt16(0, value, true);
}

export function setInt32(packet, value, index) {
  let dv = new DataView(packet.buffer, index);
  return dv.setInt32(0, value, true);
}

export function newUUID() {
  let uuid_bytes = new Uint8Array(8);
  window.crypto.getRandomValues(uuid_bytes);
  return uuid2string(uuid_bytes);
}

export function newRandomAddress () {
  let address = new Uint8Array(5);
  window.crypto.getRandomValues(address);
  return Array.from(address);
}

export function newHopChannelLFSR() {
  let lfsrParameters = new Uint8Array(2);

  do {
    window.crypto.getRandomValues(lfsrParameters);
    // Ensure the LFSR start value is valid
  } while (lfsrParameters[1] === 0  ||  lfsrParameters[1] > 127);

  return lfsrParameters;
}

// A valid UUID is a 16 hex digits in groups of 4, separated by '-', and
// it must not be 0000-0000-0000-0000 or ffff-ffff-ffff-ffff
export function isValidUUID(uuid) {
  const invalid_uuids = [
  '0000-0000-0000-0000',
  'ffff-ffff-ffff-ffff'
  ];

  const re = /^[\da-f]{4}\-[\da-f]{4}\-[\da-f]{4}\-[\da-f]{4}$/i;

  if (re.test(uuid)) {
    if (invalid_uuids.indexOf(uuid.toLowerCase()) < 0) {
      return true;
    }
  }

  return false;
}

export function addClassToSelector(selector, _class) {
  let items = document.querySelectorAll(selector);
  for (let i = 0; i < items.length; ++i) {
    items[i].classList.add(_class);
  }
}

export function removeClassFromSelector(selector, _class) {
  let items = document.querySelectorAll(selector);
  for (let i = 0; i < items.length; ++i) {
    items[i].classList.remove(_class);
  }
}



class PubSub_ {
  constructor () {
    this.topics = {};
  }

  getTopic (topic) {
    this.topics[topic] = this.topics[topic] || [];
    return this.topics[topic];
  }

  subscribe (topic, callback) {
    this.getTopic(topic).push(callback);
  }

  publish (topic, message) {
    this.getTopic(topic).forEach(callback => {
      callback(message);
    });
  }

  unsubscribe (topic, callback) {
    let callbacks = this.getTopic(topic);
    let index = callbacks.indexOf(callback);
    delete callbacks[index];
  }

  removeTopic (topic) {
    delete this.topics[topic];
  }
}

// PubSub Singleton
window['PubSub'] = window['PubSub'] || new PubSub_();
export var PubSub = window['PubSub'];
