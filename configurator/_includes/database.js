/*jslint browser: true */
/*global  */
"use strict";

var CONFIG = {
    o: 0, s: 4604, c: 1, t: 's',
    VERSION: {o: 0, s: 4, c: 1, t: 'u'},
    TX: {o: 4, s: 1716, c: 1, t: 's'},
    MODEL: {o: 1720, s: 2884, c: 1, t: 's'},
};

var TX = {
    o: 0, s: 1716, c: 1, t: 's',
    UUID: {o: 0, s: 1, c: 16, t: 'u'},
    NAME: {o: 16, s: 1, c: 16, t: 'c'},
    HARDWARE_INPUTS: {o: 32, s: 32, c: 32, t: 's'},
    HARDWARE_INPUTS_PCB_INPUT: {o: 32, s: 24, c: 1, t: 's'},
    HARDWARE_INPUTS_PCB_INPUT_GPIOPORT: {o: 32, s: 4, c: 1, t: 'u'},
    HARDWARE_INPUTS_PCB_INPUT_GPIO: {o: 36, s: 2, c: 1, t: 'u'},
    HARDWARE_INPUTS_PCB_INPUT_ADC_CHANNEL: {o: 38, s: 1, c: 1, t: 'u'},
    HARDWARE_INPUTS_PCB_INPUT_TYPE: {o: 39, s: 1, c: 1, t: 'u'},
    HARDWARE_INPUTS_PCB_INPUT_PIN_NAME: {o: 40, s: 1, c: 10, t: 'c'},
    HARDWARE_INPUTS_PCB_INPUT_SCHEMATIC_REFERENCE: {o: 50, s: 1, c: 6, t: 'c'},
    HARDWARE_INPUTS_TYPE: {o: 56, s: 1, c: 1, t: 'u'},
    HARDWARE_INPUTS_CALIBRATION: {o: 58, s: 2, c: 3, t: 'u'},
    LOGICAL_INPUTS: {o: 1056, s: 20, c: 32, t: 's'},
    LOGICAL_INPUTS_TYPE: {o: 1056, s: 1, c: 1, t: 'u'},
    LOGICAL_INPUTS_SUB_TYPE: {o: 1057, s: 1, c: 1, t: 'u'},
    LOGICAL_INPUTS_POSITION_COUNT: {o: 1058, s: 1, c: 1, t: 'u'},
    LOGICAL_INPUTS_HARDWARE_INPUTS: {o: 1059, s: 1, c: 12, t: 'u'},
    LOGICAL_INPUTS_LABELS_O: {o: 1071, s: 1, c: 5, t: 'u'},
    TRIM_RANGE: {o: 1696, s: 4, c: 1, t: 'i'},
    TRIM_STEP_SIZE: {o: 1700, s: 4, c: 1, t: 'i'},
    BIND_TIMEOUT_MS: {o: 1704, s: 4, c: 1, t: 'u'},
    DOUBLE_CLICK_TIMEOUT_MS: {o: 1708, s: 4, c: 1, t: 'u'},
    LED_PWM_PERCENT: {o: 1712, s: 1, c: 1, t: 'u'},
    types: {
        pcb_inputut_type_t: {
            PCB_INPUT_NOT_USED: 0,
            ANALOG_DIGITAL: 1,
            DIGITAL: 2,
        },
        hardware_input_type_t: {
            TRANSMITTER_INPUT_NOT_USED: 0,
            ANALOG_WITH_CENTER: 1,
            ANALOG_NO_CENTER: 2,
            ANALOG_NO_CENTER_POSITIVE_ONLY: 3,
            SWITCH_ON_OFF: 4,
            SWITCH_ON_OPEN_OFF: 5,
            MOMENTARY_ON_OFF: 6,
        },
        input_type_t: {
            LOGICAL_INPUT_NOT_USED: 0,
            ANALOG: 1,
            SWITCH: 2,
            BCD_SWITCH: 3,
            MOMENTARY: 4,
            TRIM: 5,
        },
        input_sub_type_t: {
            SUB_TYPE_NOT_APPLICABLE: 0,
            UP_DOWN_BUTTONS: 1,
            INCREMENT_AND_LOOP: 2,
            DECREMENT_AND_LOOP: 3,
            SAW_TOOTH: 4,
            DOUBLE_CLICK_DECREMENT: 5,
        },
        label_t: {
            NONE: 0,
            ST: 1,
            TH: 2,
            THR: 3,
            RUD: 4,
            ELE: 6,
            AUX: 7,
            ST_DR: 8,
            RUD_DR: 9,
            AIL_DR: 10,
            ELE_DR: 11,
            TH_DR: 12,
            THR_DR: 13,
            TH_HOLD: 14,
            GEAR: 15,
            FLAPS: 16,
            TRAINER: 17,
            SIDE_L: 18,
            SIDE_R: 19,
            POT1: 20,
            POT2: 21,
            POT3: 22,
            POT4: 23,
            POT5: 24,
            POT6: 25,
            POT7: 26,
            POT8: 27,
            POT9: 28,
            SW1: 29,
            SW2: 30,
            SW3: 31,
            SW4: 32,
            SW5: 33,
            SW7: 35,
            SW8: 36,
            SW9: 37,
            CH1: 38,
            CH2: 39,
            CH3: 40,
            CH4: 41,
            CH5: 42,
            CH6: 43,
            CH7: 44,
            CH8: 45,
            VIRTUAL1: 46,
            VIRTUAL2: 47,
            VIRTUAL3: 48,
            VIRTUAL4: 49,
            VIRTUAL5: 50,
            VIRTUAL6: 51,
            VIRTUAL7: 52,
            VIRTUAL8: 53,
            VIRTUAL9: 54,
            VIRTUAL10: 55,
        },
    },
};

var MODEL = {
    o: 0, s: 2884, c: 1, t: 's',
    UUID: {o: 0, s: 1, c: 16, t: 'u'},
    NAME: {o: 16, s: 1, c: 16, t: 'c'},
    MIXER_UNITS: {o: 32, s: 26, c: 100, t: 's'},
    MIXER_UNITS_CURVE: {o: 32, s: 15, c: 1, t: 's'},
    MIXER_UNITS_CURVE_TYPE: {o: 32, s: 1, c: 1, t: 's'},
    MIXER_UNITS_CURVE_SMOOTHING: {o: 33, s: 1, c: 1, t: 's'},
    MIXER_UNITS_CURVE_POINTS: {o: 34, s: 13, c: 1, t: 's'},
    MIXER_UNITS_SRC: {o: 47, s: 1, c: 1, t: 'u'},
    MIXER_UNITS_DST: {o: 48, s: 1, c: 1, t: 'u'},
    MIXER_UNITS_SW: {o: 49, s: 3, c: 1, t: 's'},
    MIXER_UNITS_SW_SW: {o: 49, s: 1, c: 1, t: 'u'},
    MIXER_UNITS_SW_CMP: {o: 50, s: 1, c: 1, t: 'u'},
    MIXER_UNITS_SW_VALUE: {o: 51, s: 1, c: 1, t: 'u'},
    MIXER_UNITS_OP: {o: 52, s: 1, c: 1, t: 'u'},
    MIXER_UNITS_SCALAR: {o: 53, s: 1, c: 1, t: 'i'},
    MIXER_UNITS_OFFSET: {o: 54, s: 1, c: 1, t: 'i'},
    MIXER_UNITS_TAG: {o: 55, s: 1, c: 1, t: 'u'},
    MIXER_UNITS_INVERT_SOURCE: {o: 56, s: 1, c: 1, t: 'u'},
    MIXER_UNITS_APPLY_TRIM: {o: 57, s: 1, c: 1, t: 'u'},
    LIMITS: {o: 2632, s: 28, c: 8, t: 's'},
    LIMITS_EP_L: {o: 2632, s: 4, c: 1, t: 'i'},
    LIMITS_EP_R: {o: 2636, s: 4, c: 1, t: 'i'},
    LIMITS_SUBTRIM: {o: 2640, s: 4, c: 1, t: 'i'},
    LIMITS_LIMIT_L: {o: 2644, s: 4, c: 1, t: 'i'},
    LIMITS_LIMIT_H: {o: 2648, s: 4, c: 1, t: 'i'},
    LIMITS_FAILSAFE: {o: 2652, s: 4, c: 1, t: 'i'},
    LIMITS_SPEED: {o: 2656, s: 1, c: 1, t: 'u'},
    LIMITS_INVERT: {o: 2657, s: 1, c: 1, t: 'u'},
    RF_PROTOCOL_TYPE: {o: 2856, s: 1, c: 1, t: 'u'},
    RF: {o: 2857, s: 25, c: 1, t: 's'},
    RF_PROTOCOL_HK310: {o: 2857, s: 25, c: 1, t: 's'},
    RF_PROTOCOL_HK310_HOP_CHANNELS: {o: 2857, s: 1, c: 20, t: 'u'},
    RF_PROTOCOL_HK310_ADDRESS: {o: 2877, s: 1, c: 5, t: 'u'},
    types: {
        rf_protocol_type_t: {
            RF_PROTOCOL_HK310: 0,
        },
        operation_type_t: {
            OP_REPLACE: 0,
            OP_ADD: 1,
            OP_MULTIPLY: 2,
            OP_MIN: 3,
            OP_MAX: 4,
        },
        comparison_t: {
            EQUAL: 0,
            NON_EQUAL: 1,
            GREATER: 2,
            GREATER_OR_EQUAL: 3,
            SMALLER: 4,
            SMALLER_OR_EQUAL: 5,
        },
        curve_type_t: {
            CURVE_NONE: 0,
            CURVE_FIXED: 1,
            CURVE_MIN_MAX: 2,
            CURVE_ZERO_MAX: 3,
            CURVE_GT_ZERO: 4,
            CURVE_LT_ZERO: 5,
            CURVE_ABSVAL: 6,
            CURVE_EXPO: 7,
            CURVE_DEADBAND: 8,
            CURVE_3POINT: 9,
            CURVE_5POINT: 10,
            CURVE_7POINT: 11,
            CURVE_9POINT: 12,
            CURVE_11POINT: 13,
            CURVE_13POINT: 14,
        },
        interpolation_type_t: {
            INTERPOLATION_LINEAR: 0,
            INTERPOLATION_SMOOTHING: 1,
        },
    },
};



function uuid2string(uuid_bytes) {
    let result = '';

    function byte2string(byte) {
        let s = byte.toString(16);
        if (s.length < 2) {
            return '0' + s;
        }
        return s;
    }

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
            console.error('Database(): Requested index "' + index + '" is not an Integer');
            return null;
        }

        // In case the index is a float we convert it to an integer
        index = parseInt(index);

        if (index < 0  ||  index >= item.c) {
            console.error('Database(): Requested index "' + index + '" for key "' + key + '" but item contains only ' + item.c + ' elements');
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
                    console.error('Database(): "unsigned" schema size not 1, 2 or 4 for key "' + key + '"');
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
                    console.error('Database(): "signed int" schema size not 1, 2 or 4 for key "' + key + '"');
                    return null;
            }
            break;

        case 'c':
            var bytes = new Uint8Array(data.buffer, item_offset, item.c);
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
            console.error('Database(): schema type "' + item.t + '" for key "' + key + '" not defined');
            return null;
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

console.log(ModelDatabase.get(mdbl[0], 'NAME'));
console.log(TransmitterDatabase.get(tdbl[0], 'NAME'));
console.log(uuid2string(TransmitterDatabase.get(tdbl[0], 'UUID')));

console.log(TransmitterDatabase.get(tdbl[0], 'BIND_TIMEOUT_MS'));

console.log(ModelDatabase.get(mdbl[0], 'RF_PROTOCOL_HK310_ADDRESS'));
console.log(ModelDatabase.get(mdbl[0], 'RF_PROTOCOL_HK310_ADDRESS', 0, 3));

console.log(TransmitterDatabase.get(tdbl[0], 'BIND_TIMEOUT_MS'));

console.log(TransmitterDatabase.get(tdbl[0], 'HARDWARE_INPUTS_CALIBRATION', 2*TX.HARDWARE_INPUTS.s));
console.log(TransmitterDatabase.get(tdbl[0], 'HARDWARE_INPUTS_PCB_INPUT_PIN_NAME', TX.HARDWARE_INPUTS.s));


