/*jslint browser: true */
/*global  */
"use strict";

function byte2string(byte) {
    let s = byte.toString(16);
    if (s.length < 2) {
        return '0' + s;
    }
    return s;
}

function uuid2string(uuid_bytes) {
    let result = '';

    result += byte2string(uuid_bytes[0]);
    result += byte2string(uuid_bytes[1]);
    result += byte2string(uuid_bytes[2]);
    result += byte2string(uuid_bytes[3]);
    result += '-';
    result += byte2string(uuid_bytes[4]);
    result += byte2string(uuid_bytes[5]);
    result += '-';
    result += byte2string(uuid_bytes[6]);
    result += byte2string(uuid_bytes[7]);
    result += '-';
    result += byte2string(uuid_bytes[8]);
    result += byte2string(uuid_bytes[9]);
    result += '-';
    result += byte2string(uuid_bytes[10]);
    result += byte2string(uuid_bytes[11]);
    result += byte2string(uuid_bytes[12]);
    result += byte2string(uuid_bytes[13]);
    result += byte2string(uuid_bytes[14]);
    result += byte2string(uuid_bytes[15]);

    return result;
}

function uint8array2string(bytes) {
    let result = '';

    for (let n of bytes.entries()) {
        let code = n[1];
        if (code === 0) {
            return result;
        }
        result += String.fromCharCode(code);
    };

    return result;
}

// Source: http://stackoverflow.com/questions/1303646/check-whether-variable-is-number-or-string-in-javascript
function isNumber(obj) {
    return !isNaN(parseInt(obj))
}


function typeLookupByNumber(type_name, entry) {
    let types = TYPES[type_name];

    if (types) {
        for (let n in types) {
            if (types.hasOwnProperty(n)) {
                if (entry === types[n]) {
                    return n;
                }
            }
        }
    }

    return null;
}


var Database = function (schema) {
    this.schema = schema;
    this.data = {};
};

Database.prototype.add = function (data) {
    var uuid_bytes = new Uint8Array(data, this.schema['UUID'].o, this.schema['UUID'].s);
    var uuid = uuid2string(uuid_bytes);

    console.log('Database(): New entry with UUID=' + uuid);

    this.data[uuid] = data;
};

Database.prototype.get = function (uuid, key, offset=0, index=null) {
    var result;
    var bytes;

    if (! (uuid in this.data)) {
        console.log('Database(): uuid "' + uuid + '" not present.');
        return null;
    }

    if (! (key && key in this.schema)) {
        console.log('Database(): key "' + key + '" not in schema.');
        return null;
    }

    var data = this.data[uuid];
    var item = this.schema[key];

    if (index !== null) {
        if (! isNumber(index)) {
            console.error('Database(): Requested index "' + index
                + '" is not an Integer');
            return null;
        }

        // In case the index is a float we convert it to an integer
        index = parseInt(index);

        if (index < 0  ||  index >= item.c) {
            console.error('Database(): Requested index "' + index
                + '" for key "' + key + '" but item contains only '
                + item.c + ' elements');
            return null;
        }
    }

    var item_offset = item.o + offset;

    switch (item.t) {
        case 'u':
            switch(item.s) {
                case 1:
                    result = new Uint8Array(data.buffer, item_offset, item.c);
                    break;

                case 2:
                    result = new Uint16Array(data.buffer, item_offset, item.c);
                    break;

                case 4:
                    result = new Uint32Array(data.buffer, item_offset, item.c);
                    break;

                default:
                    console.error('Database(): "unsigned" schema size not '
                        + '1, 2 or 4 for key "' + key + '"');
                    return null;
            }
            break;

        case 'i':
            switch(item.s) {
                case 1:
                    result = new Int8Array(data.buffer, item_offset, item.c);
                    break;

                case 2:
                    result = new Int16Array(data.buffer, item_offset, item.c);
                    break;

                case 4:
                    result = new Int32Array(data.buffer, item_offset, item.c);
                    break;

                default:
                    console.error('Database(): "signed int" schema size not '
                        + '1, 2 or 4 for key "' + key + '"');
                    return null;
            }
            break;

        case 'c':
            bytes = new Uint8Array(data.buffer, item_offset, item.c);
            return uint8array2string(bytes);

        case 's':
            if (index !== null) {
                return new Uint8Array(data.buffer, item_offset + (item.s * index), item.s);
            }

            result = [];
            for (let i = 0; i < item.c; i++) {
                result.push(new Uint8Array(data.buffer, item_offset + (i * item.s), item.s));
            }
            break;

        default:
            if (! (item.t in TYPES)) {
                console.error('Database(): schema type "' + item.t
                    + '" for key "' + key + '" not defined');
                return null;
            }

            bytes = new Uint8Array(data.buffer, item_offset, item.c);
            result = []
            for (let n of bytes.entries()) {
                let entry = n[1];
                let element = typeLookupByNumber(item.t, entry);
                if (element !== null) {
                    result.push(element);
                }
                else {
                    result.push(entry);
                    console.warn('Database(): schema type "' + item.t
                        + '" for key "' + key + '" does not contain entry "'
                        + entry + '"');
                }
            }
    }

    if (index !== null) {
        return result[index];
    }

    // Items with count == 1 are returned directly, otherwise we return an array.
    if (item.c === 1) {
        return result[0]
    }
    return result;
};

Database.prototype.set = function (uuid, key, index=null) {
    // FIXME: not implemented yet
};

Database.prototype.list = function () {
    return  Object.keys(this.data);
}


var ModelDatabase = new Database(MODEL);
var TransmitterDatabase = new Database(TX);

ModelDatabase.add(TEST_CONFIG_DATA.slice(CONFIG.MODEL.o, CONFIG.MODEL.o + CONFIG.MODEL.s));
TransmitterDatabase.add(TEST_CONFIG_DATA.slice(CONFIG.TX.o, CONFIG.TX.o + CONFIG.TX.s));

var mdbl = ModelDatabase.list();
var tdbl = TransmitterDatabase.list()

// console.log(ModelDatabase.get(mdbl[0], 'NAME'));
// console.log(TransmitterDatabase.get(tdbl[0], 'NAME'));
// console.log(uuid2string(TransmitterDatabase.get(tdbl[0], 'UUID')));

// console.log(TransmitterDatabase.get(tdbl[0], 'BIND_TIMEOUT_MS'));

// console.log(ModelDatabase.get(mdbl[0], 'RF_PROTOCOL_HK310_ADDRESS'));
// console.log(ModelDatabase.get(mdbl[0], 'RF_PROTOCOL_HK310_ADDRESS', 0, 3));

// console.log(TransmitterDatabase.get(tdbl[0], 'BIND_TIMEOUT_MS'));

// console.log(TransmitterDatabase.get(tdbl[0], 'HARDWARE_INPUTS_CALIBRATION', 2*TX.HARDWARE_INPUTS.s));
// console.log(TransmitterDatabase.get(tdbl[0], 'HARDWARE_INPUTS_PCB_INPUT_PIN_NAME', TX.HARDWARE_INPUTS.s));

// console.log(ModelDatabase.get(mdbl[0], 'MIXER_UNITS_CURVE_TYPE'));
// console.log(TransmitterDatabase.get(tdbl[0], 'LOGICAL_INPUTS_LABELS', 3*TX.LOGICAL_INPUTS.s));



