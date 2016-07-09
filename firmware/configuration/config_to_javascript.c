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
    printf("    o: 0, s: %u, c: 1, t: 's',\n", membersizeof(config_t, tx));
    printf("    UUID: {o: %u, s: 1, c: %u, t: 'u'},\n",
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
    printf("    HARDWARE_INPUTS_PCB_INPUT_TYPE: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, tx.hardware_inputs[0].pcb_input.type) - o,
        membersizeof(config_t, tx.hardware_inputs[0].pcb_input.type));
    printf("    HARDWARE_INPUTS_PCB_INPUT_PIN_NAME: {o: %u, s: %u, c: %u, t: 'u'},\n",
        offsetof(config_t, tx.hardware_inputs[0].pcb_input.pin_name) - o,
        sizeof(config.tx.hardware_inputs[0].pcb_input.pin_name[0]),
        membersizeof(config_t, tx.hardware_inputs[0].pcb_input.pin_name) / sizeof(config.tx.hardware_inputs[0].pcb_input.pin_name[0]));
    printf("    HARDWARE_INPUTS_PCB_INPUT_SCHEMATIC_REFERENCE: {o: %u, s: %u, c: %u, t: 'u'},\n",
        offsetof(config_t, tx.hardware_inputs[0].pcb_input.schematic_reference) - o,
        sizeof(config.tx.hardware_inputs[0].pcb_input.schematic_reference[0]),
        membersizeof(config_t, tx.hardware_inputs[0].pcb_input.schematic_reference) / sizeof(config.tx.hardware_inputs[0].pcb_input.schematic_reference[0]));
    printf("    HARDWARE_INPUTS_TYPE: {o: %u, s: %u, c: 1, t: 'u'},\n",
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
    printf("    LOGICAL_INPUTS_TYPE: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, tx.logical_inputs[0].type) - o,
        membersizeof(config_t, tx.logical_inputs[0].type));
    printf("    LOGICAL_INPUTS_SUB_TYPE: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, tx.logical_inputs[0].sub_type) - o,
        membersizeof(config_t, tx.logical_inputs[0].sub_type));
    printf("    LOGICAL_INPUTS_POSITION_COUNT: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, tx.logical_inputs[0].position_count) - o,
        membersizeof(config_t, tx.logical_inputs[0].position_count));
    printf("    LOGICAL_INPUTS_HARDWARE_INPUTS: {o: %u, s: %u, c: %u, t: 'u'},\n",
        offsetof(config_t, tx.logical_inputs[0].hardware_inputs) - o,
        sizeof(port_t),
        membersizeof(config_t, tx.logical_inputs[0].hardware_inputs) / sizeof(port_t));
    printf("    LOGICAL_INPUTS_LABELS_O: {o: %u, s: %u, c: %u, t: 'u'},\n",
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
    printf("};\n\n");

    SYSTICK_set_callback(dump_javascript_3, 200);
}

static void dump_javascript_3(void) {
    size_t o = offsetof(config_t, model);

    printf("var MODEL = {\n");
    printf("    o: 0, s: %u, c: 1, t: 's',\n", membersizeof(config_t, model));
    printf("    UUID: {o: %u, s: 1, c: %u, t: 'u'},\n",
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
    printf("    MIXER_UNITS_CURVE_TYPE: {o: %u, s: %u, c: 1, t: 's'},\n",
        offsetof(config_t, model.mixer_units[0].curve.type) - o,
        membersizeof(config_t, model.mixer_units[0].curve.type));
    printf("    MIXER_UNITS_CURVE_SMOOTHING: {o: %u, s: %u, c: 1, t: 's'},\n",
        offsetof(config_t, model.mixer_units[0].curve.smoothing) - o,
        membersizeof(config_t, model.mixer_units[0].curve.smoothing));
    printf("    MIXER_UNITS_CURVE_POINTS: {o: %u, s: %u, c: 1, t: 's'},\n",
        offsetof(config_t, model.mixer_units[0].curve.points) - o,
        membersizeof(config_t, model.mixer_units[0].curve.points));

    SYSTICK_set_callback(dump_javascript_4, 300);
}

static void dump_javascript_4(void) {
    size_t o = offsetof(config_t, model);

    printf("    MIXER_UNITS_SRC: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, model.mixer_units[0].src) - o,
        membersizeof(config_t, model.mixer_units[0].src));
    printf("    MIXER_UNITS_DST: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, model.mixer_units[0].dst) - o,
        membersizeof(config_t, model.mixer_units[0].dst));
    printf("    MIXER_UNITS_SW: {o: %u, s: %u, c: 1, t: 's'},\n",
        offsetof(config_t, model.mixer_units[0].sw) - o,
        membersizeof(config_t, model.mixer_units[0].sw));
    printf("    MIXER_UNITS_SW_SW: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, model.mixer_units[0].sw.sw) - o,
        membersizeof(config_t, model.mixer_units[0].sw.sw));
    printf("    MIXER_UNITS_SW_CMP: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, model.mixer_units[0].sw.cmp) - o,
        membersizeof(config_t, model.mixer_units[0].sw.cmp));
    printf("    MIXER_UNITS_SW_VALUE: {o: %u, s: %u, c: 1, t: 'u'},\n",
        offsetof(config_t, model.mixer_units[0].sw.value) - o,
        membersizeof(config_t, model.mixer_units[0].sw.value));
    printf("    MIXER_UNITS_OP: {o: %u, s: %u, c: 1, t: 'u'},\n",
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
    printf("    LIMITS_EP_R: {o: %u, s: %u, c: 1, t: 'i'},\n",
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
    printf("    RF_PROTOCOL_TYPE: {o: %u, s: %u, c: 1, t: 'u'},\n",
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
    printf("};\n");
    SYSTICK_set_callback(dump_javascript_6, 300);
}

static void dump_javascript_6(void) {
    print_separator();
    SYSTICK_set_callback(dump_javascript_config, 200);
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
