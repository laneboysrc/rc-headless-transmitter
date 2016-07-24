'use strict';

var Utils = require('./utils');


// Custom database exception
function DatabaseException(message) {
    this.name = "DatabaseException";
    this.message = message;
}


// DBObject: Database Object
//
// IndexedDB is a Object database: instead of rows/columns like traditional
// relational databases it stores 'objects'. The DBObject represents one
// of these objects in database that holds model or transmitter data.
var DBObject = function (data) {
    this.uuid = data.uuid;
    this.data = data.data;
    this.configVersion = data.configVersion;
    this.schemaName = data.schemaName;
    this.lastChanged = data.lastChanged;
};


// This function performs basic checks on the most common inputs to
// many of the database function.
//
// In case an issue is found a console.error() message is written and a
// DatabaseException() is thrown.
DBObject.prototype.validateInputs = function (key, index) {
    var message;
    var schema = this.getSchema();

    if (key  &&  !schema.hasOwnProperty(key)) {
        message = 'Key "' + key + '" not in schema.';
        console.error(message);
        throw new DatabaseException(message);
    }

    if (typeof index !== 'undefined') {
        if (! Utils.isNumber(index)) {
            message = 'Index "' + index + '" is not an Integer';
            console.error(message);
            throw new DatabaseException(message);
        }

        var  item = schema[key];

        // Convert index to an Integer to handle the case where a string
        // representation or a float was given
        index = parseInt(index);

        if (index < 0  ||  index >= item.c) {
            message = 'Requested index "' + index + '" for key "' + key +
                '" but item contains only ' + item.c + ' elements';
            console.error(message);
            throw new DatabaseException(message);
        }
    }
};


// Translates a value that corresponds to type (which corresponds to a C
// enumeration) into the human readable name. If the value is not in the
// type then the value is returned verbatim.
DBObject.prototype.typeLookupByNumber = function (type, value) {
    if (type) {
        for (var n in type) {
            if (type.hasOwnProperty(n)) {
                if (value === type[n]) {
                    return n;
                }
            }
        }
    }

    return value;
};


// Returns the configuration of the database entry.
// The configuration is the metadata for the uuid contents. It holds the
// MODEL and TX schemas as well as the TYPES (enumeration values used in
// the schema)
DBObject.prototype.getConfig = function () {
    return CONFIG_VERSIONS[this.configVersion];
};


// Returns the schema of a database entry. The schema describes the
// structure of the database entry, i.e. which elements it has.
DBObject.prototype.getSchema = function () {
    return this.getConfig()[this.schemaName];
};


// Return the type of a particular entry in the schema.
// The type can be one of the following:
//  u': unsigned integer
//      'i': signed integer
//      'c': string (Note: may not be 0 terminated if it fills the element)
//      'uuid': 128-bit (16 bytes) universally unique identifier
//      <any other value>: refers to named elements in this.config.TYPES[],
//          which correspond to enums in the firmware.
//
// Example:
//      var type = dev.TX.getType('HARDWARE_INPUTS_CALIBRATION');
//
//      > type == 'u' because the HARDWARE_INPUTS_CALIBRATION is an array
//                    of three uint16_t values in the firmware.
//
DBObject.prototype.getType = function (key) {
    this.validateInputs(key);
    return this.getSchema()[key].t;
};


// Obtains the type (corresponds to C enum) for 'key' and returns the value
// for named element 'value' in that type.
//
// Example:
//      var n = dev.MODEL.getNumberOfTypeMember('MIXER_UNITS_DST', 'CH7');
//
//      > n == 6 as the enum in the firmware is CH1=0, CH2, CH3 ...
//
DBObject.prototype.getNumberOfTypeMember = function (key, value) {
    this.validateInputs(key);

    var config = this.getConfig();
    var type = this.getSchema()[key].t;
    return config.TYPES[type][value];
};


// Returns a list of all members of a given type (C enum)
//
// Example:
//      var m = dev.MODEL.getTypeMembers('interpolation_type_t');
//
//      > Array [ "Linear", "Smoothing" ]
//
DBObject.prototype.getTypeMembers = function (type) {
    var config = this.getConfig();
    return Object.keys(config.TYPES[type]);
};


// Return a human-friendly text representation of the given item.
// This is stored in the [key].h field of the schema, which is optional.
// If we can't access the [key].h field we return the key name.
//
// Example:
//      var n = dev.MODEL.getHumanFriendlyText('MIXER_UNITS_SW_CMP');
//
//      > n == "Comparison"
//
DBObject.prototype.getHumanFriendlyText = function (key) {
    this.validateInputs(key);

    var schema = this.getSchema();

    if (schema[key].hasOwnProperty('h')) {
        return schema[key].h;
    }

    return key;
};


// Retrieve an element from the database entry.
// The element to retrieve is passed in 'key'.
//
// Example:
//      var ms = dev.TX.get('BIND_TIMEOUT_MS');
//
//      > ms == 10000 (10 seconds)
//
//
// The type of the value returned depends on the element type:
// - Signed and unsigned integers (types 'u' and 'i') are returned as
//   numbers.
// - C-strings (type 'c') are returned as JavaScript string.
// - UUIDs (type 'uuid') are returned as JavaScript string.
// - Elements that describe a C structure (type 's') are returned as
//   Uint8Array().
// - Typed elements (type is any other value than described above) are
//   returned as JavaScript string representation of the element value.
//   If a particular element value does not have a a string representation
//   then the number is returned.
//
// Example:
//      var rf = dev.MODEL.get('RF_PROTOCOL_TYPE');
//
//      > rf == "HobbyKing HKR3000", which is the string representation
//              of the value 0 for the 'rf_protocol_t' enum in the firmware.
//
// If the requested element is an array then by default all array elements
// are returned.
//
// Example:
//      var l = dev.TX.get('LOGICAL_INPUTS_LABELS');
//
//      > l == Array [ "AIL", 0, 0, 0, 0 ]; Notice all but the first
//             value are returned as number as input_labels_t does not
//             have an entry for the value 0. This is on purpose as
//             0 means "label not used" and is not supposed to be presented
//             to the user.
//
// In order to obtain a particular item within an array element, one
// can specify the 'index' parameter when invoking the get() function.
//
// Example:
//      var index = 0;    // 1st element
//      var e = dev.TX.get('LOGICAL_INPUTS_LABELS', {index: index});
//
//      > e == "AIL"
//
//
// Some elements are arrays of structures. In order facilitate retrieving
// just one element of the array, the parent of the element can pass an
// offset to the element so that it accesses the correct array index.
//
// This is different from the 'index' parameter in a sense that 'index'
// describes the index of the elemement, while 'offset' relates to an
// index of parents of the element, without specifying any details.
//
// [It may have been better to implement something like XPath, but 'offset'
// was simple to implement and has the advantage that it is a single value
// that can be passed down a hierarchy. Each node in the hierarchy can add
// to 'offset' if it is an array itself.]
//
// Example:
//      var mu = dev.MODEL.getSchema()['MIXER_UNITS'];
//      var offset = 3 * mu.s;     // Offset of the 4th mixer unit
//
//      // Pass 'offset' to another module
//
//      // Access the MIXER_UNIT_SRC element of the 4th mixer_unit. The
//      // function blindly applies the offset it received; it doesn't have
//      // to know the hierarchy below it.
//      var s = dev.MODEL.get('MIXER_UNITS_SRC', {offset: offset});
//
//      > s == "RUD"
//
DBObject.prototype.get = function (key, options) {
    options = options || {offset: 0, index: undefined};

    this.validateInputs(key, options.index);

    // Convert index to an Integer to handle the case where a string
    // representation or a float was given
    // If index is 'null' then it will become NaN, which is what we check
    // during the rest of the code
    var index = parseInt(options.index);
    var offset = parseInt(options.offset);

    var self = this;
    var data = this.data;
    var config = this.getConfig();
    var schema = this.getSchema();
    var types = config.TYPES;
    var item = schema[key];
    var item_offset = item.o + offset;

    var result;

    // If we are dealing with an element with count=1 then we treat it
    // as if a single element update of element[0] was requested. This
    // simplifies further code.
    if (item.c === 1) {
        index = 0;
    }

    function getGetter(bytesPerElement, type) {
        var message;

        var getters = {
            'u': {
                1: Uint8Array,
                2: Uint16Array,
                4: Uint32Array
            },
            'i': {
                1: Int8Array,
                2: Int16Array,
                4: Int32Array
            }
        };

        if (! getters.hasOwnProperty(type)) {
            message = 'Invalid type ' + type;
            console.error(message);
            throw new DatabaseException(message);
        }

        if (! getters[type].hasOwnProperty(bytesPerElement)) {
            message = 'bytesPerElement is '+ bytesPerElement +
                ' but must be 1, 2 or 4';
            console.error(message);
            throw new DatabaseException(message);
        }

        return getters[type][bytesPerElement];
    }

    function getInteger() {
        var TypedArray = getGetter(item.s, item.t);
        return Array.from(new TypedArray(data.buffer, item_offset, item.c));
    }

    function getString() {
        var bytes = new Uint8Array(data.buffer, item_offset, item.c);
        return Utils.uint8array2string(bytes);
    }

    function getUUID() {
        var bytes = new Uint8Array(data.buffer, item_offset, item.c);
        return Utils.uuid2string(bytes);
    }

    function getStructure() {
        if (Utils.isNumber(index)) {
            return new Uint8Array(data.buffer, item_offset + (item.s * index), item.s);
        }

        var result = [];
        for (var i = 0; i < item.c; i++) {
            result.push(new Uint8Array(data.buffer, item_offset + (i * item.s), item.s));
        }
        return result;
    }

    function getTypedItem() {
        if (! types.hasOwnProperty(item.t)) {
            var message = 'Schema type "' + item.t + '" for key "' +
                key + '" not defined';
            console.error(message);
            throw new DatabaseException(message);
        }

        var TypedArray = getGetter(item.s, 'i');
        var bytes = new TypedArray(data.buffer, item_offset, item.c);
        var result = [];
        for (var i = 0; i < bytes.length; i += 1) {
            var entry = bytes[i];
            var element = self.typeLookupByNumber(types[item.t], entry);

            result.push(element);
        }
        return result;
    }

    switch (item.t) {
        case 'u':
        case 'i':
            result = getInteger();
            break;

        case 'c':
            return getString();

        case 'uuid':
            return getUUID();

        case 's':
            // Note: Function is already optimized to return a single
            // element if an index is requested!
            return getStructure();

        default:
            result = getTypedItem();
            break;
    }

    if (Utils.isNumber(index)) {
        return result[index];
    }
    return result;
};


// Set a new value for an element in the database entry.
//
// For a detailed parameter description please refer to the DBObject.get()
// function.
//
// The set() function expects value to be in the same format as it is
// returned by the get() function.
//
// Note that writing an element of type s' (C structure) is not supported.
//
// Every time a value is set, the LAST_CHANGED element is updated as well.
DBObject.prototype.set = function (key, value, options) {
    options = options || {offset: 0, index: undefined};

    this.validateInputs(key, options.index);

    // Convert index to an Integer to handle the case where a string
    // representation or a float was given
    // If index is 'null' then it will become NaN, which is what we check
    // during the rest of the code
    var index = parseInt(options.index);
    var offset = parseInt(options.offset);

    var message;
    var self = this;
    var data = this.data;
    var config = this.getConfig();
    var schema = this.getSchema();
    var types = config.TYPES;
    var item = schema[key];
    var item_offset = item.o + offset;

    // If we are dealing with an element with count=1 then we treat it
    // as if a single element update of element[0] was requested. This
    // simplifies further code.
    if (item.c === 1) {
        index = 0;
    }

    if (!Utils.isNumber(index)) {
        var ignore = ['c', 'uuid'];

        // indexOf is >=0 when item is found
        // http://stackoverflow.com/questions/7378228/check-if-an-element-is-present-in-an-array
        if (ignore.indexOf(item.t) < 0) {
            if (value.length !== item.c) {
                message = '' + key + ' requires ' + item.c +
                    ' elements but ' + value.length + ' provided';
                console.error(message);
                throw new DatabaseException(message);
            }
        }
    }

    function getSetter(bytesPerElement, type) {
        var setters = {
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

        if (! setters.hasOwnProperty(type)) {
            message = 'Invalid type ' + type;
            console.error(message);
            throw new DatabaseException(message);
        }

        if (! setters[type].hasOwnProperty(bytesPerElement)) {
            message = 'bytesPerElement is '+ bytesPerElement +
                ' but must be 1, 2 or 4';
            console.error(message);
            throw new DatabaseException(message);
        }

        return setters[type][bytesPerElement];
    }

    // This function logs metadata of all changes to the database.
    // Whenever a value is set, its uuid, offset and size are recorded.
    //
    // This will enable differential updates when connected to a
    // transmitter.
    function storageLogger(offset, count) {
        // schema.o describes the offset within the overall configuration
        console.log(self.uuid + ' changed: offset=' + offset + ' count=' +
            count + ' config-offset=' + (offset + schema.o));

        // Add last change time stamp
        if (key !== 'LAST_CHANGED'  &&  schema.hasOwnProperty('LAST_CHANGED')) {
            var now = parseInt(Date.now() / 1000);
            var lc = schema.LAST_CHANGED;
            var setter = getSetter(lc.s, lc.t);
            var dv = new DataView(data.buffer, lc.o , lc.s);
            setter.apply(dv, [0, now, true]);

            console.log(self.uuid + ' changed: offset=' + lc.o + ' count=' +
                lc.s + ' config-offset=' + (lc.o + schema.o));

            self.lastChanged = now;
        }

        Database.setEntry(self, function (result) {
            console.log('Database updated', result);
        });
    }

    function storeArray(values, setter) {
        setter = setter || DataView.prototype.setUint8;

        var count = item.c * item.s;
        var dv = new DataView(data.buffer, item_offset, count);

        for (var i = 0; i < item.c; i++) {
            var byteOffset = i * item.s;
            setter.apply(dv, [byteOffset, values[i], true]);
        }

        storageLogger(item_offset, count);
    }

    function storeScalar(value, index, setter) {
        setter = setter || DataView.prototype.setUint8;

        var dv = new DataView(data.buffer, item_offset, item.c * item.s);
        var byteOffset = index * item.s;
        setter.apply(dv, [byteOffset, value, true]);

        storageLogger(item_offset + byteOffset, item.s);
    }

    function setString() {
        var bytes = Utils.string2uint8array(value, item.c);
        storeArray(bytes);
    }

    function setUUID() {
        var bytes = Utils.string2uuid(value, item.c);
        storeArray(bytes);
    }

    function setInteger() {
        var setter = getSetter(item.s, item.t);
        if (Utils.isNumber(index)) {
            storeScalar(value, index, setter);
        }
        else {
            storeArray(value, setter);
        }
    }

    function setTypedItem() {
        function type2number(value) {
            var type = types[item.t];

            if (! type.hasOwnProperty(value)) {
                if (Utils.isNumber(value)) {
                    return value;
                }

                var message = 'Key ' + value + ' is not in type ' + item.t;
                console.error(message);
                throw new DatabaseException(message);
            }
            return type[value];
        }

        // C enums can be either signed or unsigned, depending on what the
        // compiler choses.
        //
        // http://stackoverflow.com/questions/159034/are-c-enums-signed-or-unsigned
        //
        // The GCC documentation says:
        //      -fshort-enums
        //      Allocate to an enum type only as many bytes as it needs for the
        //      declared range of possible values. Specifically, the enum type
        //      is equivalent to the smallest *integer* type that has enough room.
        //
        // While we are not using -fshort-enums, GCC for ARM still uses a
        // int8_t for small enums. So small enum can go from -128 to
        // 127; once the value is 128 or greater GCC uses an int16_t.
        var numeric_value;
        var setter = getSetter(item.s, 'i');
        if (Utils.isNumber(index)) {
            numeric_value = type2number(value);
            storeScalar(numeric_value, index, setter);
        }
        else {
            var numeric_values = [];
            for (var i = 0; i < item.c; i += 1) {
                numeric_value = type2number(value[i]);
                numeric_values.push(numeric_value);
            }
            storeArray(numeric_values, setter);
        }
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
            message = 'Key ' + key + ': Writing a structure is not supported';
            console.error(message);
            throw new DatabaseException(message);

        case 'uuid':
            setUUID();
            break;

        default:
            if (types.hasOwnProperty(item.t)) {
                setTypedItem();
            }
            else {
                message = 'Schema type "' + item.t + '" for key "' +
                    key + '" not defined';
                console.error(message);
                throw new DatabaseException(message);
            }
            break;
    }
};





// Load a new object into the existing DBObject.
//
// FIXME: TEST FUNCTION! TO BE REMOVED!
//
// data: Array of bytes that hold the data to store.
// config: The configuration entry in CONFIG_VERSIONS[] that descrones the
//         data.
// schema: Either config.MODEL or config.TX to indicate whether the entry
//         is for a model or a transmitter.
//
// Example:
//      modeldata = new Uint8Array(...);
//      txdata = new Uint8Array(...);
//      config = CONFIG_VERSIONS[1];
//      DBObject.add(modeldata, config, config.MODEL);
//      DBObject.add(txdata, config, config.TX);
//
// DBObject.prototype.load = function (data, configVersion, schemaName) {
//     var config = CONFIG_VERSIONS[configVersion];
//     var schema = config[schemaName];

//     var uuid_bytes = new Uint8Array(data, schema['UUID'].o, schema['UUID'].s);
//     var uuid = Utils.uuid2string(uuid_bytes);


//     this.uuid = uuid;
//     this.data = data;
//     this.configVersion = configVersion;
//     this.schemaName = schemaName;
//     this.lastChanged = 0;

//     console.log('Database(): Loaded entry with UUID=' + this.uuid);
// };


//
// FIXME: TEST FUNCTION! TO BE REMOVED!
//
// DBObject.prototype.loadObject = function (dbObject) {
//     this.uuid = dbObject.uuid;
//     this.data = dbObject.data;
//     this.configVersion = dbObject.configVersion;
//     this.schemaName = dbObject.schemaName;
//     this.lastChanged = dbObject.lastChanged;

//     console.log('Database(): Loaded entry with UUID=' + this.uuid +
//         ' from IndexedDB');
// };


// Add a test model and transmitter to the database
// (function () {
//     'use strict';

//     // NOTE: the version element is always at offset 0 regardles of the config version!
//     var configVersion = new Uint32Array(TEST_CONFIG_DATA.buffer, 0, 1)[0];
//     var config = CONFIG_VERSIONS[configVersion];

//     dev.MODEL = new DBObject();
//     dev.TX = new DBObject();

//     dev.MODEL.load(TEST_CONFIG_DATA.slice(config.MODEL.o, config.MODEL.o + config.MODEL.s), configVersion, 'MODEL');
//     dev.TX.load(TEST_CONFIG_DATA.slice(config.TX.o, config.TX.o + config.TX.s), configVersion, 'TX');
// })();

module.exports = DBObject;
