(function () {
    'use strict';

    var Database = function Database(uuid, offset=0) {
        this.data = {};
    };
    window['Database'] = new Database();


    // Custom database exception
    function DatabaseException(message) {
        this.name = "DatabaseException";
        this.message = message;
    }


    // Add a new entry to the database. The entry can be either model data
    // or transmitter data.
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
    //      Database.add(modeldata, config, config.MODEL);
    //      Database.add(txdata, config, config.TX);
    //
    Database.prototype.add = function (data, config, schema) {
        var uuid_bytes = new Uint8Array(data, schema['UUID'].o, schema['UUID'].s);
        var uuid = Utils.uuid2string(uuid_bytes);

        console.log('Database(): New entry with UUID=' + uuid);

        this.data[uuid] = {
            data: data,
            schema: schema,
            config: config
        };
    };


    // This function performs basic checks on the most common inputs to
    // many of the database function.
    //
    // In case an issue is found a console.error() message is written and a
    // DatabaseException() is thrown.
    Database.prototype.validateInputs = function (uuid, key=null, index=null) {
        //
        if (! this.data.hasOwnProperty(uuid)) {
            let message = 'uuid "' + uuid + '" not in database.';
            console.error(message);
            throw new DatabaseException(message);
        }

        var schema = this.data[uuid].schema;

        if (key  &&  !schema.hasOwnProperty(key)) {
            let message = 'Key "' + key + '" not in schema.';
            console.error(message);
            throw new DatabaseException(message);
        }

        if (index !== null) {
            if (! Utils.isNumber(index)) {
                let message = 'Index "' + index + '" is not an Integer';
                console.error(message);
                throw new DatabaseException(message);
            }

            var  item = schema[key];

            // Convert index to an Integer to handle the case where a string
            // representation or a float was given
            index = parseInt(index);

            if (index < 0  ||  index >= item.c) {
                let message = 'Requested index "' + index + '" for key "' + key +
                    '" but item contains only ' + item.c + ' elements';
                console.error(message);
                throw new DatabaseException(message);
            }
        }
    };


    // Translates a value that corresponds to type (which corresponds to a C
    // enumeration) into the human readable name. If the value is not in the
    // type then the value is returned verbatim.
    Database.prototype.typeLookupByNumber = function (type, value) {
        if (type) {
            for (let n in type) {
                if (type.hasOwnProperty(n)) {
                    if (value === type[n]) {
                        return n;
                    }
                }
            }
        }

        return value;
    };


    // Return a list of all uuids in the database.
    // The list can be narrowed down to models or transmitters by passing
    // 'MODEL' or 'TX'
    //
    // Example:
    //      var list_of_uuids_of_all_models = Database.list('MODEL');
    //
    Database.prototype.list = function (schema=null) {
        if (schema) {
            var result = [];
            for (let uuid in this.data) {
                if (this.data.hasOwnProperty(uuid)) {
                    if (this.data[uuid].schema.t === schema) {
                        result.push(uuid);
                    }
                }
            }

            return result;
        }

        return Object.keys(this.data);
    };


    // Returns the configuration for a given uuid.
    // The configuration is the metadata for the uuid contents. It holds the
    // MODEL and TX schemas as well as the TYPES (enumeration values used in
    // the schema)
    Database.prototype.getConfig = function (uuid) {
        this.validateInputs(uuid);
        return this.data[uuid].config;
    };


    // Returns the schema of a database entry. The schema describes the
    // structure of the database entry, i.e. which elements it has.
    Database.prototype.getSchema = function (uuid) {
        this.validateInputs(uuid);
        return this.data[uuid].schema;
    };


    // Return the type of a particulare entry in the schema.
    // The type can be one of the following:
    //  u': unsigned integer
    //      'i': signed integer
    //      'c': string (Note: may not be 0 terminated if it fills the element)
    //      'uuid': 128-bit (16 bytes) universally unique identifier
    //      <any other value>: refers to named elements in this.config.TYPES[],
    //          which correspond to enums in the firmware.
    //
    // Example:
    //      var uuid = '43538fe8-44c9-11e6-9f17-af7be9c4479e';
    //      var type = Database.getType(uuid, 'HARDWARE_INPUTS_CALIBRATION');
    //
    //      > type == 'u' because the HARDWARE_INPUTS_CALIBRATION is an array
    //                    of three uint16_t values in the firmware.
    //
    Database.prototype.getType = function (uuid, key) {
        this.validateInputs(uuid, key);
        return this.data[uuid].schema[key].t;
    };


    // Obtains the type (corresponds to C enum) for 'key' and returns the value
    // for named element 'value' in that type.
    //
    // Example:
    //      var uuid = 'c91cabaa-44c9-11e6-9bc2-03ac25e30b5b';
    //      var n = Database.getNumberOfTypeMember(uuid, 'MIXER_UNITS_DST', 'CH7');
    //
    //      > n == 6 as the enum in the firmware is CH1=0, CH2, CH3 ...
    //
    Database.prototype.getNumberOfTypeMember = function (uuid, key, value) {
        this.validateInputs(uuid, key);
        var type = this.data[uuid].schema[key].t;
        return this.data[uuid].config.TYPES[type][value];
    };


    // Returns a list of all members of a given type (C enum)
    //
    // Example:
    //      var uuid = 'c91cabaa-44c9-11e6-9bc2-03ac25e30b5b';
    //      var m = Database.getTypeMembers(uuid, 'interpolation_type_t');
    //
    //      > Array [ "Linear", "Smoothing" ]
    //
    Database.prototype.getTypeMembers = function (uuid, type) {
        this.validateInputs(uuid);
        return Object.keys(this.data[uuid].config.TYPES[type]);
    };


    // Return a human-friendly text representation of the given item.
    // This is stored in the [key].h field of the schema, which is optional.
    // If we can't access the [key].h field we return the key name.
    //
    // Example:
    //      var uuid = 'c91cabaa-44c9-11e6-9bc2-03ac25e30b5b';
    //      var n = Database.getHumanFriendlyText(uuid, 'MIXER_UNITS_SW_CMP');
    //
    //      > n == "Comparison"
    //
    Database.prototype.getHumanFriendlyText = function (uuid, key) {
        this.validateInputs(uuid, key);

        var schema = this.getSchema(uuid);

        if (schema[key].hasOwnProperty('h')) {
            return schema[key].h;
        }

        return key;
    };


    // Retrieve an element from a model or transmitter entry in the database.
    //
    // The entry is referenced by 'uuid'. The element to retrieve is passed in
    // 'key'.
    //
    // Example:
    //      var uuid = '43538fe8-44c9-11e6-9f17-af7be9c4479e';
    //      var ms = Database.get(uuid, 'BIND_TIMEOUT_MS');
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
    //      var uuid = 'c91cabaa-44c9-11e6-9bc2-03ac25e30b5b';
    //      var rf = Database.get(uuid, 'RF_PROTOCOL_TYPE');
    //
    //      > rf == "HobbyKing HKR3000", which is the string representation
    //              of the value 0 for the 'rf_protocol_t' enum in the firmware.
    //
    // If the requested element is an array then by default all array elements
    // are returned.
    //
    // Example:
    //      var uuid = '43538fe8-44c9-11e6-9f17-af7be9c4479e';
    //      var l = Database.get(uuid, 'LOGICAL_INPUTS_LABELS');
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
    //      var uuid = '43538fe8-44c9-11e6-9f17-af7be9c4479e';
    //      var offset = 0;   // No offset, see below for description
    //      var index = 0;    // 1st element
    //      var e = Database.get(uuid, 'LOGICAL_INPUTS_LABELS', offset, index);
    //
    //      > e == "AIL"
    //
    //
    // Some elements are arrays of structures. In order facilitate retrieving
    // an element within an array of a structure, the parent of the element
    // can pass an offset to the element so that it accesses the correct
    // array index.
    // This is different from the 'index' parameter in a sense that 'index'
    // describes the index of the elemement, while 'offset' relates to an
    // indexes of parents of the element, without specifying any details.
    //
    // [It may have been better to implement something like XPath, but 'offset'
    // was simple to implement and has the advantage that it is a single value
    // thatcan be passed down a hierarchy. Each node in the hierarchy can add
    // to offset if it is an array itself.]
    //
    // Example:
    //      var uuid = 'c91cabaa-44c9-11e6-9bc2-03ac25e30b5b';
    //      var mu = Database.getSchema(uuid)['MIXER_UNITS'];
    //      var offset = 3 * mu.s;     // Offset of the 4th mixer unit
    //
    //      // Pass 'offset' to another module
    //
    //      // Access the MIXER_UNIT_SRC element of the 4th mixer_unit. The
    //      // function blindly applies the offset it received; it doesn't have
    //      // to know the hierarchy below it.
    //      var s = Database.get(uuid, 'MIXER_UNITS_SRC', offset);
    //
    //      > s == "RUD"
    //
    Database.prototype.get = function (uuid, key, offset=0, index=null) {
        this.validateInputs(uuid, key, index);

        // Convert index to an Integer to handle the case where a string
        // representation or a float was given
        // If index is 'null' then it will become NaN, which is what we check
        // during the rest of the code
        index = parseInt(index);
        offset = parseInt(offset);

        var data = this.data[uuid].data;
        var schema = this.data[uuid].schema;
        var types = this.data[uuid].config.TYPES;
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
                let message = 'Invalid type ' + type;
                console.error(message);
                throw new DatabaseException(message);
            }

            if (! getters[type].hasOwnProperty(bytesPerElement)) {
                let message = 'bytesPerElement is '+ bytesPerElement +
                    ' but must be 1, 2 or 4';
                console.error(message);
                throw new DatabaseException(message);
            }

            return getters[type][bytesPerElement];
        }

        function getInteger() {
            let TypedArray = getGetter(item.s, item.t);
            return new TypedArray(data.buffer, item_offset, item.c);
        }

        function getString() {
            let bytes = new Uint8Array(data.buffer, item_offset, item.c);
            return Utils.uint8array2string(bytes);
        }

        function getUUID() {
            let bytes = new Uint8Array(data.buffer, item_offset, item.c);
            return Utils.uuid2string(bytes);
        }

        function getStructure() {
            if (Utils.isNumber(index)) {
                return new Uint8Array(data.buffer, item_offset + (item.s * index), item.s);
            }

            let result = [];
            for (let i = 0; i < item.c; i++) {
                result.push(new Uint8Array(data.buffer, item_offset + (i * item.s), item.s));
            }
            return result;
        }

        function getTypedItem() {
            if (! types.hasOwnProperty(item.t)) {
                let message = 'Schema type "' + item.t + '" for key "' +
                    key + '" not defined';
                console.error(message);
                throw new DatabaseException(message);
            }

            let TypedArray = getGetter(item.s, 'i');
            let bytes = new TypedArray(data.buffer, item_offset, item.c);
            let result = [];
            for (let n of bytes.entries()) {
                let entry = n[1];
                let element = window['Database'].typeLookupByNumber(types[item.t], entry);

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


    // Set a new value for a given element in the database.
    //
    // For a detailed parameter description please refer to the Database.get()
    // function.
    //
    // The set() function expects value to be in the same format as it is
    // returned by the get() function.
    //
    // Note that writing an element of type s' (C structure) is not supported.
    //
    // Every time a value is set, the LAST_CHANGED element is updated as well.
    Database.prototype.set = function (uuid, key, value, offset=0, index=null) {
        this.validateInputs(uuid, key, index);

        // Convert index to an Integer to handle the case where a string
        // representation or a float was given
        // If index is 'null' then it will become NaN, which is what we check
        // during the rest of the code
        index = parseInt(index);
        offset = parseInt(offset);

        var data = this.data[uuid].data;
        var schema = this.data[uuid].schema;
        var types = this.data[uuid].config.TYPES;
        var item = schema[key];
        var item_offset = item.o + offset;

        // If we are dealing with an element with count=1 then we treat it
        // as if a single element update of element[0] was requested. This
        // simplifies further code.
        if (item.c === 1) {
            index = 0;
        }

        if (!Utils.isNumber(index)) {
            let ignore = ['c', 'uuid'];

            // indexOf is >=0 when item is found
            // http://stackoverflow.com/questions/7378228/check-if-an-element-is-present-in-an-array
            if (ignore.indexOf(item.t) < 0) {
                if (value.length !== item.c) {
                    let message = '' + key + ' requires ' + item.c +
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
                let message = 'Invalid type ' + type;
                console.error(message);
                throw new DatabaseException(message);
            }

            if (! setters[type].hasOwnProperty(bytesPerElement)) {
                let message = 'bytesPerElement is '+ bytesPerElement +
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
            console.log(uuid + ' changed: offset=' + offset + ' count=' +
                count + ' config-offset=' + (offset + schema.o));

            // Add last change time stamp
            if (key !== 'LAST_CHANGED'  &&  schema.hasOwnProperty('LAST_CHANGED')) {
                let now = Date.now() / 1000;
                let lc = schema.LAST_CHANGED;
                let setter = getSetter(lc.s, lc.t);
                let dv = new DataView(data.buffer, lc.o , lc.s);
                setter.apply(dv, [0, now, true]);

                console.log(uuid + ' changed: offset=' + lc.o + ' count=' +
                    lc.s + ' config-offset=' + (lc.o + schema.o));
            }
        }

        function storeArray(values, setter=DataView.prototype.setUint8) {
            let count = item.c * item.s;
            let dv = new DataView(data.buffer, item_offset, count);

            for (let i = 0; i < item.c; i++) {
                let byteOffset = i * item.s;
                setter.apply(dv, [byteOffset, values[i], true]);
            }

            storageLogger(item_offset, count);
        }

        function storeScalar(value, index, setter=DataView.prototype.setUint8) {
            let dv = new DataView(data.buffer, item_offset, item.c * item.s);
            let byteOffset = index * item.s;
            setter.apply(dv, [byteOffset, value, true]);

            storageLogger(item_offset + byteOffset, item.s);
        }

        function setString() {
            let bytes = Utils.string2uint8array(value, item.c);
            storeArray(bytes);
        }

        function setUUID() {
            let bytes = Utils.string2uuid(value, item.c);
            storeArray(bytes);
        }

        function setInteger() {
            let setter = getSetter(item.s, item.t);
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

                    let message = 'Key ' + value + ' is not in type ' + item.t;
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

            var setter = getSetter(item.s, 'i');
            if (Utils.isNumber(index)) {
                let numeric_value = type2number(value);
                storeScalar(numeric_value, index, setter);
            }
            else {
                let numeric_values = [];
                for (let i = 0; i < item.c; i += 1) {
                    let numeric_value = type2number(value[i]);
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
                let message = 'Key ' + key + ': Writing a structure is not supported';
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
                    let message = 'Schema type "' + item.t + '" for key "' +
                        key + '" not defined';
                    console.error(message);
                    throw new DatabaseException(message);
                }
                break;
        }
    };
})();


// Add a test model and transmitter to the database
(function () {
    'use strict';

    // NOTE: the version element is always at offset 0 regardles of the config version!
    var config_version = new Uint32Array(TEST_CONFIG_DATA.buffer, 0, 1)[0];
    var config = CONFIG_VERSIONS[config_version];

    Database.add(TEST_CONFIG_DATA.slice(config.MODEL.o, config.MODEL.o + config.MODEL.s), config, config.MODEL);
    Database.add(TEST_CONFIG_DATA.slice(config.TX.o, config.TX.o + config.TX.s), config, config.TX);
})();

