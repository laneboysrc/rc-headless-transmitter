'use strict';

var Utils = require('./utils');


function getGetter(bytesPerElement, type) {
  const getters = {
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
    let message = `Invalid type ${type}`;
    console.error(message);
    throw new Error(message);
  }

  if (! getters[type].hasOwnProperty(bytesPerElement)) {
    let message = `bytesPerElement is ${bytesPerElement} but must be 1, 2 or 4`;
    console.error(message);
    throw new Error(message);
  }

  return getters[type][bytesPerElement];
}

function getSetter(bytesPerElement, type) {
  const setters = {
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
    let message = `Invalid type ${type}`;
    console.error(message);
    throw new Error(message);
  }

  if (! setters[type].hasOwnProperty(bytesPerElement)) {
    let message = `bytesPerElement is ${bytesPerElement} but must be 1, 2 or 4`;
    console.error(message);
    throw new Error(message);
  }

  return setters[type][bytesPerElement];
}


// DatabaseObject: Object representation of transmitter and model configuration
//
// IndexedDB is a Object database: instead of rows/columns like traditional
// relational databases it stores 'objects'. The DatabaseObject represents one
// of these objects in database that holds model or transmitter data.
class DatabaseObject {
  constructor(data) {
    this.uuid = data.uuid;
    this.data = data.data;
    this.configVersion = data.configVersion;
    this.schemaName = data.schemaName;
    this.lastChanged = data.lastChanged;

    // If we are dealing with a transmitter, we create a type named x_pin_name_t
    // so that the UI does not have to resolve the pin names manually.
    //
    // Since there is only one global config holding the schema, this means we
    // are performing a hack here, modifying the global config object every
    // time a transmitter DBObject is created.
    // This means we can only use one transmitter DBObject at a time, which
    // is fine for the current application.
    // If that ever becomes an issue we need to attach (clone) the schema to the
    // DBOBject.
    if (this.schemaName === 'TX') {
      let customType = 'x_pin_name_t';

      let config = this.getConfig();
      let schema = this.getSchema();

      let hwi = schema.HARDWARE_INPUTS;
      let xPinNameT = {};
      for (let i = 0; i < hwi.c; i++) {
        let offset = hwi.s* i;
        let type = this.getItem('HARDWARE_INPUTS_PCB_INPUT_TYPE', {offset: offset});
        if (type === 0) {
          continue;
        }

        let pinName = this.getItem('HARDWARE_INPUTS_PCB_INPUT_PIN_NAME', {offset: offset});
        xPinNameT[pinName] = i;
      }

      config.TYPES[customType] = xPinNameT;
      schema.LOGICAL_INPUTS_HARDWARE_INPUTS.t = customType;
    }
  }

  // This function performs basic checks on the most common inputs to
  // many of the database function.
  //
  // In case an issue is found a console.error() message is written and a
  // Error() is thrown.
  validateInputs(key, index) {
    let message;
    const schema = this.getSchema();

    if (key  &&  !schema.hasOwnProperty(key)) {
      message = `Key "${key}" not in schema.`;
      console.error(message);
      throw new Error(message);
    }

    if (typeof index !== 'undefined') {
      if (! Utils.isNumber(index)) {
        message = `Index "${index}" is not an Integer`;
        console.error(message);
        throw new Error(message);
      }

      const item = schema[key];

      // Convert index to an Integer to handle the case where a string
      // representation or a float was given
      index = parseInt(index);

      if (index < 0  ||  index >= item.c) {
        message = `Requested index "${index}" for key "${key}" but item ` +
          `contains only ${item.c} elements`;
        console.error(message);
        throw new Error(message);
      }
    }
  }

  // Translates a value that corresponds to type (which corresponds to a C
  // enumeration) into the human readable name. If the value is not in the
  // type then the value is returned verbatim.
  typeLookupByNumber(type, value) {
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
  }

  // Returns the configuration of the database entry.
  // The configuration is the metadata for the uuid contents. It holds the
  // MODEL and TX schemas as well as the TYPES (enumeration values used in
  // the schema)
  getConfig() {
    return CONFIG_VERSIONS[this.configVersion];
  }

  // Returns the schema of a database entry. The schema describes the
  // structure of the database entry, i.e. which elements it has.
  getSchema() {
    return this.getConfig()[this.schemaName];
  }

  // Return the type of a particular entry in the schema.
  // The type can be one of the following:
  //  u': unsigned integer
  //      'i': signed integer
  //      'c': string (Note: may not be 0 terminated if it fills the element)
  //      'uuid': 64-bit (7 bytes) universally unique identifier
  //      <any other value>: refers to named elements in this.config.TYPES[],
  //          which correspond to enums in the firmware.
  //
  // Example:
  //      var type = Device.TX.getType('HARDWARE_INPUTS_CALIBRATION');
  //
  //      > type == 'u' because the HARDWARE_INPUTS_CALIBRATION is an array
  //                    of three uint16_t values in the firmware.
  //
  getType(key) {
    this.validateInputs(key);
    return this.getSchema()[key].t;
  }

  // Obtains the type (corresponds to C enum) for 'key' and returns the value
  // for named element 'value' in that type.
  //
  // Example:
  //      var n = Device.MODEL.getNumberOfTypeMember('MIXER_UNITS_DST', 'CH7');
  //
  //      > n == 6 as the enum in the firmware is CH1=0, CH2, CH3 ...
  //
  getNumberOfTypeMember(key, value) {
    this.validateInputs(key);

    if (Utils.isNumber(value)) {
      return value;
    }

    const config = this.getConfig();
    const type = this.getSchema()[key].t;
    return config.TYPES[type][value];
  }


  // Returns a list of all members of a given type (C enum)
  //
  // Example:
  //      var m = Device.MODEL.getTypeMembers('interpolation_type_t');
  //
  //      > Array [ "Linear", "Smoothing" ]
  //
  getTypeMembers(type) {
    const config = this.getConfig();
    return Object.keys(config.TYPES[type]);
  }

  // Return a human-friendly text representation of the given item.
  // This is stored in the [key].h field of the schema, which is optional.
  // If we can't access the [key].h field we return the key name.
  //
  // Example:
  //      var n = Device.MODEL.getHumanFriendlyText('MIXER_UNITS_SW_CMP');
  //
  //      > n == "Comparison"
  //
  getHumanFriendlyText(key) {
    this.validateInputs(key);

    const schema = this.getSchema();

    if (schema[key].hasOwnProperty('h')) {
      return schema[key].h;
    }

    return key;
  }

  //
  getItemNumber(key, options) {
    let item = this.getItem(key, options);

    if (Utils.isArray(item)) {
      return item.map(i => {
        return this.getNumberOfTypeMember(key, i);
      });
    }

    return this.getNumberOfTypeMember(key, item);
  }

  // Retrieve an element from the database entry.
  // The element to retrieve is passed in 'key'.
  //
  // Example:
  //      var ms = Device.TX.getItem('BIND_TIMEOUT_MS');
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
  //      var rf = Device.MODEL.getItem('RF_PROTOCOL_TYPE');
  //
  //      > rf == "HobbyKing HKR3000", which is the string representation
  //              of the value 0 for the 'rf_protocol_t' enum in the firmware.
  //
  // If the requested element is an array then by default all array elements
  // are returned.
  //
  // Example:
  //      var l = Device.TX.getItem('LOGICAL_INPUTS_LABELS');
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
  //      var e = Device.TX.getItem('LOGICAL_INPUTS_LABELS', {index: index});
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
  //      var mu = Device.MODEL.getSchema()['MIXER_UNITS'];
  //      var offset = 3 * mu.s;     // Offset of the 4th mixer unit
  //
  //      // Pass 'offset' to another module
  //
  //      // Access the MIXER_UNIT_SRC element of the 4th mixer_unit. The
  //      // function blindly applies the offset it received; it doesn't have
  //      // to know the hierarchy below it.
  //      var s = Device.MODEL.getItem('MIXER_UNITS_SRC', {offset: offset});
  //
  //      > s == "RUD"
  //
  getItem(key, options) {
    options = options || {offset: 0, index: undefined};

    this.validateInputs(key, options.index);

    // Convert index to an Integer to handle the case where a string
    // representation or a float was given
    // If index is 'null' then it will become NaN, which is what we check
    // during the rest of the code
    var index = parseInt(options.index);
    var offset = parseInt(options.offset);

    if (!Utils.isNumber(offset)) {
      offset = 0;
    }

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

    function getInteger() {
      let TypedArray = getGetter(item.s, item.t);
      return Array.from(new TypedArray(data.buffer, item_offset, item.c));
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
        return new Uint8Array(data.buffer, item_offset + (item.s * index), item.s).slice();
      }

      let result = [];
      for (let i = 0; i < item.c; i++) {
        result.push(new Uint8Array(data.buffer, item_offset + (i * item.s), item.s).slice());
      }
      return result;
    }

    function getTypedItem() {
      if (! types.hasOwnProperty(item.t)) {
        let message = `Schema type "${item.t}" for key "${key}" not defined`;
        console.error(message);
        throw new Error(message);
      }

      let TypedArray = getGetter(item.s, 'i');
      let bytes = new TypedArray(data.buffer, item_offset, item.c);
      let result = [];
      for (let i = 0; i < bytes.length; i++) {
        let entry = bytes[i];
        let element = self.typeLookupByNumber(types[item.t], entry);

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
  }


  // Set a new value for an element in the database entry.
  //
  // For a detailed parameter description please refer to the DatabaseObject.getItem()
  // function.
  //
  // The set() function expects value to be in the same format as it is
  // returned by the get() function.
  //
  // Note that writing an element of type s' (C structure) is not supported.
  //
  // Every time a value is set, the LAST_CHANGED element is updated as well.
  setItem(key, value, options) {
    options = options || {offset: 0, index: undefined, preview: false};

    this.validateInputs(key, options.index);

    // Convert index to an Integer to handle the case where a string
    // representation or a float was given
    // If index is 'null' then it will become NaN, which is what we check
    // during the rest of the code
    var index = parseInt(options.index);
    var offset = parseInt(options.offset);
    var preview = Boolean(options.preview);

    if (!Utils.isNumber(offset)) {
      offset = 0;
    }

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
      const ignore = ['c', 'uuid'];

      // indexOf is >=0 when item is found
      // http://stackoverflow.com/questions/7378228/check-if-an-element-is-present-in-an-array
      if (ignore.indexOf(item.t) < 0) {
        if (value.length !== item.c) {
          let message = `${key} requires ${item.c} elements but ${value.length} provided`;
          console.error(message);
          throw new Error(message);
        }
      }
    }

    // This function logs metadata of all changes to the database.
    // Whenever a value is set, its uuid, offset and size are recorded.
    //
    // This will enable differential updates when connected to a
    // transmitter.
    function storageLogger(offset, count) {
      // schema.o describes the offset within the overall configuration
      console.log(`${self.uuid} changed: offset=${offset} count=${count} config-offset=${offset + schema.o}`);

      if (Device.connected) {
        Device.write(offset + schema.o, data.slice(offset, offset + count));
      }

      // If we are getting called with options.preview set to true, when
      // we bail out after sending the command to the connected device
      if (preview) {
        return;
      }

      // Add last change time stamp
      if (key !== 'LAST_CHANGED'  &&  schema.hasOwnProperty('LAST_CHANGED')) {
        let now = parseInt(Date.now() / 1000);
        let lc = schema.LAST_CHANGED;
        let setter = getSetter(lc.s, lc.t);
        let dv = new DataView(data.buffer, lc.o , lc.s);
        setter.apply(dv, [0, now, true]);

        console.log(`${self.uuid} changed: offset=${lc.o} count=${lc.s} config-offset=${lc.o + schema.o}`);

        if (Device.connected) {
          Device.write(lc.o + schema.o, data.slice(lc.o, lc.o + lc.s));
        }

        self.lastChanged = now;
      }

      Database.setEntry(self, function (result) {
        console.log('Database updated', result);
      });
    }

    function storeArray(values, setter) {
      setter = setter || DataView.prototype.setUint8;

      let count = item.c * item.s;
      let dv = new DataView(data.buffer, item_offset, count);

      for (let i = 0; i < item.c; i++) {
        let byteOffset = i * item.s;
        setter.apply(dv, [byteOffset, values[i], true]);
      }

      storageLogger(item_offset, count);
    }

    function storeScalar(value, index, setter) {
      setter = setter || DataView.prototype.setUint8;

      let dv = new DataView(data.buffer, item_offset, item.c * item.s);
      let byteOffset = index * item.s;
      setter.apply(dv, [byteOffset, value, true]);

      storageLogger(item_offset + byteOffset, item.s);
    }

    function storeStructureItem(value, index) {
        let count = item.s;
        let elementOffset = item_offset + (index * count);
        let dv = new DataView(data.buffer, elementOffset, count);

        for (let i = 0; i < count; i++) {
          dv.setUint8(i, value[i], true);
        }
        storageLogger(elementOffset, count);
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
      const setter = getSetter(item.s, item.t);
      if (Utils.isNumber(index)) {
        storeScalar(value, index, setter);
      }
      else {
        storeArray(value, setter);
      }
    }

    function setTypedItem() {
      function type2number(value) {
        const type = types[item.t];

        if (! type.hasOwnProperty(value)) {
          if (Utils.isNumber(value)) {
            return value;
          }

          let message = `Key ${value} is not in type ${item.t}`;
          console.error(message);
          throw new Error(message);
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
      let numeric_value;
      const setter = getSetter(item.s, 'i');
      if (Utils.isNumber(index)) {
        numeric_value = type2number(value);
        storeScalar(numeric_value, index, setter);
      }
      else {
        let numeric_values = [];
        for (let i = 0; i < item.c; i++) {
          numeric_value = type2number(value[i]);
          numeric_values.push(numeric_value);
        }
        storeArray(numeric_values, setter);
      }
    }

    function setStructure() {
      if (Utils.isNumber(index)) {
        storeStructureItem(value, index);
        return;
      }

      for (let i = 0; i < item.c; i++) {
        storeStructureItem(value[i], i);
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
        setStructure();
        break;

      case 'uuid':
        setUUID();
        break;

      default:
        if (types.hasOwnProperty(item.t)) {
          setTypedItem();
        }
        else {
          let message = `Schema type "${item.t}" for key "${key}" not defined`;
          console.error(message);
          throw new Error(message);
        }
        break;
    }
  }

  // Raw copy of bytes within the memory of the DBObject
  //
  // This method allows to copy a raw block of memory within the DBObject.
  // It is useful for optimizing list operations: The list of mixer units
  // needs to be organized in such a way that all used mixer units are
  // in front of the list, and the empty (unused) mixer units at the end
  // of the list. If we delete a mixer unit, we therefore need to move the
  // remaining mixer units foward by one. Using the getItem and setItem API
  // would mean that we would execute a lot of write operations to the
  // Headless TX.
  //
  // If we use this raw copy operation, which of course must be implemented
  // in the Headless TX firmware as well, then we can reduce these multiple
  // write commands to COPY + WRITE (make last mixer unit an empty one)
  //
  // Of course the raw copy command has the potential to completely destroy
  // the configuration, so great care must be taken with using it.
  //
  rawCopy(srcOffset, dstOffset, count) {
    if (count <= 0) {
      return;
    }

    let schema = this.getSchema();

    let copy = this.data.slice(srcOffset, srcOffset + count);
    this.data.set(copy, dstOffset);

    console.log(`${this.uuid} changed: copied src=${srcOffset} to dst=${dstOffset}, count=${count} config-srcOffset=${srcOffset + schema.o}`);

    if (Device.connected) {
      Device.copy(srcOffset + schema.o, dstOffset + schema.o, count);
    }

    // Add last change time stamp
    if (schema.hasOwnProperty('LAST_CHANGED')) {
      let now = parseInt(Date.now() / 1000);
      let lc = schema.LAST_CHANGED;
      let setter = getSetter(lc.s, lc.t);
      let dv = new DataView(this.data.buffer, lc.o , lc.s);
      setter.apply(dv, [0, now, true]);

      console.log(`${this.uuid} changed: offset=${lc.o} count=${lc.s} config-offset=${lc.o + schema.o}`);

      if (Device.connected) {
        Device.write(lc.o + schema.o, this.data.slice(lc.o, lc.o + lc.s));
      }

      this.lastChanged = now;
    }

    Database.setEntry(this, function (result) {
      console.log('Database updated', result);
    });
  }
}

module.exports = DatabaseObject;
