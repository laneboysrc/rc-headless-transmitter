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

    return undefined;
}


// Convert a given channel name (like 'CH1') to the index that matches the
// appropriate limits array element.
function channel2index(channel_name) {
    let labels = TYPES.label_t;

    if (! (channel_name in labels)) {
        console.error('channel2index(): label_t does not contain channel "'
            + channel_name + '"');
        return undefined;
    }

    let label_number = labels[channel_name];

    // The output channel labels must be in sequence by design. The number of
    // output channels can be retrieved by looking at the number of *limits*
    // entries present. We can therefore calculate the tag number of the
    // last output channel as such, which we use to chekc whether the given
    // channel name is indeed an output channel and not just any of the other
    // labels.
    let first = labels.OUTPUT_CHANNEL_TAG_OFFSET;
    let last = first + MODEL.LIMITS.c - 1;

    if (label_number < first  || label_number > last) {
        console.error('channel2index(): "' + channel_name +
            '" is not a valid output channel name (e.g. CH1)');
        return undefined;
    }

    return label_number - first;
}


var DatabaseClass = function () {
    this.data = {};
};

DatabaseClass.prototype.add = function (data, schema) {
    var uuid_bytes = new Uint8Array(data, schema['UUID'].o, schema['UUID'].s);
    var uuid = uuid2string(uuid_bytes);

    console.log('Database(): New entry with UUID=' + uuid);

    this.data[uuid] = {
        data: data,
        schema: schema
    };
};

DatabaseClass.prototype.get = function (uuid, key, offset=0, index=null) {
    var result;
    var bytes;

    if (! (uuid in this.data)) {
        console.log('Database(): uuid "' + uuid + '" not present.');
        return undefined;
    }

    var entry = this.data[uuid];
    var schema = entry.schema;

    if (! (key && key in schema)) {
        console.log('Database(): key "' + key + '" not in schema.');
        return undefined;
    }

    var data = entry.data;
    var item = schema[key];

    if (index !== null) {
        if (! isNumber(index)) {
            console.error('Database(): Requested index "' + index
                + '" is not an Integer');
            return undefined;
        }

        // In case the index is a float we convert it to an integer
        index = parseInt(index);

        if (index < 0  ||  index >= item.c) {
            console.error('Database(): Requested index "' + index
                + '" for key "' + key + '" but item contains only '
                + item.c + ' elements');
            return undefined;
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
                    return undefined;
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
                    return undefined;
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

        case 'uuid':
            bytes = new Uint8Array(data.buffer, item_offset, item.c);
            return uuid2string(bytes);

        default:
            if (! (item.t in TYPES)) {
                console.error('Database(): schema type "' + item.t
                    + '" for key "' + key + '" not defined');
                return undefined;
            }

            bytes = new Uint8Array(data.buffer, item_offset, item.c);
            result = []
            for (let n of bytes.entries()) {
                let entry = n[1];
                let element = typeLookupByNumber(item.t, entry);
                if (element) {
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

DatabaseClass.prototype.set = function (uuid, key, value, offset=0, index=null) {
    console.log('Database().set: uuid=' + uuid + ' key=' + key + ' value="'
        + value + '" offset=' + offset + ' index=' + index);
};

DatabaseClass.prototype.list = function () {
    return Object.keys(this.data);
};

DatabaseClass.prototype.getSchema = function (uuid) {
    if (! (uuid in this.data)) {
        console.log('Database(): uuid "' + uuid + '" not present.');
        return undefined;
    }

    return this.data[uuid].schema;
};

DatabaseClass.prototype.getType = function (uuid, item) {
    let schema = this.getSchema(uuid);
    let type = undefined;

    if (schema) {
        if (! (item in schema)) {
            console.log('Database(): uuid "' + uuid
                + '" schema does not contain "' + item + '"');
            return undefined;
        }
        return schema[item].t;
    }
    return type;
}



var Database = new DatabaseClass();


Database.add(TEST_CONFIG_DATA.slice(CONFIG.MODEL.o, CONFIG.MODEL.o + CONFIG.MODEL.s), MODEL);
Database.add(TEST_CONFIG_DATA.slice(CONFIG.TX.o, CONFIG.TX.o + CONFIG.TX.s), TX);


// ****************************************************************************
// Database tests

// let dbl = Database.list();
// console.log(dbl);

// let model_uuid = undefined;
// let tx_uuid = undefined;

// for (let entry in dbl) {
//     let uuid = dbl[entry];
//     if (Database.getSchema(uuid) === MODEL) {
//         model_uuid = uuid;
//     }
//     else if (Database.getSchema(uuid) === TX) {
//         tx_uuid = uuid;
//     }

//     if (model_uuid && tx_uuid) {
//         break;
//     }
// }


// console.log('MODEL=' + model_uuid + ' TX=' + tx_uuid);

// console.log(Database.get(model_uuid, 'NAME'));
// console.log(Database.get(tx_uuid, 'NAME'));
// console.log(uuid2string(Database.get(tx_uuid, 'UUID')));

// console.log(Database.get(tx_uuid, 'BIND_TIMEOUT_MS'));

// console.log(Database.get(model_uuid, 'RF_PROTOCOL_HK310_ADDRESS'));
// console.log(Database.get(model_uuid, 'RF_PROTOCOL_HK310_ADDRESS', 0, 3));

// console.log(Database.get(tx_uuid, 'BIND_TIMEOUT_MS'));

// console.log(Database.get(tx_uuid, 'HARDWARE_INPUTS_CALIBRATION', 2*TX.HARDWARE_INPUTS.s));
// console.log(Database.get(tx_uuid, 'HARDWARE_INPUTS_PCB_INPUT_PIN_NAME', TX.HARDWARE_INPUTS.s));

// console.log(Database.get(model_uuid, 'MIXER_UNITS_CURVE_TYPE'));
// console.log(Database.get(tx_uuid, 'LOGICAL_INPUTS_LABELS', 3*TX.LOGICAL_INPUTS.s));



