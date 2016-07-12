#include <stdbool.h>
#include <stdio.h>
#include <stdarg.h>
#include <string.h>

#include <config.h>
#include <systick.h>
#include <uart.h>


// Source: http://stackoverflow.com/questions/3553296/c-sizeof-single-struct-member
#define membersizeof(type, member) sizeof(((type *)0)->member)


// ****************************************************************************
static void sync_printf(const char *fmt, ...)
{
    va_list ap;

    va_start(ap, fmt);
    vprintf(fmt, ap);
    va_end(ap);

    // Wait for printf to finish ...
    UART_sync();
}


// ****************************************************************************
static void print_separator(void)
{
    for (size_t i = 0; i < 60; i++) {
        putchar('-');
    }
    puts("");
}


// ****************************************************************************
static void dump_javascript_config(void)
{
    size_t elements_per_line = 12;
    size_t remaining = sizeof(config);
    uint8_t *p = (uint8_t *)(&config);

    sync_printf("var TEST_CONFIG_DATA = new Uint8Array([\n    ");

    while (remaining) {
        if (remaining < elements_per_line) {
            elements_per_line = remaining;
        }

        sync_printf("    ");
        for (size_t i = 0; i < elements_per_line; i++) {
            sync_printf("0x%02x, ", *p);
            ++p;
        }

        sync_printf("\n");
        remaining -= elements_per_line;
    }

    sync_printf("\n]);\n");
}


// ****************************************************************************
void CONFIG_dump_javascript_information(void)
{
    size_t o;

    print_separator();

    sync_printf("var CONFIG_VERSIONS = CONFIG_VERSIONS || {};\n\n");
    sync_printf("CONFIG_VERSIONS[%lu] = {\n", config.version);
    sync_printf("    CONFIG: {\n");
    sync_printf("    o: 0, s: %u, c: 1, t: 'CONFIG',\n", sizeof(config));
    sync_printf("    VERSION: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, version),
        membersizeof(config_t, version));
    sync_printf("    TX: {o: %u, s: %u, c: 1, t: 's'},\n",
        offsetof(config_t, tx),
        membersizeof(config_t, tx));
    sync_printf("    MODEL: {o: %u, s: %u, c: 1, t: 's'},\n",
        offsetof(config_t, model),
        membersizeof(config_t, model));
    sync_printf("    },\n\n");

    o = offsetof(config_t, tx);

    sync_printf("    TX: {\n");
    sync_printf("    o: %u, s: %u, c: 1, t: 'TX',\n",
        offsetof(config_t, tx), membersizeof(config_t, tx));
    sync_printf("    UUID: {o: %u, s: 1, c: %u, t: 'uuid'},\n",
        offsetof(config_t, tx.uuid) - o,
        membersizeof(config_t, tx.uuid));
    sync_printf("    NAME: {o: %u, s: 1, c: %u, t: 'c'},\n",
        offsetof(config_t, tx.name) - o,
        membersizeof(config_t, tx.name));
    sync_printf("    LAST_CHANGED: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, tx.last_changed) - o,
        membersizeof(config_t, tx.last_changed));
    sync_printf("    HARDWARE_INPUTS: {o: %u, s: %u, c: %u, t: 's'},\n",
        offsetof(config_t, tx.hardware_inputs) - o,
        sizeof(hardware_input_t),
        membersizeof(config_t, tx.hardware_inputs) / sizeof(hardware_input_t));
    sync_printf("    HARDWARE_INPUTS_PCB_INPUT: {o: %u, s: %u, c: 1, t: 's'},\n",
        offsetof(config_t, tx.hardware_inputs[0].pcb_input) - o,
        membersizeof(config_t, tx.hardware_inputs[0].pcb_input));
    sync_printf("    HARDWARE_INPUTS_PCB_INPUT_GPIOPORT: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, tx.hardware_inputs[0].pcb_input.gpioport) - o,
        membersizeof(config_t, tx.hardware_inputs[0].pcb_input.gpioport));
    sync_printf("    HARDWARE_INPUTS_PCB_INPUT_GPIO: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, tx.hardware_inputs[0].pcb_input.gpio) - o,
        membersizeof(config_t, tx.hardware_inputs[0].pcb_input.gpio));
    sync_printf("    HARDWARE_INPUTS_PCB_INPUT_ADC_CHANNEL: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, tx.hardware_inputs[0].pcb_input.adc_channel) - o,
        membersizeof(config_t, tx.hardware_inputs[0].pcb_input.adc_channel) );
    sync_printf("    HARDWARE_INPUTS_PCB_INPUT_TYPE: {o: %u, s: %u, c: 1, t: 'pcb_input_type_t'},\n",
        offsetof(config_t, tx.hardware_inputs[0].pcb_input.type) - o,
        membersizeof(config_t, tx.hardware_inputs[0].pcb_input.type));
    sync_printf("    HARDWARE_INPUTS_PCB_INPUT_PIN_NAME: {o: %u, s: %u, c: %u, t: 'c'},\n",
        offsetof(config_t, tx.hardware_inputs[0].pcb_input.pin_name) - o,
        sizeof(config.tx.hardware_inputs[0].pcb_input.pin_name[0]),
        membersizeof(config_t, tx.hardware_inputs[0].pcb_input.pin_name) / sizeof(config.tx.hardware_inputs[0].pcb_input.pin_name[0]));
    sync_printf("    HARDWARE_INPUTS_PCB_INPUT_SCHEMATIC_REFERENCE: {o: %u, s: %u, c: %u, t: 'c'},\n",
        offsetof(config_t, tx.hardware_inputs[0].pcb_input.schematic_reference) - o,
        sizeof(config.tx.hardware_inputs[0].pcb_input.schematic_reference[0]),
        membersizeof(config_t, tx.hardware_inputs[0].pcb_input.schematic_reference) / sizeof(config.tx.hardware_inputs[0].pcb_input.schematic_reference[0]));
    sync_printf("    HARDWARE_INPUTS_TYPE: {o: %u, s: %u, c: 1, t: 'hardware_input_type_t'},\n",
        offsetof(config_t, tx.hardware_inputs[0].type) - o,
        membersizeof(config_t, tx.hardware_inputs[0].type));
    sync_printf("    HARDWARE_INPUTS_CALIBRATION: {o: %u, s: %u, c: %u, t: 'u'},\n",
        offsetof(config_t, tx.hardware_inputs[0].calibration) - o,
        sizeof(config.tx.hardware_inputs[0].calibration[0]),
        membersizeof(config_t, tx.hardware_inputs[0].calibration) / sizeof(config.tx.hardware_inputs[0].calibration[0]));
    sync_printf("    LOGICAL_INPUTS: {o: %u, s: %u, c: %u, t: 's'},\n",
        offsetof(config_t, tx.logical_inputs) - o,
        sizeof(logical_input_t),
        membersizeof(config_t, tx.logical_inputs) / sizeof(logical_input_t));
    sync_printf("    LOGICAL_INPUTS_TYPE: {o: %u, s: %u, c: 1, t: 'input_type_t'},\n",
        offsetof(config_t, tx.logical_inputs[0].type) - o,
        membersizeof(config_t, tx.logical_inputs[0].type));
    sync_printf("    LOGICAL_INPUTS_SUB_TYPE: {o: %u, s: %u, c: 1, t: 'input_sub_type_t'},\n",
        offsetof(config_t, tx.logical_inputs[0].sub_type) - o,
        membersizeof(config_t, tx.logical_inputs[0].sub_type));
    sync_printf("    LOGICAL_INPUTS_POSITION_COUNT: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, tx.logical_inputs[0].position_count) - o,
        membersizeof(config_t, tx.logical_inputs[0].position_count));
    sync_printf("    LOGICAL_INPUTS_HARDWARE_INPUTS: {o: %u, s: %u, c: %u, t: 'u'},\n",
        offsetof(config_t, tx.logical_inputs[0].hardware_inputs) - o,
        sizeof(port_t),
        membersizeof(config_t, tx.logical_inputs[0].hardware_inputs) / sizeof(port_t));
    sync_printf("    LOGICAL_INPUTS_LABELS: {o: %u, s: %u, c: %u, t: 'input_label_t'},\n",
        offsetof(config_t, tx.logical_inputs[0].labels) - o,
        sizeof(input_label_t),
        membersizeof(config_t, tx.logical_inputs[0].labels) / sizeof(input_label_t));
    sync_printf("    TRIM_RANGE: {o: %u, s: %u, c: 1, t: 'i'},\n",
        offsetof(config_t, tx.trim_range) - o,
        membersizeof(config_t, tx.trim_range));
    sync_printf("    TRIM_STEP_SIZE: {o: %u, s: %u, c: 1, t: 'i'},\n",
        offsetof(config_t, tx.trim_step_size) - o,
        membersizeof(config_t, tx.trim_step_size));
    sync_printf("    BIND_TIMEOUT_MS: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, tx.bind_timeout_ms) - o,
        membersizeof(config_t, tx.bind_timeout_ms));
    sync_printf("    DOUBLE_CLICK_TIMEOUT_MS: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, tx.double_click_timeout_ms) - o,
        membersizeof(config_t, tx.double_click_timeout_ms));
    sync_printf("    LED_PWM_PERCENT: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, tx.led_pwm_percent) - o,
        membersizeof(config_t, tx.led_pwm_percent));
    sync_printf("    },\n\n");

    o = offsetof(config_t, model);

    sync_printf("    MODEL: {\n");
    sync_printf("    o: %u, s: %u, c: 1, t: 'MODEL',\n",
        offsetof(config_t, model), membersizeof(config_t, model));
    sync_printf("    UUID: {o: %u, s: 1, c: %u, t: 'uuid'},\n",
        offsetof(config_t, model.uuid) - o,
        membersizeof(config_t, model.uuid));
    sync_printf("    NAME: {o: %u, s: 1, c: %u, t: 'c'},\n",
        offsetof(config_t, model.name) - o,
        membersizeof(config_t, model.name));
    sync_printf("    LAST_CHANGED: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, model.last_changed) - o,
        membersizeof(config_t, model.last_changed));
    sync_printf("    MIXER_UNITS: {o: %u, s: %u, c: %u, t: 's'},\n",
        offsetof(config_t, model.mixer_units) - o,
        sizeof(mixer_unit_t),
        membersizeof(config_t, model.mixer_units) / sizeof(mixer_unit_t));
    sync_printf("    MIXER_UNITS_CURVE: {o: %u, s: %u, c: 1, t: 's'},\n",
        offsetof(config_t, model.mixer_units[0].curve) - o,
        membersizeof(config_t, model.mixer_units[0].curve));
    sync_printf("    MIXER_UNITS_CURVE_TYPE: {o: %u, s: %u, c: 1, t: 'curve_type_t'},\n",
        offsetof(config_t, model.mixer_units[0].curve.type) - o,
        membersizeof(config_t, model.mixer_units[0].curve.type));
    sync_printf("    MIXER_UNITS_CURVE_SMOOTHING: {o: %u, s: %u, c: 1, t: 'interpolation_type_t'},\n",
        offsetof(config_t, model.mixer_units[0].curve.smoothing) - o,
        membersizeof(config_t, model.mixer_units[0].curve.smoothing));
    sync_printf("    MIXER_UNITS_CURVE_POINTS: {o: %u, s: %u, c: 1, t: 'i'},\n",
        offsetof(config_t, model.mixer_units[0].curve.points) - o,
        membersizeof(config_t, model.mixer_units[0].curve.points));
    sync_printf("    MIXER_UNITS_SRC: {o: %u, s: %u, c: 1, t: 'label_t'},\n",
        offsetof(config_t, model.mixer_units[0].src) - o,
        membersizeof(config_t, model.mixer_units[0].src));
    sync_printf("    MIXER_UNITS_DST: {o: %u, s: %u, c: 1, t: 'label_t'},\n",
        offsetof(config_t, model.mixer_units[0].dst) - o,
        membersizeof(config_t, model.mixer_units[0].dst));
    sync_printf("    MIXER_UNITS_SW: {o: %u, s: %u, c: 1, t: 's'},\n",
        offsetof(config_t, model.mixer_units[0].sw) - o,
        membersizeof(config_t, model.mixer_units[0].sw));
    sync_printf("    MIXER_UNITS_SW_SW: {o: %u, s: %u, c: 1, t: 'label_t'},\n",
        offsetof(config_t, model.mixer_units[0].sw.sw) - o,
        membersizeof(config_t, model.mixer_units[0].sw.sw));
    sync_printf("    MIXER_UNITS_SW_CMP: {o: %u, s: %u, c: 1, t: 'comparison_t'},\n",
        offsetof(config_t, model.mixer_units[0].sw.cmp) - o,
        membersizeof(config_t, model.mixer_units[0].sw.cmp));
    sync_printf("    MIXER_UNITS_SW_VALUE: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, model.mixer_units[0].sw.value) - o,
        membersizeof(config_t, model.mixer_units[0].sw.value));
    sync_printf("    MIXER_UNITS_OP: {o: %u, s: %u, c: 1, t: 'operation_type_t'},\n",
        offsetof(config_t, model.mixer_units[0].op) - o,
        membersizeof(config_t, model.mixer_units[0].op));
    sync_printf("    MIXER_UNITS_SCALAR: {o: %u, s: %u, c: 1, t: 'i'},\n",
        offsetof(config_t, model.mixer_units[0].scalar) - o,
        membersizeof(config_t, model.mixer_units[0].scalar));
    sync_printf("    MIXER_UNITS_OFFSET: {o: %u, s: %u, c: 1, t: 'i'},\n",
        offsetof(config_t, model.mixer_units[0].offset) - o,
        membersizeof(config_t, model.mixer_units[0].offset));
    sync_printf("    MIXER_UNITS_TAG: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, model.mixer_units[0].tag) - o,
        membersizeof(config_t, model.mixer_units[0].tag));
    sync_printf("    MIXER_UNITS_INVERT_SOURCE: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, model.mixer_units[0].invert_source) - o,
        membersizeof(config_t, model.mixer_units[0].invert_source));
    sync_printf("    MIXER_UNITS_APPLY_TRIM: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, model.mixer_units[0].apply_trim) - o,
        membersizeof(config_t, model.mixer_units[0].apply_trim));
    sync_printf("    LIMITS: {o: %u, s: %u, c: %u, t: 's'},\n",
        offsetof(config_t, model.limits) - o,
        sizeof(limits_t),
        membersizeof(config_t, model.limits) / sizeof(limits_t));
    sync_printf("    LIMITS_EP_L: {o: %u, s: %u, c: 1, t: 'i'},\n",
        offsetof(config_t, model.limits[0].ep_l) - o,
        membersizeof(config_t, model.limits[0].ep_l));
    sync_printf("    LIMITS_EP_H: {o: %u, s: %u, c: 1, t: 'i'},\n",
        offsetof(config_t, model.limits[0].ep_h) - o,
        membersizeof(config_t, model.limits[0].ep_h));
    sync_printf("    LIMITS_SUBTRIM: {o: %u, s: %u, c: 1, t: 'i'},\n",
        offsetof(config_t, model.limits[0].subtrim) - o,
        membersizeof(config_t, model.limits[0].subtrim));
    sync_printf("    LIMITS_LIMIT_L: {o: %u, s: %u, c: 1, t: 'i'},\n",
        offsetof(config_t, model.limits[0].limit_l) - o,
        membersizeof(config_t, model.limits[0].limit_l));
    sync_printf("    LIMITS_LIMIT_H: {o: %u, s: %u, c: 1, t: 'i'},\n",
        offsetof(config_t, model.limits[0].limit_h) - o,
        membersizeof(config_t, model.limits[0].limit_h));
    sync_printf("    LIMITS_FAILSAFE: {o: %u, s: %u, c: 1, t: 'i'},\n",
        offsetof(config_t, model.limits[0].failsafe) - o,
        membersizeof(config_t, model.limits[0].failsafe));
    sync_printf("    LIMITS_SPEED: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, model.limits[0].speed) - o,
        membersizeof(config_t, model.limits[0].speed));
    sync_printf("    LIMITS_INVERT: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, model.limits[0].invert) - o,
        membersizeof(config_t, model.limits[0].invert));
    sync_printf("    RF_PROTOCOL_TYPE: {o: %u, s: %u, c: 1, t: 'rf_protocol_type_t'},\n",
        offsetof(config_t, model.rf_protocol_type) - o,
        membersizeof(config_t, model.rf_protocol_type));
    sync_printf("    RF: {o: %u, s: %u, c: 1, t: 's'},\n",
        offsetof(config_t, model.rf) - o,
        membersizeof(config_t, model.rf));
    sync_printf("    RF_PROTOCOL_HK310: {o: %u, s: %u, c: 1, t: 's'},\n",
        offsetof(config_t, model.rf.protocol_hk310) - o,
        membersizeof(config_t, model.rf.protocol_hk310));
    sync_printf("    RF_PROTOCOL_HK310_HOP_CHANNELS: {o: %u, s: 1, c: %u, t: 'u'},\n",
        offsetof(config_t, model.rf.protocol_hk310.hop_channels) - o,
        membersizeof(config_t, model.rf.protocol_hk310.hop_channels));
    sync_printf("    RF_PROTOCOL_HK310_ADDRESS: {o: %u, s: 1, c: %u, t: 'u'},\n",
        offsetof(config_t, model.rf.protocol_hk310.address) - o,
        membersizeof(config_t, model.rf.protocol_hk310.address));
    sync_printf("    },\n\n");

    sync_printf("    TYPES: {\n");
    sync_printf("    pcb_inputut_type_t: {\n");
    sync_printf("        PCB_INPUT_NOT_USED: %d,\n", PCB_INPUT_NOT_USED);
    sync_printf("        ANALOG_DIGITAL: %d,\n", ANALOG_DIGITAL);
    sync_printf("        DIGITAL: %d,\n", DIGITAL);
    sync_printf("    },\n");
    sync_printf("    hardware_input_type_t: {\n");
    sync_printf("        TRANSMITTER_INPUT_NOT_USED: %d,\n", TRANSMITTER_INPUT_NOT_USED);
    sync_printf("        ANALOG_WITH_CENTER: %d,\n", ANALOG_WITH_CENTER);
    sync_printf("        ANALOG_NO_CENTER: %d,\n", ANALOG_NO_CENTER);
    sync_printf("        ANALOG_NO_CENTER_POSITIVE_ONLY: %d,\n", ANALOG_NO_CENTER_POSITIVE_ONLY);
    sync_printf("        SWITCH_ON_OFF: %d,\n", SWITCH_ON_OFF);
    sync_printf("        SWITCH_ON_OPEN_OFF: %d,\n", SWITCH_ON_OPEN_OFF);
    sync_printf("        MOMENTARY_ON_OFF: %d,\n", MOMENTARY_ON_OFF);
    sync_printf("    },\n");
    sync_printf("    input_type_t: {\n");
    sync_printf("        LOGICAL_INPUT_NOT_USED: %d,\n", LOGICAL_INPUT_NOT_USED);
    sync_printf("        ANALOG: %d,\n", ANALOG);
    sync_printf("        SWITCH: %d,\n", SWITCH);
    sync_printf("        BCD_SWITCH: %d,\n", BCD_SWITCH);
    sync_printf("        MOMENTARY: %d,\n", MOMENTARY);
    sync_printf("        TRIM: %d,\n", TRIM);
    sync_printf("    },\n");
    sync_printf("    input_sub_type_t: {\n");
    sync_printf("        SUB_TYPE_NOT_APPLICABLE: %d,\n", SUB_TYPE_NOT_APPLICABLE);
    sync_printf("        UP_DOWN_BUTTONS: %d,\n", UP_DOWN_BUTTONS);
    sync_printf("        INCREMENT_AND_LOOP: %d,\n", INCREMENT_AND_LOOP);
    sync_printf("        DECREMENT_AND_LOOP: %d,\n", DECREMENT_AND_LOOP);
    sync_printf("        SAW_TOOTH: %d,\n", SAW_TOOTH);
    sync_printf("        DOUBLE_CLICK_DECREMENT: %d,\n", DOUBLE_CLICK_DECREMENT);
    sync_printf("    },\n");
    sync_printf("    input_label_t: {\n");
    sync_printf("        NONE: %d,\n", NONE);
    sync_printf("        ST: %d,\n", ST);
    sync_printf("        TH: %d,\n", TH);
    sync_printf("        THR: %d,\n", THR);
    sync_printf("        RUD: %d,\n", RUD);
    sync_printf("        AIL: %d,\n", AIL);
    sync_printf("        ELE: %d,\n", ELE);
    sync_printf("        AUX: %d,\n", AUX);
    sync_printf("        ST_DR: %d,\n", ST_DR);
    sync_printf("        RUD_DR: %d,\n", RUD_DR);
    sync_printf("        AIL_DR: %d,\n", AIL_DR);
    sync_printf("        ELE_DR: %d,\n", ELE_DR);
    sync_printf("        TH_DR: %d,\n", TH_DR);
    sync_printf("        THR_DR: %d,\n", THR_DR);
    sync_printf("        TH_HOLD: %d,\n", TH_HOLD);
    sync_printf("        GEAR: %d,\n", GEAR);
    sync_printf("        FLAPS: %d,\n", FLAPS);
    sync_printf("        TRAINER: %d,\n", TRAINER);
    sync_printf("        SIDE_L: %d,\n", SIDE_L);
    sync_printf("        SIDE_R: %d,\n", SIDE_R);
    sync_printf("        POT1: %d,\n", POT1);
    sync_printf("        POT2: %d,\n", POT2);
    sync_printf("        POT3: %d,\n", POT3);
    sync_printf("        POT4: %d,\n", POT4);
    sync_printf("        POT5: %d,\n", POT5);
    sync_printf("        POT6: %d,\n", POT6);
    sync_printf("        POT7: %d,\n", POT7);
    sync_printf("        POT8: %d,\n", POT8);
    sync_printf("        POT9: %d,\n", POT9);
    sync_printf("        SW1: %d,\n", SW1);
    sync_printf("        SW2: %d,\n", SW2);
    sync_printf("        SW3: %d,\n", SW3);
    sync_printf("        SW4: %d,\n", SW4);
    sync_printf("        SW5: %d,\n", SW5);
    sync_printf("        SW7: %d,\n", SW7);
    sync_printf("        SW8: %d,\n", SW8);
    sync_printf("        SW9: %d,\n", SW9);
    sync_printf("    },\n");
    sync_printf("    channel_label_t: {\n");
    sync_printf("        CH1: %d,\n", CH1);
    sync_printf("        CH2: %d,\n", CH2);
    sync_printf("        CH3: %d,\n", CH3);
    sync_printf("        CH4: %d,\n", CH4);
    sync_printf("        CH5: %d,\n", CH5);
    sync_printf("        CH6: %d,\n", CH6);
    sync_printf("        CH7: %d,\n", CH7);
    sync_printf("        CH8: %d,\n", CH8);
    sync_printf("        VIRTUAL1: %d,\n", VIRTUAL1);
    sync_printf("        VIRTUAL2: %d,\n", VIRTUAL2);
    sync_printf("        VIRTUAL3: %d,\n", VIRTUAL3);
    sync_printf("        VIRTUAL4: %d,\n", VIRTUAL4);
    sync_printf("        VIRTUAL5: %d,\n", VIRTUAL5);
    sync_printf("        VIRTUAL6: %d,\n", VIRTUAL6);
    sync_printf("        VIRTUAL7: %d,\n", VIRTUAL7);
    sync_printf("        VIRTUAL8: %d,\n", VIRTUAL8);
    sync_printf("        VIRTUAL9: %d,\n", VIRTUAL9);
    sync_printf("        VIRTUAL10: %d,\n", VIRTUAL10);
    // NOTE: skip hidden channels, they are not needed in the UI
    sync_printf("    },\n");
    sync_printf("    src_label_t: {\n");
    sync_printf("        NONE: %d,\n", SRC_NONE);

    sync_printf("        NONE: %d,\n", IN_NONE);
    sync_printf("        ST: %d,\n", IN_ST);
    sync_printf("        TH: %d,\n", IN_TH);
    sync_printf("        THR: %d,\n", IN_THR);
    sync_printf("        RUD: %d,\n", IN_RUD);
    sync_printf("        AIL: %d,\n", IN_AIL);
    sync_printf("        ELE: %d,\n", IN_ELE);
    sync_printf("        AUX: %d,\n", IN_AUX);
    sync_printf("        ST_DR: %d,\n", IN_ST_DR);
    sync_printf("        RUD_DR: %d,\n", IN_RUD_DR);
    sync_printf("        AIL_DR: %d,\n", IN_AIL_DR);
    sync_printf("        ELE_DR: %d,\n", IN_ELE_DR);
    sync_printf("        TH_DR: %d,\n", IN_TH_DR);
    sync_printf("        THR_DR: %d,\n", IN_THR_DR);
    sync_printf("        TH_HOLD: %d,\n", IN_TH_HOLD);
    sync_printf("        GEAR: %d,\n", IN_GEAR);
    sync_printf("        FLAPS: %d,\n", IN_FLAPS);
    sync_printf("        TRAINER: %d,\n", IN_TRAINER);
    sync_printf("        SIDE_L: %d,\n", IN_SIDE_L);
    sync_printf("        SIDE_R: %d,\n", IN_SIDE_R);
    sync_printf("        POT1: %d,\n", IN_POT1);
    sync_printf("        POT2: %d,\n", IN_POT2);
    sync_printf("        POT3: %d,\n", IN_POT3);
    sync_printf("        POT4: %d,\n", IN_POT4);
    sync_printf("        POT5: %d,\n", IN_POT5);
    sync_printf("        POT6: %d,\n", IN_POT6);
    sync_printf("        POT7: %d,\n", IN_POT7);
    sync_printf("        POT8: %d,\n", IN_POT8);
    sync_printf("        POT9: %d,\n", IN_POT9);
    sync_printf("        SW1: %d,\n", IN_SW1);
    sync_printf("        SW2: %d,\n", IN_SW2);
    sync_printf("        SW3: %d,\n", IN_SW3);
    sync_printf("        SW4: %d,\n", IN_SW4);
    sync_printf("        SW5: %d,\n", IN_SW5);
    sync_printf("        SW7: %d,\n", IN_SW7);
    sync_printf("        SW8: %d,\n", IN_SW8);
    sync_printf("        SW9: %d,\n", IN_SW9);
    sync_printf("        CH1: %d,\n", CH_CH1);
    sync_printf("        CH2: %d,\n", CH_CH2);
    sync_printf("        CH3: %d,\n", CH_CH3);
    sync_printf("        CH4: %d,\n", CH_CH4);
    sync_printf("        CH5: %d,\n", CH_CH5);
    sync_printf("        CH6: %d,\n", CH_CH6);
    sync_printf("        CH7: %d,\n", CH_CH7);
    sync_printf("        CH8: %d,\n", CH_CH8);
    sync_printf("        VIRTUAL1: %d,\n", CH_VIRTUAL1);
    sync_printf("        VIRTUAL2: %d,\n", CH_VIRTUAL2);
    sync_printf("        VIRTUAL3: %d,\n", CH_VIRTUAL3);
    sync_printf("        VIRTUAL4: %d,\n", CH_VIRTUAL4);
    sync_printf("        VIRTUAL5: %d,\n", CH_VIRTUAL5);
    sync_printf("        VIRTUAL6: %d,\n", CH_VIRTUAL6);
    sync_printf("        VIRTUAL7: %d,\n", CH_VIRTUAL7);
    sync_printf("        VIRTUAL8: %d,\n", CH_VIRTUAL8);
    sync_printf("        VIRTUAL9: %d,\n", CH_VIRTUAL9);
    sync_printf("        VIRTUAL10: %d,\n", CH_VIRTUAL10);
    // NOTE: skip hidden channels, they are not needed in the UI
    sync_printf("    },\n");
    sync_printf("    rf_protocol_type_t: {\n");
    sync_printf("        RF_PROTOCOL_HK310: %d,\n", RF_PROTOCOL_HK310);
    sync_printf("    },\n");
    sync_printf("    operation_type_t: {\n");
    sync_printf("        OP_REPLACE: %d,\n", OP_REPLACE);
    sync_printf("        OP_ADD: %d,\n", OP_ADD);
    sync_printf("        OP_MULTIPLY: %d,\n", OP_MULTIPLY);
    sync_printf("        OP_MIN: %d,\n", OP_MIN);
    sync_printf("        OP_MAX: %d,\n", OP_MAX);
    sync_printf("    },\n");
    sync_printf("    comparison_t: {\n");
    sync_printf("        EQUAL: %d,\n", EQUAL);
    sync_printf("        NON_EQUAL: %d,\n", NON_EQUAL);
    sync_printf("        GREATER: %d,\n", GREATER);
    sync_printf("        GREATER_OR_EQUAL: %d,\n", GREATER_OR_EQUAL);
    sync_printf("        SMALLER: %d,\n", SMALLER);
    sync_printf("        SMALLER_OR_EQUAL: %d,\n", SMALLER_OR_EQUAL);
    sync_printf("    },\n");
    sync_printf("    curve_type_t: {\n");
    sync_printf("        CURVE_NONE: %d,\n", CURVE_NONE);
    sync_printf("        CURVE_FIXED: %d,\n", CURVE_FIXED);
    sync_printf("        CURVE_MIN_MAX: %d,\n", CURVE_MIN_MAX);
    sync_printf("        CURVE_ZERO_MAX: %d,\n", CURVE_ZERO_MAX);
    sync_printf("        CURVE_GT_ZERO: %d,\n", CURVE_GT_ZERO);
    sync_printf("        CURVE_LT_ZERO: %d,\n", CURVE_LT_ZERO);
    sync_printf("        CURVE_ABSVAL: %d,\n", CURVE_ABSVAL);
    sync_printf("        CURVE_EXPO: %d,\n", CURVE_EXPO);
    sync_printf("        CURVE_DEADBAND: %d,\n", CURVE_DEADBAND);
    sync_printf("        CURVE_3POINT: %d,\n", CURVE_3POINT);
    sync_printf("        CURVE_5POINT: %d,\n", CURVE_5POINT);
    sync_printf("        CURVE_7POINT: %d,\n", CURVE_7POINT);
    sync_printf("        CURVE_9POINT: %d,\n", CURVE_9POINT);
    sync_printf("        CURVE_11POINT: %d,\n", CURVE_11POINT);
    sync_printf("        CURVE_13POINT: %d,\n", CURVE_13POINT);
    sync_printf("    },\n");
    sync_printf("    interpolation_type_t: {\n");
    sync_printf("        INTERPOLATION_LINEAR: %d,\n", INTERPOLATION_LINEAR);
    sync_printf("        INTERPOLATION_SMOOTHING: %d,\n", INTERPOLATION_SMOOTHING);
    sync_printf("    },\n");
    sync_printf("    }\n");
    sync_printf("};\n");

    print_separator();
    dump_javascript_config();
}

