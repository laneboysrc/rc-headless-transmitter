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

function string2uuid(s) {
    // "c91cabaa-44c9-11e6-9bc2-03ac25e30b5b"
    let result = new Uint8Array(16);

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

function string2uint8array(s, byte_count) {
    let bytes = new Uint8ClampedArray(byte_count);
    let count = s.length < byte_count ? s.length : byte_count;

    for (let i = 0; i < count; i++) {
        bytes[i] = s.charCodeAt(i);
    }
    return bytes;
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

DatabaseClass.prototype.isValid = function (uuid, key, index) {
    if (! (uuid in this.data)) {
        console.error('Database(): uuid "' + uuid + '" not in database.');
        return false;
    }

    let entry = this.data[uuid];
    let schema = entry.schema;

    if (! (key && key in schema)) {
        console.error('Database(): key "' + key + '" not in schema.');
        return false;
    }

    if (index !== null) {
        if (! isNumber(index)) {
            console.error('Database(): index "' + index + '" is not an Integer');
            return false;
        }

        let item = schema[key];

        // Convert index to an Integer to handle the case where a string
        // representation or a float was given
        index = parseInt(index);

        if (index < 0  ||  index >= item.c) {
            console.error('Database(): Requested index "' + index
                + '" for key "' + key + '" but item contains only '+ item.c
                + ' elements');
            return false;
        }
    }

    return true;
};

DatabaseClass.prototype.get = function (uuid, key, offset=0, index=null) {
    var result;
    var bytes;

    if (! this.isValid(uuid, key, index)) {
        return undefined;
    }

    // Since we passed isValid() these will all succeed
    let entry = this.data[uuid];
    let schema = entry.schema;
    let data = entry.data;
    let item = schema[key];
    let item_offset = item.o + offset;

    // Convert index to an Integer to handle the case where a string
    // representation or a float was given
    // If index is 'null' then it will become NaN, which is what we check
    // during the rest of the code
    index = parseInt(index);

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
            if (isNumber(index)) {
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

    if (isNumber(index)) {
        return result[index];
    }

    // Items with count == 1 are returned directly, otherwise we return an array.
    if (item.c === 1) {
        return result[0]
    }
    return result;
};

DatabaseClass.prototype.set = function (uuid, key, value, offset=0, index=null) {
    // console.log('Database().set: uuid=' + uuid + ' key=' + key + ' value="'
    //     + value + '" offset=' + offset + ' index=' + index);

    if (! this.isValid(uuid, key, index)) {
        return undefined;
    }

    // Since we passed isValid() these will all succeed
    let entry = this.data[uuid];
    let schema = entry.schema;
    let data = entry.data;
    let item = schema[key];
    let item_offset = item.o + offset;

    // Convert index to an Integer to handle the case where a string
    // representation or a float was given
    // If index is 'null' then it will become NaN, which is what we check
    // during the rest of the code
    index = parseInt(index);

    // If we are dealing with an element with count=1 then we treat it
    // as if a single element update of element[0] was requested. This
    // simplifies further code.
    if (item.c === 1) {
        index = 0;
    }

    // FIXME: check that value given has item.c elements if !isNumber(index)

    function getSetter(bytesPerElement, type) {
        let setters = {
            'u': {
                1: DataView.prototype.setUint8,
                2: DataView.prototype.setUint16,
                4: DataView.prototype.setUint32
            },
            'i': {
                1: DataView.prototype.setInt8,
                2: DataView.prototype.setInt16,
                4: DataView.prototype.setInt32
            }
        };

        if (! (type in setters)) {
            console.error('Database() getSetter: item.t must be "u" or "i"');
            return undefined;
        }

        if (! (bytesPerElement in setters[type])) {
            console.error('Database() getSetter: bytesPerElement must be 1, 2 or 4');
            return undefined;
        }

        return setters[type][bytesPerElement];
    }

    function storeArray(values, setter=DataView.prototype.setUint8) {
        let dv = new DataView(data.buffer, item_offset, item.c * item.s);

        for (let i = 0; i < item.c; i++) {
            let byteOffset = i * item.s;
            setter.apply(dv, [byteOffset, values[i], true]);
        }
    }

    function storeScalar(value, index, setter=DataView.prototype.setUint8) {
        let dv = new DataView(data.buffer, item_offset, item.c * item.s);
        let byteOffset = index * item.s;
        setter.apply(dv, [byteOffset, value, true]);
    }

    function setString() {
        let bytes = string2uint8array(value, item.c);
        storeArray(bytes);
    }

    function setUUID() {
        let bytes = string2uuid(value, item.c);
        storeArray(bytes);
    }

    function setInteger() {
        let setter = getSetter(item.s, item.t);
        if (isNumber(index)) {
            storeScalar(value, index, setter);
        }
        else {
            storeArray(value, setter);
        }
    }

    function setTypedItem() {

    }

    switch (item.t) {
        case 'u':
        case 'i':
            setInteger();
            break;

        case 'c':
            setString();
            break;

        case 's':
            console.error('Database(): Key ' + key
                + ': Writing a structure is not supported')
            break;

        case 'uuid':
            setUUID();
            break;

        default:
            break;
    }
};

DatabaseClass.prototype.list = function (schema=null) {
    if (schema) {
        let result = [];
        for (let uuid in this.data) {
            if (this.data[uuid].schema === schema) {
                result.push(uuid);
            }
        }

        return result;
    }

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

// Add a test model and transmitter to the database
Database.add(TEST_CONFIG_DATA.slice(CONFIG.MODEL.o, CONFIG.MODEL.o + CONFIG.MODEL.s), MODEL);
Database.add(TEST_CONFIG_DATA.slice(CONFIG.TX.o, CONFIG.TX.o + CONFIG.TX.s), TX);


// ****************************************************************************
// Database tests

if (1) {
    let model_uuid = Database.list(MODEL)[0];
    let tx_uuid = Database.list(TX)[0]

    console.info('Tests for Database.get()');
    console.log('MODEL=' + model_uuid + ' TX=' + tx_uuid);

    console.log(Database.get(model_uuid, 'NAME'));
    console.log(Database.get(tx_uuid, 'NAME'));
    console.log(Database.get(tx_uuid, 'UUID'));

    console.log(Database.get(tx_uuid, 'BIND_TIMEOUT_MS'));

    console.log(Database.get(model_uuid, 'RF_PROTOCOL_HK310_ADDRESS'));
    console.log(Database.get(model_uuid, 'RF_PROTOCOL_HK310_ADDRESS', 0, 3));

    console.log(Database.get(tx_uuid, 'HARDWARE_INPUTS_CALIBRATION', 2*TX.HARDWARE_INPUTS.s));
    console.log(Database.get(tx_uuid, 'HARDWARE_INPUTS_PCB_INPUT_PIN_NAME', TX.HARDWARE_INPUTS.s));

    console.log(Database.get(model_uuid, 'MIXER_UNITS_CURVE_TYPE'));
    console.log(Database.get(tx_uuid, 'LOGICAL_INPUTS_LABELS', 3*TX.LOGICAL_INPUTS.s));
    console.log(Database.get(tx_uuid, 'LOGICAL_INPUTS_LABELS', 2*TX.LOGICAL_INPUTS.s, 1));

    console.info('Tests that should fail and return "undefined":');
    console.log(Database.get('wrong-uuid', 'MIXER_UNITS_CURVE_TYPE'));
    console.log(Database.get(tx_uuid, 'MIXER_UNITS_CURVE_TYPE'));
    console.log(Database.get(tx_uuid, 'LOGICAL_INPUTS_LABELS', 3*TX.LOGICAL_INPUTS.s, 5));
    console.log(Database.get(model_uuid, 'MIXER_UNITS', 0, 'three'));

    console.log(Database.get(model_uuid, 'NAME'));

    console.warn('---------------------------------');
    console.warn('Tests for Database.set()');

    function testSet(uuid, item, new_value) {
        console.info('Changing ' + item + ' to ' + new_value);

        let original = Database.get(uuid, item);
        Database.set(uuid, item, new_value);
        let changed = Database.get(uuid, item);


        if (new_value == changed) {
            console.log('Ok');
            return;
        }

        if (typeof(changed) === 'object') {
            for (let i = 0; i < new_value.length; i += 1) {
                if (changed[i != new_value[i]]) {
                    console.error('' + new_value + ' != ' + changed);
                    return;
                }
            }
            console.log('Ok');
            return;
        }

        console.error('' + new_value + ' != ' + changed);
    }

    testSet(model_uuid, 'NAME', 'ChangedName');
    testSet(tx_uuid, 'UUID', 'cafebabe-dead-beef-1234-010203040506');
    testSet(tx_uuid, 'LED_PWM_PERCENT', '42');
    testSet(tx_uuid, 'BIND_TIMEOUT_MS', 1234);
    testSet(model_uuid, 'LIMITS_LIMIT_L', -42);
    testSet(tx_uuid, 'HARDWARE_INPUTS_CALIBRATION', [1234, 2345, 3456]);

}

