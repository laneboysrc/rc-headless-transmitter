#include <stdbool.h>
#include <stdio.h>
#include <string.h>

#include <config.h>
#include <systick.h>


// Source: http://stackoverflow.com/questions/3553296/c-sizeof-single-struct-member
#define membersizeof(type, member) sizeof(((type *)0)->member)


static void dump_javascript_1(void);
static void dump_javascript_2(void);
static void dump_javascript_3(void);
static void dump_javascript_4(void);
static void dump_javascript_5(void);
static void dump_javascript_6(void);
static void dump_javascript_7(void);
static void dump_javascript_8(void);
static void dump_javascript_9(void);
static void dump_javascript_10(void);
static void dump_javascript_config(void);


// ****************************************************************************
static void print_separator(void)
{
    for (size_t i = 0; i < 60; i++) {
        putchar('-');
    }
    puts("");
}


// ****************************************************************************
void CONFIG_dump_javascript_information(void)
{
    size_t o = offsetof(config_t, tx);

    print_separator();
    printf("var CONFIG = {\n");
    printf("    o: 0, s: %u, c: 1, t: 's',\n", sizeof(config));
    printf("    VERSION: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, version),
        membersizeof(config_t, version));
    printf("    TX: {o: %u, s: %u, c: 1, t: 's'},\n",
        offsetof(config_t, tx),
        membersizeof(config_t, tx));
    printf("    MODEL: {o: %u, s: %u, c: 1, t: 's'},\n",
        offsetof(config_t, model),
        membersizeof(config_t, model));
    printf("};\n\n");

    printf("var TX = {\n");
    printf("    o: %u, s: %u, c: 1, t: 's',\n",
        offsetof(config_t, tx), membersizeof(config_t, tx));
    printf("    UUID: {o: %u, s: 1, c: %u, t: 'uuid'},\n",
        offsetof(config_t, tx.uuid) - o,
        membersizeof(config_t, tx.uuid));
    printf("    NAME: {o: %u, s: 1, c: %u, t: 'c'},\n",
        offsetof(config_t, tx.name) - o,
        membersizeof(config_t, tx.name));
    SYSTICK_set_callback(dump_javascript_1, 300);
}

static void dump_javascript_1(void) {
    size_t o = offsetof(config_t, tx);

    printf("    HARDWARE_INPUTS: {o: %u, s: %u, c: %u, t: 's'},\n",
        offsetof(config_t, tx.hardware_inputs) - o,
        sizeof(hardware_input_t),
        membersizeof(config_t, tx.hardware_inputs) / sizeof(hardware_input_t));
    printf("    HARDWARE_INPUTS_PCB_INPUT: {o: %u, s: %u, c: 1, t: 's'},\n",
        offsetof(config_t, tx.hardware_inputs[0].pcb_input) - o,
        membersizeof(config_t, tx.hardware_inputs[0].pcb_input));
    printf("    HARDWARE_INPUTS_PCB_INPUT_GPIOPORT: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, tx.hardware_inputs[0].pcb_input.gpioport) - o,
        membersizeof(config_t, tx.hardware_inputs[0].pcb_input.gpioport));
    printf("    HARDWARE_INPUTS_PCB_INPUT_GPIO: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, tx.hardware_inputs[0].pcb_input.gpio) - o,
        membersizeof(config_t, tx.hardware_inputs[0].pcb_input.gpio));
    printf("    HARDWARE_INPUTS_PCB_INPUT_ADC_CHANNEL: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, tx.hardware_inputs[0].pcb_input.adc_channel) - o,
        membersizeof(config_t, tx.hardware_inputs[0].pcb_input.adc_channel) );
    printf("    HARDWARE_INPUTS_PCB_INPUT_TYPE: {o: %u, s: %u, c: 1, t: 'pcb_input_type_t'},\n",
        offsetof(config_t, tx.hardware_inputs[0].pcb_input.type) - o,
        membersizeof(config_t, tx.hardware_inputs[0].pcb_input.type));
    printf("    HARDWARE_INPUTS_PCB_INPUT_PIN_NAME: {o: %u, s: %u, c: %u, t: 'c'},\n",
        offsetof(config_t, tx.hardware_inputs[0].pcb_input.pin_name) - o,
        sizeof(config.tx.hardware_inputs[0].pcb_input.pin_name[0]),
        membersizeof(config_t, tx.hardware_inputs[0].pcb_input.pin_name) / sizeof(config.tx.hardware_inputs[0].pcb_input.pin_name[0]));
    printf("    HARDWARE_INPUTS_PCB_INPUT_SCHEMATIC_REFERENCE: {o: %u, s: %u, c: %u, t: 'c'},\n",
        offsetof(config_t, tx.hardware_inputs[0].pcb_input.schematic_reference) - o,
        sizeof(config.tx.hardware_inputs[0].pcb_input.schematic_reference[0]),
        membersizeof(config_t, tx.hardware_inputs[0].pcb_input.schematic_reference) / sizeof(config.tx.hardware_inputs[0].pcb_input.schematic_reference[0]));
    printf("    HARDWARE_INPUTS_TYPE: {o: %u, s: %u, c: 1, t: 'hardware_input_type_t'},\n",
        offsetof(config_t, tx.hardware_inputs[0].type) - o,
        membersizeof(config_t, tx.hardware_inputs[0].type));
    printf("    HARDWARE_INPUTS_CALIBRATION: {o: %u, s: %u, c: %u, t: 'u'},\n",
        offsetof(config_t, tx.hardware_inputs[0].calibration) - o,
        sizeof(config.tx.hardware_inputs[0].calibration[0]),
        membersizeof(config_t, tx.hardware_inputs[0].calibration) / sizeof(config.tx.hardware_inputs[0].calibration[0]));

    SYSTICK_set_callback(dump_javascript_2, 200);
}

static void dump_javascript_2(void) {
    size_t o = offsetof(config_t, tx);

    printf("    LOGICAL_INPUTS: {o: %u, s: %u, c: %u, t: 's'},\n",
        offsetof(config_t, tx.logical_inputs) - o,
        sizeof(logical_input_t),
        membersizeof(config_t, tx.logical_inputs) / sizeof(logical_input_t));
    printf("    LOGICAL_INPUTS_TYPE: {o: %u, s: %u, c: 1, t: 'input_type_t'},\n",
        offsetof(config_t, tx.logical_inputs[0].type) - o,
        membersizeof(config_t, tx.logical_inputs[0].type));
    printf("    LOGICAL_INPUTS_SUB_TYPE: {o: %u, s: %u, c: 1, t: 'input_sub_type_t'},\n",
        offsetof(config_t, tx.logical_inputs[0].sub_type) - o,
        membersizeof(config_t, tx.logical_inputs[0].sub_type));
    printf("    LOGICAL_INPUTS_POSITION_COUNT: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, tx.logical_inputs[0].position_count) - o,
        membersizeof(config_t, tx.logical_inputs[0].position_count));
    printf("    LOGICAL_INPUTS_HARDWARE_INPUTS: {o: %u, s: %u, c: %u, t: 'u'},\n",
        offsetof(config_t, tx.logical_inputs[0].hardware_inputs) - o,
        sizeof(port_t),
        membersizeof(config_t, tx.logical_inputs[0].hardware_inputs) / sizeof(port_t));
    printf("    LOGICAL_INPUTS_LABELS: {o: %u, s: %u, c: %u, t: 'label_t'},\n",
        offsetof(config_t, tx.logical_inputs[0].labels) - o,
        sizeof(label_t),
        membersizeof(config_t, tx.logical_inputs[0].labels) / sizeof(label_t));
    printf("    TRIM_RANGE: {o: %u, s: %u, c: 1, t: 'i'},\n",
        offsetof(config_t, tx.trim_range) - o,
        membersizeof(config_t, tx.trim_range));
    printf("    TRIM_STEP_SIZE: {o: %u, s: %u, c: 1, t: 'i'},\n",
        offsetof(config_t, tx.trim_step_size) - o,
        membersizeof(config_t, tx.trim_step_size));
    printf("    BIND_TIMEOUT_MS: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, tx.bind_timeout_ms) - o,
        membersizeof(config_t, tx.bind_timeout_ms));
    printf("    DOUBLE_CLICK_TIMEOUT_MS: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, tx.double_click_timeout_ms) - o,
        membersizeof(config_t, tx.double_click_timeout_ms));
    printf("    LED_PWM_PERCENT: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, tx.led_pwm_percent) - o,
        membersizeof(config_t, tx.led_pwm_percent));
    SYSTICK_set_callback(dump_javascript_3, 200);
    printf("};\n\n");
}

static void dump_javascript_3(void) {
    size_t o = offsetof(config_t, model);

    printf("var MODEL = {\n");
    printf("    o: %u, s: %u, c: 1, t: 's',\n",
        offsetof(config_t, model), membersizeof(config_t, model));
    printf("    UUID: {o: %u, s: 1, c: %u, t: 'uuid'},\n",
        offsetof(config_t, model.uuid) - o,
        membersizeof(config_t, model.uuid));
    printf("    NAME: {o: %u, s: 1, c: %u, t: 'c'},\n",
        offsetof(config_t, model.name) - o,
        membersizeof(config_t, model.name));
    printf("    MIXER_UNITS: {o: %u, s: %u, c: %u, t: 's'},\n",
        offsetof(config_t, model.mixer_units) - o,
        sizeof(mixer_unit_t),
        membersizeof(config_t, model.mixer_units) / sizeof(mixer_unit_t));
    printf("    MIXER_UNITS_CURVE: {o: %u, s: %u, c: 1, t: 's'},\n",
        offsetof(config_t, model.mixer_units[0].curve) - o,
        membersizeof(config_t, model.mixer_units[0].curve));
    printf("    MIXER_UNITS_CURVE_TYPE: {o: %u, s: %u, c: 1, t: 'curve_type_t'},\n",
        offsetof(config_t, model.mixer_units[0].curve.type) - o,
        membersizeof(config_t, model.mixer_units[0].curve.type));
    printf("    MIXER_UNITS_CURVE_SMOOTHING: {o: %u, s: %u, c: 1, t: 'interpolation_type_t'},\n",
        offsetof(config_t, model.mixer_units[0].curve.smoothing) - o,
        membersizeof(config_t, model.mixer_units[0].curve.smoothing));
    printf("    MIXER_UNITS_CURVE_POINTS: {o: %u, s: %u, c: 1, t: 'i'},\n",
        offsetof(config_t, model.mixer_units[0].curve.points) - o,
        membersizeof(config_t, model.mixer_units[0].curve.points));

    SYSTICK_set_callback(dump_javascript_4, 300);
}

static void dump_javascript_4(void) {
    size_t o = offsetof(config_t, model);

    printf("    MIXER_UNITS_SRC: {o: %u, s: %u, c: 1, t: 'label_t'},\n",
        offsetof(config_t, model.mixer_units[0].src) - o,
        membersizeof(config_t, model.mixer_units[0].src));
    printf("    MIXER_UNITS_DST: {o: %u, s: %u, c: 1, t: 'label_t'},\n",
        offsetof(config_t, model.mixer_units[0].dst) - o,
        membersizeof(config_t, model.mixer_units[0].dst));
    printf("    MIXER_UNITS_SW: {o: %u, s: %u, c: 1, t: 's'},\n",
        offsetof(config_t, model.mixer_units[0].sw) - o,
        membersizeof(config_t, model.mixer_units[0].sw));
    printf("    MIXER_UNITS_SW_SW: {o: %u, s: %u, c: 1, t: 'label_t'},\n",
        offsetof(config_t, model.mixer_units[0].sw.sw) - o,
        membersizeof(config_t, model.mixer_units[0].sw.sw));
    printf("    MIXER_UNITS_SW_CMP: {o: %u, s: %u, c: 1, t: 'comparison_t'},\n",
        offsetof(config_t, model.mixer_units[0].sw.cmp) - o,
        membersizeof(config_t, model.mixer_units[0].sw.cmp));
    printf("    MIXER_UNITS_SW_VALUE: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, model.mixer_units[0].sw.value) - o,
        membersizeof(config_t, model.mixer_units[0].sw.value));
    printf("    MIXER_UNITS_OP: {o: %u, s: %u, c: 1, t: 'operation_type_t'},\n",
        offsetof(config_t, model.mixer_units[0].op) - o,
        membersizeof(config_t, model.mixer_units[0].op));
    printf("    MIXER_UNITS_SCALAR: {o: %u, s: %u, c: 1, t: 'i'},\n",
        offsetof(config_t, model.mixer_units[0].scalar) - o,
        membersizeof(config_t, model.mixer_units[0].scalar));
    printf("    MIXER_UNITS_OFFSET: {o: %u, s: %u, c: 1, t: 'i'},\n",
        offsetof(config_t, model.mixer_units[0].offset) - o,
        membersizeof(config_t, model.mixer_units[0].offset));
    printf("    MIXER_UNITS_TAG: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, model.mixer_units[0].tag) - o,
        membersizeof(config_t, model.mixer_units[0].tag));
    printf("    MIXER_UNITS_INVERT_SOURCE: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, model.mixer_units[0].invert_source) - o,
        membersizeof(config_t, model.mixer_units[0].invert_source));
    printf("    MIXER_UNITS_APPLY_TRIM: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, model.mixer_units[0].apply_trim) - o,
        membersizeof(config_t, model.mixer_units[0].apply_trim));
    SYSTICK_set_callback(dump_javascript_5, 200);
}

static void dump_javascript_5(void) {
    size_t o = offsetof(config_t, model);

    printf("    LIMITS: {o: %u, s: %u, c: %u, t: 's'},\n",
        offsetof(config_t, model.limits) - o,
        sizeof(limits_t),
        membersizeof(config_t, model.limits) / sizeof(limits_t));
    printf("    LIMITS_EP_L: {o: %u, s: %u, c: 1, t: 'i'},\n",
        offsetof(config_t, model.limits[0].ep_l) - o,
        membersizeof(config_t, model.limits[0].ep_l));
    printf("    LIMITS_EP_H: {o: %u, s: %u, c: 1, t: 'i'},\n",
        offsetof(config_t, model.limits[0].ep_h) - o,
        membersizeof(config_t, model.limits[0].ep_h));
    printf("    LIMITS_SUBTRIM: {o: %u, s: %u, c: 1, t: 'i'},\n",
        offsetof(config_t, model.limits[0].subtrim) - o,
        membersizeof(config_t, model.limits[0].subtrim));
    printf("    LIMITS_LIMIT_L: {o: %u, s: %u, c: 1, t: 'i'},\n",
        offsetof(config_t, model.limits[0].limit_l) - o,
        membersizeof(config_t, model.limits[0].limit_l));
    printf("    LIMITS_LIMIT_H: {o: %u, s: %u, c: 1, t: 'i'},\n",
        offsetof(config_t, model.limits[0].limit_h) - o,
        membersizeof(config_t, model.limits[0].limit_h));
    printf("    LIMITS_FAILSAFE: {o: %u, s: %u, c: 1, t: 'i'},\n",
        offsetof(config_t, model.limits[0].failsafe) - o,
        membersizeof(config_t, model.limits[0].failsafe));
    printf("    LIMITS_SPEED: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, model.limits[0].speed) - o,
        membersizeof(config_t, model.limits[0].speed));
    printf("    LIMITS_INVERT: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, model.limits[0].invert) - o,
        membersizeof(config_t, model.limits[0].invert));
    printf("    RF_PROTOCOL_TYPE: {o: %u, s: %u, c: 1, t: 'rf_protocol_type_t'},\n",
        offsetof(config_t, model.rf_protocol_type) - o,
        membersizeof(config_t, model.rf_protocol_type));
    printf("    RF: {o: %u, s: %u, c: 1, t: 's'},\n",
        offsetof(config_t, model.rf) - o,
        membersizeof(config_t, model.rf));
    printf("    RF_PROTOCOL_HK310: {o: %u, s: %u, c: 1, t: 's'},\n",
        offsetof(config_t, model.rf.protocol_hk310) - o,
        membersizeof(config_t, model.rf.protocol_hk310));
    printf("    RF_PROTOCOL_HK310_HOP_CHANNELS: {o: %u, s: 1, c: %u, t: 'u'},\n",
        offsetof(config_t, model.rf.protocol_hk310.hop_channels) - o,
        membersizeof(config_t, model.rf.protocol_hk310.hop_channels));
    printf("    RF_PROTOCOL_HK310_ADDRESS: {o: %u, s: 1, c: %u, t: 'u'},\n",
        offsetof(config_t, model.rf.protocol_hk310.address) - o,
        membersizeof(config_t, model.rf.protocol_hk310.address));
    SYSTICK_set_callback(dump_javascript_6, 300);
    printf("};\n\n");
}

static void dump_javascript_6(void) {
    printf("var TYPES = {\n");
    printf("    pcb_inputut_type_t: {\n");
    printf("        PCB_INPUT_NOT_USED: %d,\n", PCB_INPUT_NOT_USED);
    printf("        ANALOG_DIGITAL: %d,\n", ANALOG_DIGITAL);
    printf("        DIGITAL: %d,\n", DIGITAL);
    printf("    },\n");
    printf("    hardware_input_type_t: {\n");
    printf("        TRANSMITTER_INPUT_NOT_USED: %d,\n", TRANSMITTER_INPUT_NOT_USED);
    printf("        ANALOG_WITH_CENTER: %d,\n", ANALOG_WITH_CENTER);
    printf("        ANALOG_NO_CENTER: %d,\n", ANALOG_NO_CENTER);
    printf("        ANALOG_NO_CENTER_POSITIVE_ONLY: %d,\n", ANALOG_NO_CENTER_POSITIVE_ONLY);
    printf("        SWITCH_ON_OFF: %d,\n", SWITCH_ON_OFF);
    printf("        SWITCH_ON_OPEN_OFF: %d,\n", SWITCH_ON_OPEN_OFF);
    printf("        MOMENTARY_ON_OFF: %d,\n", MOMENTARY_ON_OFF);
    printf("    },\n");
    printf("    input_type_t: {\n");
    printf("        LOGICAL_INPUT_NOT_USED: %d,\n", LOGICAL_INPUT_NOT_USED);
    printf("        ANALOG: %d,\n", ANALOG);
    printf("        SWITCH: %d,\n", SWITCH);
    printf("        BCD_SWITCH: %d,\n", BCD_SWITCH);
    printf("        MOMENTARY: %d,\n", MOMENTARY);
    printf("        TRIM: %d,\n", TRIM);
    printf("    },\n");
    printf("    input_sub_type_t: {\n");
    printf("        SUB_TYPE_NOT_APPLICABLE: %d,\n", SUB_TYPE_NOT_APPLICABLE);
    printf("        UP_DOWN_BUTTONS: %d,\n", UP_DOWN_BUTTONS);
    printf("        INCREMENT_AND_LOOP: %d,\n", INCREMENT_AND_LOOP);
    printf("        DECREMENT_AND_LOOP: %d,\n", DECREMENT_AND_LOOP);
    printf("        SAW_TOOTH: %d,\n", SAW_TOOTH);
    printf("        DOUBLE_CLICK_DECREMENT: %d,\n", DOUBLE_CLICK_DECREMENT);
    printf("    },\n");
    SYSTICK_set_callback(dump_javascript_7, 200);
}

static void dump_javascript_7(void) {
    printf("    label_t: {\n");
    printf("        NONE: %d,\n", NONE);
    printf("        ST: %d,\n", ST);
    printf("        TH: %d,\n", TH);
    printf("        THR: %d,\n", THR);
    printf("        RUD: %d,\n", RUD);
    printf("        AIL: %d,\n", AIL);
    printf("        ELE: %d,\n", ELE);
    printf("        AUX: %d,\n", AUX);
    printf("        ST_DR: %d,\n", ST_DR);
    printf("        RUD_DR: %d,\n", RUD_DR);
    printf("        AIL_DR: %d,\n", AIL_DR);
    printf("        ELE_DR: %d,\n", ELE_DR);
    printf("        TH_DR: %d,\n", TH_DR);
    printf("        THR_DR: %d,\n", THR_DR);
    printf("        TH_HOLD: %d,\n", TH_HOLD);
    printf("        GEAR: %d,\n", GEAR);
    printf("        FLAPS: %d,\n", FLAPS);
    printf("        TRAINER: %d,\n", TRAINER);
    printf("        SIDE_L: %d,\n", SIDE_L);
    printf("        SIDE_R: %d,\n", SIDE_R);
    printf("        POT1: %d,\n", POT1);
    printf("        POT2: %d,\n", POT2);
    printf("        POT3: %d,\n", POT3);
    printf("        POT4: %d,\n", POT4);
    printf("        POT5: %d,\n", POT5);
    printf("        POT6: %d,\n", POT6);
    printf("        POT7: %d,\n", POT7);
    printf("        POT8: %d,\n", POT8);
    printf("        POT9: %d,\n", POT9);
    printf("        SW1: %d,\n", SW1);
    printf("        SW2: %d,\n", SW2);
    printf("        SW3: %d,\n", SW3);
    printf("        SW4: %d,\n", SW4);
    printf("        SW5: %d,\n", SW5);
    printf("        SW7: %d,\n", SW7);
    printf("        SW8: %d,\n", SW8);
    printf("        SW9: %d,\n", SW9);
    SYSTICK_set_callback(dump_javascript_8, 200);
}

static void dump_javascript_8(void) {
    printf("        CH1: %d,\n", CH1);
    printf("        CH2: %d,\n", CH2);
    printf("        CH3: %d,\n", CH3);
    printf("        CH4: %d,\n", CH4);
    printf("        CH5: %d,\n", CH5);
    printf("        CH6: %d,\n", CH6);
    printf("        CH7: %d,\n", CH7);
    printf("        CH8: %d,\n", CH8);
    printf("        VIRTUAL1: %d,\n", VIRTUAL1);
    printf("        VIRTUAL2: %d,\n", VIRTUAL2);
    printf("        VIRTUAL3: %d,\n", VIRTUAL3);
    printf("        VIRTUAL4: %d,\n", VIRTUAL4);
    printf("        VIRTUAL5: %d,\n", VIRTUAL5);
    printf("        VIRTUAL6: %d,\n", VIRTUAL6);
    printf("        VIRTUAL7: %d,\n", VIRTUAL7);
    printf("        VIRTUAL8: %d,\n", VIRTUAL8);
    printf("        VIRTUAL9: %d,\n", VIRTUAL9);
    printf("        VIRTUAL10: %d,\n", VIRTUAL10);
    printf("        OUTPUT_CHANNEL_TAG_OFFSET: %d,\n", OUTPUT_CHANNEL_TAG_OFFSET);
    printf("    },\n");
    SYSTICK_set_callback(dump_javascript_9, 200);
}

static void dump_javascript_9(void) {
    printf("    rf_protocol_type_t: {\n");
    printf("        RF_PROTOCOL_HK310: %d,\n", RF_PROTOCOL_HK310);
    printf("    },\n");
    printf("    operation_type_t: {\n");
    printf("        OP_REPLACE: %d,\n", OP_REPLACE);
    printf("        OP_ADD: %d,\n", OP_ADD);
    printf("        OP_MULTIPLY: %d,\n", OP_MULTIPLY);
    printf("        OP_MIN: %d,\n", OP_MIN);
    printf("        OP_MAX: %d,\n", OP_MAX);
    printf("    },\n");
    printf("    comparison_t: {\n");
    printf("        EQUAL: %d,\n", EQUAL);
    printf("        NON_EQUAL: %d,\n", NON_EQUAL);
    printf("        GREATER: %d,\n", GREATER);
    printf("        GREATER_OR_EQUAL: %d,\n", GREATER_OR_EQUAL);
    printf("        SMALLER: %d,\n", SMALLER);
    printf("        SMALLER_OR_EQUAL: %d,\n", SMALLER_OR_EQUAL);
    printf("    },\n");
    printf("    curve_type_t: {\n");
    printf("        CURVE_NONE: %d,\n", CURVE_NONE);
    printf("        CURVE_FIXED: %d,\n", CURVE_FIXED);
    printf("        CURVE_MIN_MAX: %d,\n", CURVE_MIN_MAX);
    printf("        CURVE_ZERO_MAX: %d,\n", CURVE_ZERO_MAX);
    printf("        CURVE_GT_ZERO: %d,\n", CURVE_GT_ZERO);
    printf("        CURVE_LT_ZERO: %d,\n", CURVE_LT_ZERO);
    printf("        CURVE_ABSVAL: %d,\n", CURVE_ABSVAL);
    printf("        CURVE_EXPO: %d,\n", CURVE_EXPO);
    printf("        CURVE_DEADBAND: %d,\n", CURVE_DEADBAND);
    printf("        CURVE_3POINT: %d,\n", CURVE_3POINT);
    printf("        CURVE_5POINT: %d,\n", CURVE_5POINT);
    printf("        CURVE_7POINT: %d,\n", CURVE_7POINT);
    printf("        CURVE_9POINT: %d,\n", CURVE_9POINT);
    printf("        CURVE_11POINT: %d,\n", CURVE_11POINT);
    printf("        CURVE_13POINT: %d,\n", CURVE_13POINT);
    printf("    },\n");
    printf("    interpolation_type_t: {\n");
    printf("        INTERPOLATION_LINEAR: %d,\n", INTERPOLATION_LINEAR);
    printf("        INTERPOLATION_SMOOTHING: %d,\n", INTERPOLATION_SMOOTHING);
    printf("    },\n");
    printf("};\n");
    SYSTICK_set_callback(dump_javascript_10, 200);
}

static void dump_javascript_10(void) {

    print_separator();
    // SYSTICK_set_callback(dump_javascript_config, 200);
}

static void dump_javascript_config(void)
{
    static size_t offset = 0;
    size_t count_per_run = 12;
    uint8_t *p = (uint8_t *)(&config) + offset;

    if (offset == 0) {
        printf("var TEST_CONFIG_DATA = new Uint8Array([\n    ");
    }

    if (sizeof(config) < (offset + count_per_run)) {
        count_per_run = sizeof(config) - offset;
    }

    for (size_t i = 0; i < count_per_run; i++) {
        printf("0x%02x, ", *p);
        ++p;
    }

    offset += count_per_run;
    if (offset < sizeof(config)) {
        printf("\n    ");
        SYSTICK_set_callback(dump_javascript_config, 10);
    }
    else {
        printf("\n]);\n");
    }
}
