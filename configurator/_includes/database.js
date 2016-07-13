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
    // CONFIG_VERSIONS[x].MODEL or CONFIG_VERSIONS[x].TX
    Database.prototype.list = function (schema=null) {
        if (schema) {
            let result = [];
            for (let uuid in this.data) {
                if (this.data[uuid].schema.t === schema) {
                    result.push(uuid);
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
    // structure of the content.
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
    // Example
    //      var uuid = '43538fe8-44c9-11e6-9f17-af7be9c4479e';
    //      var type = Database.getType(uuid, 'HARDWARE_INPUTS_CALIBRATION');
    //
    //      > type == 'u' because the HARDWARE_INPUTS_CALIBRATION is an array
    //                    of three uint16_t values in the firmware.
    Database.prototype.getType = function (uuid, key) {
        this.validateInputs(uuid, key);
        return this.data[uuid].schema[key].t;
    };


    Database.prototype.getNumberOfTypeMember = function (uuid, key, value) {
        this.validateInputs(uuid, key);
        var type = this.data[uuid].schema[key].t;
        return this.data[uuid].config.TYPES[type][value];
    };


    Database.prototype.getTypeMembers = function (uuid, type) {
        this.validateInputs(uuid);
        return Object.keys(this.data[uuid].config.TYPES[type]);
    };


    // Return a human-friendly text representation of the given item.
    // This is stored in the [key].h field of the schema, which is optional.
    // If we can't access the [key].h field we return the key name.
    Database.prototype.getHumanFriendlyText = function (uuid, key) {
        this.validateInputs(uuid, key);

        var schema = this.getSchema(uuid);

        if (schema[key].hasOwnProperty('h')) {
            return schema[key].h;
        }

        return key;
    };


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
        var bytes;
        var message;

        // If we are dealing with an element with count=1 then we treat it
        // as if a single element update of element[0] was requested. This
        // simplifies further code.
        if (item.c === 1) {
            index = 0;
        }

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
                        message = '"unsigned" schema size not ' +
                            '1, 2 or 4 for key "' + key + '"';
                        console.error(message);
                        throw new DatabaseException(message);
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
                        message = '"signed int" schema size not ' +
                            '1, 2 or 4 for key "' + key + '"';
                        console.error(message);
                        throw new DatabaseException(message);
                }
                break;

            case 'c':
                bytes = new Uint8Array(data.buffer, item_offset, item.c);
                return Utils.uint8array2string(bytes);

            case 'uuid':
                bytes = new Uint8Array(data.buffer, item_offset, item.c);
                return Utils.uuid2string(bytes);

            case 's':
                if (Utils.isNumber(index)) {
                    return new Uint8Array(data.buffer, item_offset + (item.s * index), item.s);
                }

                result = [];
                for (let i = 0; i < item.c; i++) {
                    result.push(new Uint8Array(data.buffer, item_offset + (i * item.s), item.s));
                }
                break;

            default:
                if (! types.hasOwnProperty(item.t)) {
                    let message = 'Schema type "' + item.t + '" for key "' +
                        key + '" not defined';
                    console.error(message);
                    throw new DatabaseException(message);
                }

                // FIXME: this may not be Int8 but Int16 or Int32!
                bytes = new Int8Array(data.buffer, item_offset, item.s * item.c);
                result = [];
                for (let n of bytes.entries()) {
                    let entry = n[1];
                    let element = this.typeLookupByNumber(types[item.t], entry);

                    result.push(element);
                }
        }

        if (Utils.isNumber(index)) {
            return result[index];
        }
        return result;
    };


    Database.prototype.set = function (uuid, key, value, offset=0, index=null) {
        this.validateInputs(uuid, key, index);

        // Convert index to an Integer to handle the case where a string
        // representation or a float was given
        // If index is 'null' then it will become NaN, which is what we check
        // during the rest of the code
        index = parseInt(index);
        offset = parseInt(offset);

        let data = this.data[uuid].data;
        let schema = this.data[uuid].schema;
        let types = this.data[uuid].config.TYPES;
        let item = schema[key];
        let item_offset = item.o + offset;

        // If we are dealing with an element with count=1 then we treat it
        // as if a single element update of element[0] was requested. This
        // simplifies further code.
        if (item.c === 1) {
            index = 0;
        }

        if (!Utils.isNumber(index)) {
            if (! (item.t in {'c':1, 'uuid':1})) {
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

        function storageLogger(offset, count) {
            // schema.o describes the offset within the overall configuration
            console.warn(uuid + ' changed: offset=' + offset + ' count=' + count +
                ' config-offset=' + (offset + schema.o));

            // Add last change time stamp
            if (key !== 'LAST_CHANGED'  &&  'LAST_CHANGED' in schema) {

                // Ok... We are calling ourselves here recursively. This only works
                // because storageLogger is basically the last function called
                // in set(); because the recursive call destroys the variables
                // all the local functions rely on.

                // This will overflow in the year 2106 ...
                window['Database'].set(uuid, 'LAST_CHANGED', Date.now() / 1000);


                // Alternative function in case the recursive call gives us
                // issues. Not tested yet.

                // let last_changed_offset = schema.LAST_CHANGED.o;
                // let last_changed_count = schema.LAST_CHANGED.s;

                // let setter = getSetter(schema.LAST_CHANGED.s, schema.LAST_CHANGED.t);

                // let dv = new DataView(data.buffer, last_changed_offset , last_changed_count);
                // setter.apply(dv, [0, Date.now() / 1000, true]);

                // console.warn(uuid + ' changed: offset=' + last_changed_offset
                //     + ' count=' + last_changed_count
                //     + ' config-offset=' + (last_changed_offset + schema.o));
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

                if (! (value in type)) {
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
                if (item.t in types) {
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

