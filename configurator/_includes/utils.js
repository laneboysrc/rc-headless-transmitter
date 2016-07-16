(function () {
    'use strict';

    var Utils = function Utils() { };
    window['Utils'] = new Utils();


    Utils.prototype.byte2string = function (byte) {
        var s = byte.toString(16);

        return (s.length < 2) ? ('0' + s)  : s;
    };

    Utils.prototype.uuid2string = function (uuid_bytes) {
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

    Utils.prototype.string2uuid = function (s) {
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

    Utils.prototype.uint8array2string = function (bytes) {
        var result = '';

        for (let n of bytes.entries()) {
            let code = n[1];
            if (code === 0) {
                return result;
            }
            result += String.fromCharCode(code);
        }

        return result;
    };

    Utils.prototype.string2uint8array = function (s, byte_count) {
        var bytes = new Uint8ClampedArray(byte_count);
        var count = s.length < byte_count ? s.length : byte_count;

        for (let i = 0; i < count; i++) {
            bytes[i] = s.charCodeAt(i);
        }
        return bytes;
    };

    // Source: http://stackoverflow.com/questions/1303646/check-whether-variable-is-number-or-string-in-javascript
    Utils.prototype.isNumber = function (obj) {
        return !isNaN(parseInt(obj));
    };

    Utils.prototype.showPage = function (name) {
        // Hide all sections with class 'app-page'
        for (let page of document.querySelectorAll('.app-page')) {
            page.classList.add('hidden');
        }

        document.querySelector('#page_' + name).classList.remove('hidden');
    };

    Utils.prototype.buildURL = function (list) {
        var model_uuid = (dev.MODEL && dev.MODEL.uuid) || NO_DEVICE;
        var tx_uuid    = (dev.TX && dev.TX.uuid)       || NO_DEVICE;

        return '#/' + model_uuid + '/' + tx_uuid + '/' + list.join('/');
    };

})();

(function() {
    'use strict';

    var PubSub = function PubSub() {
        this.topics = {};
    };
    Utils.PubSub = new PubSub();

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
})();