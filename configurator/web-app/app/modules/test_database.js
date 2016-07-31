// ****************************************************************************
// Database tests
(function () {
    'use strict';

    if (1) {
        return;
    }

    var config = CONFIG_VERSIONS[1];


    var testGet = function (dbObject, item, options) {
        var value;

        try {
            value = dbObject.getItem(item, options);
        }
        catch (e) {
            if (e.hasOwnProperty('name') && e.name === 'DatabaseException') {
                return;
            }
            console.error(e);
            return;
        }

        var device = dbObject;
        if (dbObject === dev.MODEL) { device = 'MODEL'; }
        if (dbObject === dev.TX)    { device = 'TX'; }

        console.log(device + '.' + item + ': ', value);
    };


    var testSet = function (dbObject, item, new_value, options) {
        console.log('Changing ' + item + ' to ' + new_value);
        var changed;

        try {
            dbObject.setItem(item, new_value, options);
            changed = dbObject.getItem(item, options);
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
            for (var i = 0; i < new_value.length; i++) {
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

    console.log('\nTests for Database.getItem()');
    console.log('------------------------');
    testGet(dev.MODEL, 'NAME');
    testGet(dev.TX, 'NAME');
    testGet(dev.TX, 'UUID');
    testGet(dev.TX, 'BIND_TIMEOUT_MS');
    testGet(dev.MODEL, 'RF_PROTOCOL_HK310_ADDRESS');
    testGet(dev.MODEL, 'RF_PROTOCOL_HK310_ADDRESS', 0, 3);
    testGet(dev.TX, 'HARDWARE_INPUTS_CALIBRATION', {offset: 2*config.TX.HARDWARE_INPUTS.s});
    testGet(dev.TX, 'HARDWARE_INPUTS_PCB_INPUT_PIN_NAME', {offset: config.TX.HARDWARE_INPUTS.s});
    testGet(dev.MODEL, 'MIXER_UNITS_CURVE_TYPE');
    testGet(dev.TX, 'LOGICAL_INPUTS_LABELS', {offset: 3*config.TX.LOGICAL_INPUTS.s});
    testGet(dev.TX, 'LOGICAL_INPUTS_LABELS', {offset: 2*config.TX.LOGICAL_INPUTS.s, index: 1});
    testGet(dev.MODEL, 'MIXER_UNITS_SRC', {offset: 0});

    console.log('\nTests for Database.setItem()');
    console.log('------------------------');
    testSet(dev.MODEL, 'NAME', 'ChangedName');
    testSet(dev.TX, 'UUID', 'cafebabe-dead-beef-1234-010203040506');
    testSet(dev.TX, 'LED_PWM_PERCENT', '42');
    testSet(dev.TX, 'BIND_TIMEOUT_MS', 1234);
    testSet(dev.MODEL, 'LIMITS_LIMIT_L', -42);
    testSet(dev.TX, 'HARDWARE_INPUTS_CALIBRATION', [1234, 2345, 3456]);
    testSet(dev.MODEL, 'MIXER_UNITS_SRC', 'FLAPS');
    testSet(dev.TX, 'LOGICAL_INPUTS_LABELS', 'GEAR', {offset: 0, index: 2});
    testSet(dev.TX, 'LOGICAL_INPUTS_LABELS', ['ST-DR', 'RUD-DR', 'AIL-DR', 'ELE-DR', 0], {offset: 2*config.TX.LOGICAL_INPUTS.s});

    console.log('\nTests that should fail:');
    console.log('-----------------------');
    testGet(dev.TX, 'MIXER_UNITS_CURVE_TYPE');
    testGet(dev.TX, 'LOGICAL_INPUTS_LABELS', {offset: 3*config.TX.LOGICAL_INPUTS.s, index: 5});
    testGet(dev.MODEL, 'MIXER_UNITS', {offset: 0, index: 'three'});
    testSet(dev.TX, 'LOGICAL_INPUTS_LABELS', ['ST_DR', 'RUD_DR', 'AIL_DR', 'NONE'], {offset: 2*config.TX.LOGICAL_INPUTS.s});

    console.log('#################################\n');
})();
