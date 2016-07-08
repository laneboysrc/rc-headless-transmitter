/*jslint browser: true */
"use strict";

var Device = function () {
    this.data = new ArrayBuffer(1024);

    this.version = null;
    this.tx = null;
    this.model = null;

};

Device.prototype.useDummyDevice = function () {
    this.version = 1;
    this.tx = {
        'uuid': '43538fe8-44c9-11e6-9f17-af7be9c4479e',
        'name': 'Dummy TX',
        'hardware_inputs': [{
            'pcb_input': {
                'type': 'ANALOG_DIGITAL',
                'gpioport': 0x80001234,
                'gpio': 2,
                'adc_channel': 2,
                'pin_name': "PA2/ADC2",
                'schematic_reference': "ADC2"
            },
            'type': 'ANALOG_WITH_CENTER',
            'calibration': [590, 1943, 3240]
        }, {
            'pcb_input': {
                'type': 'DIGITAL',
                'gpioport': 0x80001235,
                'gpio': 5,
                'adc_channel': 0,
                'pin_name': "PB5",
                'schematic_reference': "SW5"
            },
            'type': 'MOMENTARY_ON_OFF',
            'calibration': [0, 0, 0]
        }],
        'logical_inputs': [{
            'type': 'ANALOG',
            'sub_type': 'SUB_TYPE_NOT_APPLICABLE',
            'position_count': 0,
            'hardware_inputs': [0],
            'labels': ['THR', 'TH']
        }, {
            'type': 'SWITCH',
            'sub_type': 'SAW_TOOTH',
            'position_count': 3,
            'hardware_inputs': [1],
            'labels': ['SW1']
        }],
        'trim_range': 3000,
        'trim_step_size': 100,
        'bind_timeout_ms': 10 * 1000,
        'led_pwm_percent': 30,
        'double_click_timeout_ms': 300
    };
    this.model = {
        'uuid': 'c91cabaa-44c9-11e6-9bc2-03ac25e30b5b',
        'name': 'Dummy model',
        'mixer_units': [{
            'src': 'AIL',
            'dst': 'CH1',
            'curve': {
                'type': 'CURVE_NONE',
                'points': [],
            },
            'scalar': 100,
            'offset': 0,
            'apply_trim': true,
            'sw': {
                'sw': 'SW1',
                'cmp': 'EQUAL',
                'value': 2,
            },
            'op': 'OP_REPLACE',
            'tag': 0,
            'invert_source': false
        }, {
            'src': 'SW1',
            'dst': 'CH2',
            'curve': {
                'type': 'CURVE_NONE',
                'points': [],
            },
            'scalar': 100,
            'offset': 0,
            'apply_trim': false,
            'sw': {
                'sw': 'NONE',
                'cmp': 'EQUAL',
                'value': 0,
            },
            'op': 'OP_REPLACE',
            'tag': 0,
            'invert_source': false
        }],
        'limits': [{
            'ep_l': -3500,
            'ep_h': 3000,
            'subtrim': -1600,
            'limit_l': -150000,
            'limit_h': 150000,
            'failsafe': 800,
            'speed': 0,
            'invert': false
        }, {
            'ep_l': -3000,
            'ep_h': 3500,
            'subtrim': -2200,
            'limit_l': -150000,
            'limit_h': 150000,
            'failsafe': -500,
            'speed': 0,
            'invert': false
        }],
        'protocol_hk310': {
            'address': [0xab, 0x22, 0x08, 0x97, 0x45],
            'hop_channels': [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39]
        }
    };
};
