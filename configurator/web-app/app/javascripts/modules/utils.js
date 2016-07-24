'use strict';

var byte2string = function (byte) {
    var s = byte.toString(16);

    return (s.length < 2) ? ('0' + s)  : s;
};

var uuid2string = function (uuid_bytes) {
    var result = '';

    result += this.byte2string(uuid_bytes[0]);
    result += this.byte2string(uuid_bytes[1]);
    result += this.byte2string(uuid_bytes[2]);
    result += this.byte2string(uuid_bytes[3]);
    result += '-';
    result += this.byte2string(uuid_bytes[4]);
    result += this.byte2string(uuid_bytes[5]);
    result += '-';
    result += this.byte2string(uuid_bytes[6]);
    result += this.byte2string(uuid_bytes[7]);
    result += '-';
    result += this.byte2string(uuid_bytes[8]);
    result += this.byte2string(uuid_bytes[9]);
    result += '-';
    result += this.byte2string(uuid_bytes[10]);
    result += this.byte2string(uuid_bytes[11]);
    result += this.byte2string(uuid_bytes[12]);
    result += this.byte2string(uuid_bytes[13]);
    result += this.byte2string(uuid_bytes[14]);
    result += this.byte2string(uuid_bytes[15]);

    return result;
};

var string2uuid = function (s) {
    // "c91cabaa-44c9-11e6-9bc2-03ac25e30b5b"
    var result = new Uint8Array(16);

    result[0] = parseInt(s.slice(0, 2), 16);
    result[1] = parseInt(s.slice(2, 4), 16);
    result[2] = parseInt(s.slice(4, 6), 16);
    result[3] = parseInt(s.slice(6, 8), 16);

    result[4] = parseInt(s.slice(9, 11), 16);
    result[5] = parseInt(s.slice(11, 13), 16);

    result[6] = parseInt(s.slice(14, 16), 16);
    result[7] = parseInt(s.slice(16, 18), 16);

    result[8] = parseInt(s.slice(19, 21), 16);
    result[9] = parseInt(s.slice(21, 23), 16);

    result[10] = parseInt(s.slice(24, 26), 16);
    result[11] = parseInt(s.slice(26, 28), 16);
    result[12] = parseInt(s.slice(28, 30), 16);
    result[13] = parseInt(s.slice(30, 32), 16);
    result[14] = parseInt(s.slice(32, 34), 16);
    result[15] = parseInt(s.slice(34, 36), 16);

    return result;
};

var uint8array2string = function (bytes) {
    var result = '';

    for (var i = 0; i < bytes.length; i += 1) {
        var code = bytes[i];
        if (code === 0) {
            return result;
        }
        result += String.fromCharCode(code);
    }

    return result;
};

var string2uint8array = function (s, byte_count) {
    var bytes = new Uint8ClampedArray(byte_count);
    var count = s.length < byte_count ? s.length : byte_count;

    for (var i = 0; i < count; i++) {
        bytes[i] = s.charCodeAt(i);
    }
    return bytes;
};

// Source: http://stackoverflow.com/questions/1303646/check-whether-variable-is-number-or-string-in-javascript
var isNumber = function (obj) {
    return !isNaN(parseInt(obj));
};

var showPage = function (name) {
    // Hide all sections with class 'app-page'
    var pages = document.querySelectorAll('.app-page');
    for (var i = 0; i < pages.length; i += 1) {
        var page = pages[i];
        page.classList.add('hidden');
    }

    document.querySelector('#page_' + name).classList.remove('hidden');
};

var buildURL = function (list) {
    var url_fragments = ['#'];

    url_fragments = url_fragments.concat(list);

    if (dev.MODEL && dev.MODEL.uuid) {
        url_fragments.push('m');
        url_fragments.push(dev.MODEL.uuid);
    }
    if (dev.TX && dev.TX.uuid) {
        url_fragments.push('t');
        url_fragments.push(dev.TX.uuid);
    }

    return url_fragments.join('/');
};

var getUint16 = function (packet, index) {
    var dv = new DataView(packet.buffer, index);
    return dv.getUint16(0, true);
};

var getUint32 = function (packet, index) {
    var dv = new DataView(packet.buffer, index);
    return dv.getUint32(0, true);
};

var getInt16 = function (packet, index) {
    var dv = new DataView(packet.buffer, index);
    return dv.getInt16(0, true);
};

var getInt32 = function (packet, index) {
    var dv = new DataView(packet.buffer, index);
    return dv.getInt32(0, true);
};

var setUint16 = function (packet, value, index) {
    var dv = new DataView(packet.buffer, index);
    return dv.setUint16(0, value, true);
};

var setUint32 = function (packet, value, index) {
    var dv = new DataView(packet.buffer, index);
    return dv.setUint32(0, value, true);
};

var setInt16 = function (packet, value, index) {
    var dv = new DataView(packet.buffer, index);
    return dv.setInt16(0, value, true);
};

var setInt32 = function (packet, value, index) {
    var dv = new DataView(packet.buffer, index);
    return dv.setInt32(0, value, true);
};


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


window['PubSub'] = window['PubSub'] || new PubSub();

module.exports = {
    byte2string: byte2string,
    uuid2string: uuid2string,
    string2uuid: string2uuid,
    uint8array2string: uint8array2string,
    string2uint8array: string2uint8array,
    isNumber: isNumber,
    getUint16: getUint16,
    getUint32: getUint32,
    getInt16: getInt16,
    getInt32: getInt32,
    setUint16: setUint16,
    setUint32: setUint32,
    setInt16: setInt16,
    setInt32: setInt32,
    showPage: showPage,
    buildURL: buildURL,
    PubSub: window['PubSub'] ,
};
