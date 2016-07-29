'use strict';

export function byte2string(byte) {
    var s = byte.toString(16);

    return (s.length < 2) ? ('0' + s)  : s;
}

export function uuid2string(uuid_bytes) {
    var result = '';

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
    var result = new Uint8Array(16);

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
    var result = '';

    for (var i = 0; i < bytes.length; i += 1) {
        var code = bytes[i];
        if (code === 0) {
            return result;
        }
        result += String.fromCharCode(code);
    }

    return result;
}

export function string2uint8array(s, byte_count) {
    var bytes = new Uint8ClampedArray(byte_count);
    var count = s.length < byte_count ? s.length : byte_count;

    for (var i = 0; i < count; i++) {
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
    var pages = document.querySelectorAll('.app-page');
    for (var i = 0; i < pages.length; i += 1) {
        var page = pages[i];
        page.classList.add('hidden');
    }

    document.querySelector('#page_' + name).classList.remove('hidden');
}

export function buildURL(list) {
    var url_fragments = ['#'];

    url_fragments = url_fragments.concat(list);

    // FIXME: document why we need this...
    if (dev.MODEL && dev.MODEL.uuid) {
        url_fragments.push('m');
        url_fragments.push(dev.MODEL.uuid);
    }
    if (dev.TX && dev.TX.uuid) {
        url_fragments.push('t');
        url_fragments.push(dev.TX.uuid);
    }

    return url_fragments.join('/');
}

export function getUint16(packet, index) {
    var dv = new DataView(packet.buffer, index);
    return dv.getUint16(0, true);
}

export function getUint32(packet, index) {
    var dv = new DataView(packet.buffer, index);
    return dv.getUint32(0, true);
}

export function getInt16(packet, index) {
    var dv = new DataView(packet.buffer, index);
    return dv.getInt16(0, true);
}

export function getInt32(packet, index) {
    var dv = new DataView(packet.buffer, index);
    return dv.getInt32(0, true);
}

export function setUint16(packet, value, index) {
    var dv = new DataView(packet.buffer, index);
    return dv.setUint16(0, value, true);
}

export function setUint32(packet, value, index) {
    var dv = new DataView(packet.buffer, index);
    return dv.setUint32(0, value, true);
}

export function setInt16(packet, value, index) {
    var dv = new DataView(packet.buffer, index);
    return dv.setInt16(0, value, true);
}

export function setInt32(packet, value, index) {
    var dv = new DataView(packet.buffer, index);
    return dv.setInt32(0, value, true);
}

export function newUUID() {
    var uuid_bytes = new Uint8Array(8);
    window.crypto.getRandomValues(uuid_bytes);
    return uuid_bytes;
}

export function addClassToSelector(selector, _class) {
    var items = document.querySelectorAll(selector);
    for (var i = 0; i < items.length; ++i) {
        items[i].classList.add(_class);
    }
}

export function removeClassFromSelector(selector, _class) {
    var items = document.querySelectorAll(selector);
    for (var i = 0; i < items.length; ++i) {
        items[i].classList.remove(_class);
    }
}



var PubSub = function PubSub() {
    this.topics = {};
};

PubSub.prototype.getTopic = function (topic) {
    this.topics[topic] = this.topics[topic] || [];
    return this.topics[topic];
};

PubSub.prototype.subscribe = function (topic, callback) {
    this.getTopic(topic).push(callback);
};

PubSub.prototype.publish = function (topic, message) {
    this.getTopic(topic).forEach(function (callback) {
        callback(message);
    });
};

PubSub.prototype.unsubscribe =  function (topic, callback) {
    var callbacks = this.getTopic(topic);
    var index = callbacks.indexOf(callback);
    delete callbacks[index];
};

PubSub.prototype.removeTopic =  function (topic) {
    delete this.topics[topic];
};

// PubSub Singleton
window['PubSub'] = window['PubSub'] || new PubSub();
export var PubSub = window['PubSub'];
