// ****************************************************************************
// Database tests
(function () {
    'use strict';

    if (1) {
        return;
    }

    var config = CONFIG_VERSIONS[1];

    var model_uuid = Database.list('MODEL')[0];
    var tx_uuid = Database.list('TX')[0];


    var testGet = function (uuid, item, offset=0, index=null) {
        var value;

        try {
            value = Database.get(uuid, item, offset, index);
        }
        catch (e) {
            if (e.hasOwnProperty('name') && e.name === 'DatabaseException') {
                return;
            }
            console.error(e);
            return;
        }

        var device = uuid;
        if (uuid === model_uuid) { device = 'MODEL'; }
        if (uuid === tx_uuid)    { device = 'TX'; }

        console.log(device + '.' + item + ': ', value);
    };


    var testSet = function (uuid, item, new_value, offset=0, index=null) {
        console.log('Changing ' + item + ' to ' + new_value);
        var changed;

        try {
            Database.set(uuid, item, new_value, offset, index);
            changed = Database.get(uuid, item, offset, index);
        }
        catch (e) {
            if (e.hasOwnProperty('name') && e.name === 'DatabaseException') {
                return;
            }
            console.error(e);
            return;
        }

        // IMPORTANT: use  ==  and not  ===  as we need duck-typing!
        if (new_value == changed) {             // jshint ignore:line
            console.log('Ok');
            return;
        }

        if (typeof(changed) === 'object') {
            for (let i = 0; i < new_value.length; i += 1) {
                if (changed[i !== new_value[i]]) {
                    console.error('' + new_value + ' != ' + changed);
                    return;
                }
            }
            console.log('Ok');
            return;
        }

        console.error('' + new_value + ' != ' + changed);
    };

    console.log('\n#################################');
    console.log('MODEL=' + model_uuid + ' TX=' + tx_uuid);

    console.log('\nTests for Database.get()');
    console.log('------------------------');
    testGet(model_uuid, 'NAME');
    testGet(tx_uuid, 'NAME');
    testGet(tx_uuid, 'UUID');
    testGet(tx_uuid, 'BIND_TIMEOUT_MS');
    testGet(model_uuid, 'RF_PROTOCOL_HK310_ADDRESS');
    testGet(model_uuid, 'RF_PROTOCOL_HK310_ADDRESS', 0, 3);
    testGet(tx_uuid, 'HARDWARE_INPUTS_CALIBRATION', 2*config.TX.HARDWARE_INPUTS.s);
    testGet(tx_uuid, 'HARDWARE_INPUTS_PCB_INPUT_PIN_NAME', config.TX.HARDWARE_INPUTS.s);
    testGet(model_uuid, 'MIXER_UNITS_CURVE_TYPE');
    testGet(tx_uuid, 'LOGICAL_INPUTS_LABELS', 3*config.TX.LOGICAL_INPUTS.s);
    testGet(tx_uuid, 'LOGICAL_INPUTS_LABELS', 2*config.TX.LOGICAL_INPUTS.s, 1);
    testGet(model_uuid, 'MIXER_UNITS_SRC', 0);

    console.log('\nTests for Database.set()');
    console.log('------------------------');
    testSet(model_uuid, 'NAME', 'ChangedName');
    testSet(tx_uuid, 'UUID', 'cafebabe-dead-beef-1234-010203040506');
    testSet(tx_uuid, 'LED_PWM_PERCENT', '42');
    testSet(tx_uuid, 'BIND_TIMEOUT_MS', 1234);
    testSet(model_uuid, 'LIMITS_LIMIT_L', -42);
    testSet(tx_uuid, 'HARDWARE_INPUTS_CALIBRATION', [1234, 2345, 3456]);
    testSet(model_uuid, 'MIXER_UNITS_SRC', 'FLAPS');
    testSet(tx_uuid, 'LOGICAL_INPUTS_LABELS', 'GEAR', 0, 2);
    testSet(tx_uuid, 'LOGICAL_INPUTS_LABELS', ['ST-DR', 'RUD-DR', 'AIL-DR', 'ELE-DR', 0], 2*config.TX.LOGICAL_INPUTS.s);

    console.log('\nTests that should fail:');
    console.log('-----------------------');
    testGet('wrong-uuid', 'MIXER_UNITS_CURVE_TYPE');
    testGet(tx_uuid, 'MIXER_UNITS_CURVE_TYPE');
    testGet(tx_uuid, 'LOGICAL_INPUTS_LABELS', 3*config.TX.LOGICAL_INPUTS.s, 5);
    testGet(model_uuid, 'MIXER_UNITS', 0, 'three');
    testSet(tx_uuid, 'LOGICAL_INPUTS_LABELS', ['ST_DR', 'RUD_DR', 'AIL_DR', 'NONE'], 2*config.TX.LOGICAL_INPUTS.s);

    console.log('#################################\n');
})();
