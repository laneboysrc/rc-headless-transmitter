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

    sync_printf("module.exports = new Uint8Array([\n");

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

    sync_printf("]);\n");
}


// ****************************************************************************
void CONFIG_dump_javascript_information(void)
{
    // Member
    const char *m = "            %s: {t: '%s', o: %u, s: %u, c: %u},\n";
    // Member with human readable string
    const char *h = "            %s: {t: '%s', h: '%s', o: %u, s: %u, c: %u},\n";
    // Named type entry
    const char *t = "                '%s': %d,\n";

    print_separator();

    sync_printf("var CONFIG_VERSIONS = {\n"
        "    1: {\n"
        "        // Legend:\n"
        "        // o: offset with the parent structure\n"
        "        // s: element size (number of bytes)\n"
        "        // c: count (number of elements)\n"
        "        // h: human-friendly name (optional)\n"
        "        // t: type\n"
        "        //   'u': unsigned integer\n"
        "        //   'i': signed integer\n"
        "        //   'c': string (Note: may not be 0 terminated if it fills the element)\n"
        "        //   'uuid': 64-bit (8 bytes) universally unique identifier\n"
        "        //   'CONFIG': schema describes the overall config structure\n"
        "        //   'TX': schema describes a transmitter\n"
        "        //   'MODEL': schema describes a model\n"
        "        //   any other value: refers to named elements in TYPES[]\n\n");

    sync_printf("        CONFIG: { t: 'CONFIG', o: 0, s: %u, c: 1,\n", sizeof(config));
    sync_printf("            VERSION: {o: %u, s: %u, c: 1, t: 'u'},\n", offsetof(config_t, version), membersizeof(config_t, version));
    sync_printf("            TX: {o: %u, s: %u, c: 1, t: 's'},\n", offsetof(config_t, tx), membersizeof(config_t, tx));
    sync_printf("            MODEL: {o: %u, s: %u, c: 1, t: 's'},\n", offsetof(config_t, model), membersizeof(config_t, model));
    sync_printf("        },\n\n");


    sync_printf("        TX: { o: %u, s: %u, c: 1, t: 'TX',\n", offsetof(config_t, tx), sizeof(tx_t));

    sync_printf(m, "UUID", "uuid",
        offsetof(tx_t, uuid),
        1,
        membersizeof(tx_t, uuid));

    sync_printf(m, "NAME", "c",
        offsetof(tx_t, name),
        1,
        membersizeof(tx_t, name));

    sync_printf(m, "LAST_CHANGED", "u",
        offsetof(tx_t, last_changed),
        membersizeof(tx_t, last_changed),
        1);

    sync_printf(m, "TAG", "u",
        offsetof(tx_t, tag),
        membersizeof(tx_t, tag),
        1);

    sync_printf(m, "HARDWARE_INPUTS", "s",
        offsetof(tx_t, hardware_inputs),
        sizeof(hardware_input_t),
        membersizeof(tx_t, hardware_inputs) / sizeof(hardware_input_t));

    sync_printf(m, "HARDWARE_INPUTS_PCB_INPUT", "s",
        offsetof(tx_t, hardware_inputs[0].pcb_input),
        membersizeof(tx_t, hardware_inputs[0].pcb_input),
        1);

    sync_printf(m, "HARDWARE_INPUTS_PCB_INPUT_GPIOPORT", "u",
        offsetof(tx_t, hardware_inputs[0].pcb_input.gpioport),
        membersizeof(tx_t, hardware_inputs[0].pcb_input.gpioport),
        1);

    sync_printf(m, "HARDWARE_INPUTS_PCB_INPUT_GPIO", "u",
        offsetof(tx_t, hardware_inputs[0].pcb_input.gpio),
        membersizeof(tx_t, hardware_inputs[0].pcb_input.gpio),
        1);

    sync_printf(m, "HARDWARE_INPUTS_PCB_INPUT_ADC_CHANNEL", "u",
        offsetof(tx_t, hardware_inputs[0].pcb_input.adc_channel),
        membersizeof(tx_t, hardware_inputs[0].pcb_input.adc_channel),
        1);

    sync_printf(m, "HARDWARE_INPUTS_PCB_INPUT_TYPE", "pcb_input_type_t",
        offsetof(tx_t, hardware_inputs[0].pcb_input.type),
        membersizeof(tx_t, hardware_inputs[0].pcb_input.type),
        1);

    sync_printf(m, "HARDWARE_INPUTS_PCB_INPUT_PIN_NAME", "c",
        offsetof(tx_t, hardware_inputs[0].pcb_input.pin_name),
        1,
        membersizeof(tx_t, hardware_inputs[0].pcb_input.pin_name) / sizeof(config.tx.hardware_inputs[0].pcb_input.pin_name[0]));

    sync_printf(m, "HARDWARE_INPUTS_PCB_INPUT_SCHEMATIC_REFERENCE", "c",
        offsetof(tx_t, hardware_inputs[0].pcb_input.schematic_reference),
        1,
        membersizeof(tx_t, hardware_inputs[0].pcb_input.schematic_reference) / sizeof(config.tx.hardware_inputs[0].pcb_input.schematic_reference[0]));

    sync_printf(m, "HARDWARE_INPUTS_TYPE", "hardware_input_type_t",
        offsetof(tx_t, hardware_inputs[0].type),
        membersizeof(tx_t, hardware_inputs[0].type),
        1);

    sync_printf(m, "HARDWARE_INPUTS_CALIBRATION", "u",
        offsetof(tx_t, hardware_inputs[0].calibration),
        sizeof(config.tx.hardware_inputs[0].calibration[0]),
        membersizeof(tx_t, hardware_inputs[0].calibration) / sizeof(config.tx.hardware_inputs[0].calibration[0]));

    sync_printf(m, "LOGICAL_INPUTS", "s",
        offsetof(tx_t, logical_inputs),
        sizeof(logical_input_t),
        membersizeof(tx_t, logical_inputs) / sizeof(logical_input_t));

    sync_printf(m, "LOGICAL_INPUTS_TYPE", "input_type_t", "Input type"
        offsetof(tx_t, logical_inputs[0].type),
        membersizeof(tx_t, logical_inputs[0].type),
        1);

    sync_printf(m, "LOGICAL_INPUTS_SUB_TYPE", "input_sub_type_t", "Push-button behavior"
        offsetof(tx_t, logical_inputs[0].sub_type),
        membersizeof(tx_t, logical_inputs[0].sub_type),
        1);

    sync_printf(m, "LOGICAL_INPUTS_POSITION_COUNT", "u",
        offsetof(tx_t, logical_inputs[0].position_count),
        membersizeof(tx_t, logical_inputs[0].position_count),
        1);

    sync_printf(m, "LOGICAL_INPUTS_HARDWARE_INPUTS", "u", "Hardware inputs"
        offsetof(tx_t, logical_inputs[0].hardware_inputs),
        sizeof(port_t),
        membersizeof(tx_t, logical_inputs[0].hardware_inputs) / sizeof(port_t));

    sync_printf(m, "LOGICAL_INPUTS_LABELS", "input_label_t", "Input labels",
        offsetof(tx_t, logical_inputs[0].labels),
        sizeof(input_label_t),
        membersizeof(tx_t, logical_inputs[0].labels) / sizeof(input_label_t));

    sync_printf(m, "TRIM_RANGE", "i",
        offsetof(tx_t, trim_range),
        membersizeof(tx_t, trim_range),
        1);

    sync_printf(m, "TRIM_STEP_SIZE", "i",
        offsetof(tx_t, trim_step_size),
        membersizeof(tx_t, trim_step_size),
        1);

    sync_printf(m, "BIND_TIMEOUT_MS", "u",
        offsetof(tx_t, bind_timeout_ms),
        membersizeof(tx_t, bind_timeout_ms),
        1);

    sync_printf(m, "DOUBLE_CLICK_TIMEOUT_MS", "u",
        offsetof(tx_t, double_click_timeout_ms),
        membersizeof(tx_t, double_click_timeout_ms),
        1);

    sync_printf(m, "PASSPHRASE", "u",
        offsetof(tx_t, passphrase),
        membersizeof(tx_t, passphrase),
        1);

    sync_printf(m, "LED_PWM_PERCENT", "u",
        offsetof(tx_t, led_pwm_percent),
        membersizeof(tx_t, led_pwm_percent),
        1);

    sync_printf("        },\n\n");

    sync_printf("        MODEL: { o: %u, s: %u, c: 1, t: 'MODEL',\n",
        offsetof(config_t, model), membersizeof(config_t, model));

    sync_printf(m, "UUID", "uuid",
        offsetof(model_t, uuid),
        1,
        membersizeof(model_t, uuid));

    sync_printf(m, "NAME", "c",
        offsetof(model_t, name),
        1,
        membersizeof(model_t, name));

    sync_printf(m, "LAST_CHANGED", "u",
        offsetof(model_t, last_changed),
        membersizeof(model_t, last_changed),
        1);

    sync_printf(m, "TAG", "u",
        offsetof(model_t, tag),
        membersizeof(model_t, tag),
        1);

    sync_printf(m, "MIXER_UNITS", "s",
        offsetof(model_t, mixer_units),
        sizeof(mixer_unit_t),
        membersizeof(model_t, mixer_units) / sizeof(mixer_unit_t));

    sync_printf(m, "MIXER_UNITS_CURVE", "s",
        offsetof(model_t, mixer_units[0].curve),
        membersizeof(model_t, mixer_units[0].curve),
        1);

    sync_printf(m, "MIXER_UNITS_CURVE_TYPE", "curve_type_t",
        offsetof(model_t, mixer_units[0].curve.type),
        membersizeof(model_t, mixer_units[0].curve.type),
        1);

    sync_printf(m, "MIXER_UNITS_CURVE_SMOOTHING", "interpolation_type_t",
        offsetof(model_t, mixer_units[0].curve.smoothing),
        membersizeof(model_t, mixer_units[0].curve.smoothing),
        1);

    sync_printf(m, "MIXER_UNITS_CURVE_POINTS", "i",
        offsetof(model_t, mixer_units[0].curve.points),
        sizeof(config.model.mixer_units[0].curve.points[0]),
        membersizeof(model_t, mixer_units[0].curve.points) / sizeof(config.model.mixer_units[0].curve.points[0]));

    sync_printf(h, "MIXER_UNITS_SRC", "src_label_t", "Source",
        offsetof(model_t, mixer_units[0].src),
        membersizeof(model_t, mixer_units[0].src),
        1);

    sync_printf(h, "MIXER_UNITS_DST", "channel_label_t", "Destination",
        offsetof(model_t, mixer_units[0].dst),
        membersizeof(model_t, mixer_units[0].dst),
        1);

    sync_printf(m, "MIXER_UNITS_SW", "s",
        offsetof(model_t, mixer_units[0].sw),
        membersizeof(model_t, mixer_units[0].sw),
        1);

    sync_printf(h, "MIXER_UNITS_SW_SW", "switch_label_t", "Switch",
        offsetof(model_t, mixer_units[0].sw.sw),
        membersizeof(model_t, mixer_units[0].sw.sw),
        1);

    sync_printf(h, "MIXER_UNITS_SW_CMP", "comparison_t", "Comparison",
        offsetof(model_t, mixer_units[0].sw.cmp),
        membersizeof(model_t, mixer_units[0].sw.cmp),
        1);

    sync_printf(m, "MIXER_UNITS_SW_VALUE", "u",
        offsetof(model_t, mixer_units[0].sw.value),
        membersizeof(model_t, mixer_units[0].sw.value),
        1);

    sync_printf(h, "MIXER_UNITS_OP", "operation_type_t", "Operation",
        offsetof(model_t, mixer_units[0].op),
        membersizeof(model_t, mixer_units[0].op),
        1);

    sync_printf(m, "MIXER_UNITS_SCALAR", "i",
        offsetof(model_t, mixer_units[0].scalar),
        membersizeof(model_t, mixer_units[0].scalar),
        1);

    sync_printf(m, "MIXER_UNITS_OFFSET", "i",
        offsetof(model_t, mixer_units[0].offset),
        membersizeof(model_t, mixer_units[0].offset),
        1);

    sync_printf(m, "MIXER_UNITS_TAG", "u",
        offsetof(model_t, mixer_units[0].tag),
        membersizeof(model_t, mixer_units[0].tag),
        1);

    sync_printf(m, "MIXER_UNITS_INVERT_SOURCE", "u",
        offsetof(model_t, mixer_units[0].invert_source),
        membersizeof(model_t, mixer_units[0].invert_source),
        1);

    sync_printf(m, "MIXER_UNITS_APPLY_TRIM", "u",
        offsetof(model_t, mixer_units[0].apply_trim),
        membersizeof(model_t, mixer_units[0].apply_trim),
        1);

    sync_printf(m, "LIMITS", "s",
        offsetof(model_t, limits),
        sizeof(limits_t),
        membersizeof(model_t, limits) / sizeof(limits_t));

    sync_printf(m, "LIMITS_EP_L", "i",
        offsetof(model_t, limits[0].ep_l),
        membersizeof(model_t, limits[0].ep_l),
        1);

    sync_printf(m, "LIMITS_EP_H", "i",
        offsetof(model_t, limits[0].ep_h),
        membersizeof(model_t, limits[0].ep_h),
        1);

    sync_printf(m, "LIMITS_SUBTRIM", "i",
        offsetof(model_t, limits[0].subtrim),
        membersizeof(model_t, limits[0].subtrim),
        1);

    sync_printf(m, "LIMITS_LIMIT_L", "i",
        offsetof(model_t, limits[0].limit_l),
        membersizeof(model_t, limits[0].limit_l),
        1);

    sync_printf(m, "LIMITS_LIMIT_H", "i",
        offsetof(model_t, limits[0].limit_h),
        membersizeof(model_t, limits[0].limit_h),
        1);

    sync_printf(m, "LIMITS_FAILSAFE", "i",
        offsetof(model_t, limits[0].failsafe),
        membersizeof(model_t, limits[0].failsafe),
        1);

    sync_printf(m, "LIMITS_SPEED", "u",
        offsetof(model_t, limits[0].speed),
        membersizeof(model_t, limits[0].speed),
        1);

    sync_printf(m, "LIMITS_INVERT", "u",
        offsetof(model_t, limits[0].invert),
        membersizeof(model_t, limits[0].invert),
        1);

    sync_printf(m, "RF_PROTOCOL_TYPE", "rf_protocol_type_t",
        offsetof(model_t, rf_protocol_type),
        membersizeof(model_t, rf_protocol_type),
        1);

    sync_printf(m, "RF", "s",
        offsetof(model_t, rf),
        membersizeof(model_t, rf),
        1);

    sync_printf(m, "RF_PROTOCOL_HK310", "s",
        offsetof(model_t, rf.protocol_hk310),
        membersizeof(model_t, rf.protocol_hk310),
        1);

    sync_printf(m, "RF_PROTOCOL_HK310_HOP_CHANNELS", "u",
        offsetof(model_t, rf.protocol_hk310.hop_channels),
        sizeof(config.model.rf.protocol_hk310.hop_channels[0]),
        membersizeof(model_t, rf.protocol_hk310.hop_channels));

    sync_printf(m, "RF_PROTOCOL_HK310_ADDRESS", "u",
        offsetof(model_t, rf.protocol_hk310.address),
        sizeof(config.model.rf.protocol_hk310.address[0]),
        membersizeof(model_t, rf.protocol_hk310.address));

    sync_printf("        },\n\n");

    sync_printf("        TYPES: {\n");
    sync_printf("            pcb_input_type_t: {\n");
    // sync_printf(t, "Input not present", PCB_INPUT_NOT_USED); // Hide from UI
    sync_printf(t, "Analog/Digital", ANALOG_DIGITAL);
    sync_printf(t, "Digital", DIGITAL);
    sync_printf("            },\n");

    sync_printf("            hardware_input_type_t: {\n");
    sync_printf(t, "Input not used", TRANSMITTER_INPUT_NOT_USED);
    sync_printf(t, "Analog, returns to center", ANALOG_WITH_CENTER_AUTO_RETURN);
    sync_printf(t, "Analog, center detent", ANALOG_WITH_CENTER);
    sync_printf(t, "Analog", ANALOG_NO_CENTER);
    sync_printf(t, "Analog, positive only", ANALOG_NO_CENTER_POSITIVE_ONLY);
    sync_printf(t, "On/Off switch", SWITCH_ON_OFF);
    sync_printf(t, "On/Off/On switch", SWITCH_ON_OPEN_OFF);
    sync_printf(t, "Push-button", MOMENTARY_ON_OFF);
    sync_printf("            },\n");

    // Same as hardware_input_type_t, but analog items removed
    sync_printf("            hardware_input_type_t_digital: {\n");
    sync_printf(t, "Input not used", TRANSMITTER_INPUT_NOT_USED);
    sync_printf(t, "On/Off switch", SWITCH_ON_OFF);
    sync_printf(t, "On/Off/On switch", SWITCH_ON_OPEN_OFF);
    sync_printf(t, "Push-button", MOMENTARY_ON_OFF);
    sync_printf("            },\n");

    sync_printf("            input_type_t: {\n");
    // sync_printf(t, "Input not used", LOGICAL_INPUT_NOT_USED); // Hide from UI
    sync_printf(t, "Analog", ANALOG);
    sync_printf(t, "Switch", SWITCH);
    sync_printf(t, "BCD switch", BCD_SWITCH);
    sync_printf(t, "Momentary switch", MOMENTARY);
    sync_printf(t, "Trim", TRIM);
    sync_printf("            },\n");

    sync_printf("            input_sub_type_t: {\n");
    // sync_printf(t, "SUB_TYPE_NOT_APPLICABLE", SUB_TYPE_NOT_APPLICABLE); // Hide from UI
    sync_printf(t, "Up/Down buttons", UP_DOWN_BUTTONS);
    sync_printf(t, "Increment-and-loop", INCREMENT_AND_LOOP);
    sync_printf(t, "Decrement-and-loop", DECREMENT_AND_LOOP);
    sync_printf(t, "Sawtooth", SAW_TOOTH);
    sync_printf(t, "Double-click for decrement", DOUBLE_CLICK_DECREMENT);
    sync_printf("            },\n");

    sync_printf("            input_label_t: {\n");
    // sync_printf(t, "NONE", NONE); // Hide from UI
    sync_printf(t, "ST", ST);
    sync_printf(t, "TH", TH);
    sync_printf(t, "THR", THR);
    sync_printf(t, "RUD", RUD);
    sync_printf(t, "AIL", AIL);
    sync_printf(t, "ELE", ELE);
    sync_printf(t, "AUX", AUX);
    sync_printf(t, "ST-DR", ST_DR);
    sync_printf(t, "RUD-DR", RUD_DR);
    sync_printf(t, "AIL-DR", AIL_DR);
    sync_printf(t, "ELE-DR", ELE_DR);
    sync_printf(t, "TH-DR", TH_DR);
    sync_printf(t, "THR-DR", THR_DR);
    sync_printf(t, "TH-HOLD", TH_HOLD);
    sync_printf(t, "GEAR", GEAR);
    sync_printf(t, "FLAPS", FLAPS);
    sync_printf(t, "TRAINER", TRAINER);
    sync_printf(t, "SIDE-L", SIDE_L);
    sync_printf(t, "SIDE-R", SIDE_R);
    sync_printf(t, "POT1", POT1);
    sync_printf(t, "POT2", POT2);
    sync_printf(t, "POT3", POT3);
    sync_printf(t, "POT4", POT4);
    sync_printf(t, "POT5", POT5);
    sync_printf(t, "POT6", POT6);
    sync_printf(t, "POT7", POT7);
    sync_printf(t, "POT8", POT8);
    sync_printf(t, "POT9", POT9);
    sync_printf(t, "SW1", SW1);
    sync_printf(t, "SW2", SW2);
    sync_printf(t, "SW3", SW3);
    sync_printf(t, "SW4", SW4);
    sync_printf(t, "SW5", SW5);
    sync_printf(t, "SW7", SW7);
    sync_printf(t, "SW8", SW8);
    sync_printf(t, "SW9", SW9);
    sync_printf("            },\n");

    // switch_label_t is the same as input_label_t, but this time the NONE
    // element is present as the user can select it in the UI. Note that his
    // type does not really exist in the firmware, it is just added for
    // convenience in the configurator.
    sync_printf("            switch_label_t: {\n");
    sync_printf(t, "NONE", NONE);
    sync_printf(t, "ST", ST);
    sync_printf(t, "TH", TH);
    sync_printf(t, "THR", THR);
    sync_printf(t, "RUD", RUD);
    sync_printf(t, "AIL", AIL);
    sync_printf(t, "ELE", ELE);
    sync_printf(t, "AUX", AUX);
    sync_printf(t, "ST-DR", ST_DR);
    sync_printf(t, "RUD-DR", RUD_DR);
    sync_printf(t, "AIL-DR", AIL_DR);
    sync_printf(t, "ELE-DR", ELE_DR);
    sync_printf(t, "TH-DR", TH_DR);
    sync_printf(t, "THR-DR", THR_DR);
    sync_printf(t, "TH-HOLD", TH_HOLD);
    sync_printf(t, "GEAR", GEAR);
    sync_printf(t, "FLAPS", FLAPS);
    sync_printf(t, "TRAINER", TRAINER);
    sync_printf(t, "SIDE-L", SIDE_L);
    sync_printf(t, "SIDE-R", SIDE_R);
    sync_printf(t, "POT1", POT1);
    sync_printf(t, "POT2", POT2);
    sync_printf(t, "POT3", POT3);
    sync_printf(t, "POT4", POT4);
    sync_printf(t, "POT5", POT5);
    sync_printf(t, "POT6", POT6);
    sync_printf(t, "POT7", POT7);
    sync_printf(t, "POT8", POT8);
    sync_printf(t, "POT9", POT9);
    sync_printf(t, "SW1", SW1);
    sync_printf(t, "SW2", SW2);
    sync_printf(t, "SW3", SW3);
    sync_printf(t, "SW4", SW4);
    sync_printf(t, "SW5", SW5);
    sync_printf(t, "SW7", SW7);
    sync_printf(t, "SW8", SW8);
    sync_printf(t, "SW9", SW9);
    sync_printf("            },\n");

    sync_printf("            channel_label_t: {\n");
    sync_printf(t, "CH1", CH1);
    sync_printf(t, "CH2", CH2);
    sync_printf(t, "CH3", CH3);
    sync_printf(t, "CH4", CH4);
    sync_printf(t, "CH5", CH5);
    sync_printf(t, "CH6", CH6);
    sync_printf(t, "CH7", CH7);
    sync_printf(t, "CH8", CH8);
    sync_printf(t, "VIRTUAL1", VIRTUAL1);
    sync_printf(t, "VIRTUAL2", VIRTUAL2);
    sync_printf(t, "VIRTUAL3", VIRTUAL3);
    sync_printf(t, "VIRTUAL4", VIRTUAL4);
    sync_printf(t, "VIRTUAL5", VIRTUAL5);
    sync_printf(t, "VIRTUAL6", VIRTUAL6);
    sync_printf(t, "VIRTUAL7", VIRTUAL7);
    sync_printf(t, "VIRTUAL8", VIRTUAL8);
    sync_printf(t, "VIRTUAL9", VIRTUAL9);
    sync_printf(t, "VIRTUAL10", VIRTUAL10);

    // NOTE: skip hidden channels, they are not needed in the UI
    // sync_printf(t, "HIDDEN1", CH_HIDDEN1);
    // sync_printf(t, "HIDDEN2", CH_HIDDEN2);
    // sync_printf(t, "HIDDEN3", CH_HIDDEN3);
    // sync_printf(t, "HIDDEN4", CH_HIDDEN4);
    // sync_printf(t, "HIDDEN5", CH_HIDDEN5);
    // sync_printf(t, "HIDDEN6", CH_HIDDEN6);
    // sync_printf(t, "HIDDEN7", CH_HIDDEN7);
    // sync_printf(t, "HIDDEN8", CH_HIDDEN8);
    // sync_printf(t, "HIDDEN9", CH_HIDDEN9);
    // sync_printf(t, "HIDDEN10", CH_HIDDEN10);
    // sync_printf(t, "HIDDEN11", CH_HIDDEN11);
    // sync_printf(t, "HIDDEN12", CH_HIDDEN12);
    // sync_printf(t, "HIDDEN13", CH_HIDDEN13);
    // sync_printf(t, "HIDDEN14", CH_HIDDEN14);
    // sync_printf(t, "HIDDEN15", CH_HIDDEN15);
    // sync_printf(t, "HIDDEN16", CH_HIDDEN16);
    // sync_printf(t, "HIDDEN17", CH_HIDDEN17);
    // sync_printf(t, "HIDDEN18", CH_HIDDEN18);
    // sync_printf(t, "HIDDEN19", CH_HIDDEN19);
    // sync_printf(t, "HIDDEN20", CH_HIDDEN20);
    // sync_printf(t, "HIDDEN21", CH_HIDDEN21);
    // sync_printf(t, "HIDDEN22", CH_HIDDEN22);
    // sync_printf(t, "HIDDEN23", CH_HIDDEN23);
    // sync_printf(t, "HIDDEN24", CH_HIDDEN24);
    // sync_printf(t, "HIDDEN25", CH_HIDDEN25);
    // sync_printf(t, "HIDDEN26", CH_HIDDEN26);
    // sync_printf(t, "HIDDEN27", CH_HIDDEN27);
    // sync_printf(t, "HIDDEN28", CH_HIDDEN28);
    // sync_printf(t, "HIDDEN29", CH_HIDDEN29);
    // sync_printf(t, "HIDDEN30", CH_HIDDEN30);
    // sync_printf(t, "HIDDEN31", CH_HIDDEN31);
    // sync_printf(t, "HIDDEN32", CH_HIDDEN32);
    // sync_printf(t, "HIDDEN33", CH_HIDDEN33);
    // sync_printf(t, "HIDDEN34", CH_HIDDEN34);
    // sync_printf(t, "HIDDEN35", CH_HIDDEN35);
    // sync_printf(t, "HIDDEN36", CH_HIDDEN36);
    // sync_printf(t, "HIDDEN37", CH_HIDDEN37);
    // sync_printf(t, "HIDDEN38", CH_HIDDEN38);
    // sync_printf(t, "HIDDEN39", CH_HIDDEN39);
    // sync_printf(t, "HIDDEN40", CH_HIDDEN40);
    // sync_printf(t, "HIDDEN41", CH_HIDDEN41);
    // sync_printf(t, "HIDDEN42", CH_HIDDEN42);
    // sync_printf(t, "HIDDEN43", CH_HIDDEN43);
    // sync_printf(t, "HIDDEN44", CH_HIDDEN44);
    // sync_printf(t, "HIDDEN45", CH_HIDDEN45);
    // sync_printf(t, "HIDDEN46", CH_HIDDEN46);
    // sync_printf(t, "HIDDEN47", CH_HIDDEN47);
    // sync_printf(t, "HIDDEN48", CH_HIDDEN48);
    // sync_printf(t, "HIDDEN49", CH_HIDDEN49);
    // sync_printf(t, "HIDDEN50", CH_HIDDEN50);
    sync_printf("            },\n");

    sync_printf("            src_label_t: {\n");
    // sync_printf(t, "NONE", SRC_NONE);    // src_label_t NONE must not be used in the UI
    // sync_printf(t, "NONE", IN_NONE);     // input_label_t NONE must not be used in the UI
    sync_printf(t, "ST", IN_ST);
    sync_printf(t, "TH", IN_TH);
    sync_printf(t, "THR", IN_THR);
    sync_printf(t, "RUD", IN_RUD);
    sync_printf(t, "AIL", IN_AIL);
    sync_printf(t, "ELE", IN_ELE);
    sync_printf(t, "AUX", IN_AUX);
    sync_printf(t, "ST-DR", IN_ST_DR);
    sync_printf(t, "RUD-DR", IN_RUD_DR);
    sync_printf(t, "AIL-DR", IN_AIL_DR);
    sync_printf(t, "ELE-DR", IN_ELE_DR);
    sync_printf(t, "TH-DR", IN_TH_DR);
    sync_printf(t, "THR-DR", IN_THR_DR);
    sync_printf(t, "TH-HOLD", IN_TH_HOLD);
    sync_printf(t, "GEAR", IN_GEAR);
    sync_printf(t, "FLAPS", IN_FLAPS);
    sync_printf(t, "TRAINER", IN_TRAINER);
    sync_printf(t, "SIDE-L", IN_SIDE_L);
    sync_printf(t, "SIDE-R", IN_SIDE_R);
    sync_printf(t, "POT1", IN_POT1);
    sync_printf(t, "POT2", IN_POT2);
    sync_printf(t, "POT3", IN_POT3);
    sync_printf(t, "POT4", IN_POT4);
    sync_printf(t, "POT5", IN_POT5);
    sync_printf(t, "POT6", IN_POT6);
    sync_printf(t, "POT7", IN_POT7);
    sync_printf(t, "POT8", IN_POT8);
    sync_printf(t, "POT9", IN_POT9);
    sync_printf(t, "SW1", IN_SW1);
    sync_printf(t, "SW2", IN_SW2);
    sync_printf(t, "SW3", IN_SW3);
    sync_printf(t, "SW4", IN_SW4);
    sync_printf(t, "SW5", IN_SW5);
    sync_printf(t, "SW7", IN_SW7);
    sync_printf(t, "SW8", IN_SW8);
    sync_printf(t, "SW9", IN_SW9);

    sync_printf(t, "CH1", CH_CH1);
    sync_printf(t, "CH2", CH_CH2);
    sync_printf(t, "CH3", CH_CH3);
    sync_printf(t, "CH4", CH_CH4);
    sync_printf(t, "CH5", CH_CH5);
    sync_printf(t, "CH6", CH_CH6);
    sync_printf(t, "CH7", CH_CH7);
    sync_printf(t, "CH8", CH_CH8);
    sync_printf(t, "VIRTUAL1", CH_VIRTUAL1);
    sync_printf(t, "VIRTUAL2", CH_VIRTUAL2);
    sync_printf(t, "VIRTUAL3", CH_VIRTUAL3);
    sync_printf(t, "VIRTUAL4", CH_VIRTUAL4);
    sync_printf(t, "VIRTUAL5", CH_VIRTUAL5);
    sync_printf(t, "VIRTUAL6", CH_VIRTUAL6);
    sync_printf(t, "VIRTUAL7", CH_VIRTUAL7);
    sync_printf(t, "VIRTUAL8", CH_VIRTUAL8);
    sync_printf(t, "VIRTUAL9", CH_VIRTUAL9);
    sync_printf(t, "VIRTUAL10", CH_VIRTUAL10);
    // NOTE: Skip hidden channels, they are not needed in the UI
    // sync_printf(t, "HIDDEN1", CH_HIDDEN1);
    // sync_printf(t, "HIDDEN2", CH_HIDDEN2);
    // sync_printf(t, "HIDDEN3", CH_HIDDEN3);
    // sync_printf(t, "HIDDEN4", CH_HIDDEN4);
    // sync_printf(t, "HIDDEN5", CH_HIDDEN5);
    // sync_printf(t, "HIDDEN6", CH_HIDDEN6);
    // sync_printf(t, "HIDDEN7", CH_HIDDEN7);
    // sync_printf(t, "HIDDEN8", CH_HIDDEN8);
    // sync_printf(t, "HIDDEN9", CH_HIDDEN9);
    // sync_printf(t, "HIDDEN10", CH_HIDDEN10);
    // sync_printf(t, "HIDDEN11", CH_HIDDEN11);
    // sync_printf(t, "HIDDEN12", CH_HIDDEN12);
    // sync_printf(t, "HIDDEN13", CH_HIDDEN13);
    // sync_printf(t, "HIDDEN14", CH_HIDDEN14);
    // sync_printf(t, "HIDDEN15", CH_HIDDEN15);
    // sync_printf(t, "HIDDEN16", CH_HIDDEN16);
    // sync_printf(t, "HIDDEN17", CH_HIDDEN17);
    // sync_printf(t, "HIDDEN18", CH_HIDDEN18);
    // sync_printf(t, "HIDDEN19", CH_HIDDEN19);
    // sync_printf(t, "HIDDEN20", CH_HIDDEN20);
    // sync_printf(t, "HIDDEN21", CH_HIDDEN21);
    // sync_printf(t, "HIDDEN22", CH_HIDDEN22);
    // sync_printf(t, "HIDDEN23", CH_HIDDEN23);
    // sync_printf(t, "HIDDEN24", CH_HIDDEN24);
    // sync_printf(t, "HIDDEN25", CH_HIDDEN25);
    // sync_printf(t, "HIDDEN26", CH_HIDDEN26);
    // sync_printf(t, "HIDDEN27", CH_HIDDEN27);
    // sync_printf(t, "HIDDEN28", CH_HIDDEN28);
    // sync_printf(t, "HIDDEN29", CH_HIDDEN29);
    // sync_printf(t, "HIDDEN30", CH_HIDDEN30);
    // sync_printf(t, "HIDDEN31", CH_HIDDEN31);
    // sync_printf(t, "HIDDEN32", CH_HIDDEN32);
    // sync_printf(t, "HIDDEN33", CH_HIDDEN33);
    // sync_printf(t, "HIDDEN34", CH_HIDDEN34);
    // sync_printf(t, "HIDDEN35", CH_HIDDEN35);
    // sync_printf(t, "HIDDEN36", CH_HIDDEN36);
    // sync_printf(t, "HIDDEN37", CH_HIDDEN37);
    // sync_printf(t, "HIDDEN38", CH_HIDDEN38);
    // sync_printf(t, "HIDDEN39", CH_HIDDEN39);
    // sync_printf(t, "HIDDEN40", CH_HIDDEN40);
    // sync_printf(t, "HIDDEN41", CH_HIDDEN41);
    // sync_printf(t, "HIDDEN42", CH_HIDDEN42);
    // sync_printf(t, "HIDDEN43", CH_HIDDEN43);
    // sync_printf(t, "HIDDEN44", CH_HIDDEN44);
    // sync_printf(t, "HIDDEN45", CH_HIDDEN45);
    // sync_printf(t, "HIDDEN46", CH_HIDDEN46);
    // sync_printf(t, "HIDDEN47", CH_HIDDEN47);
    // sync_printf(t, "HIDDEN48", CH_HIDDEN48);
    // sync_printf(t, "HIDDEN49", CH_HIDDEN49);
    // sync_printf(t, "HIDDEN50", CH_HIDDEN50);

    // NOTE: Skip RF channels, they are not needed in the UI
    // sync_printf(t, "RF-CH1", RF_CH1);
    // sync_printf(t, "RF-CH2", RF_CH2);
    // sync_printf(t, "RF-CH3", RF_CH3);
    // sync_printf(t, "RF-CH4", RF_CH4);
    // sync_printf(t, "RF-CH5", RF_CH5);
    // sync_printf(t, "RF-CH6", RF_CH6);
    // sync_printf(t, "RF-CH7", RF_CH7);
    // sync_printf(t, "RF-CH8", RF_CH8);

    // NOTE: Skip Battery voltage, it is not needed in the UI
    // sync_printf(t, "Battery (mV)", BATTERY_MV);
    sync_printf("            },\n");

    sync_printf("            rf_protocol_type_t: {\n");
    sync_printf(t, "HobbyKing HKR3000", RF_PROTOCOL_HK310);
    sync_printf("            },\n");

    sync_printf("            operation_type_t: {\n");
    sync_printf(t, "=", OP_REPLACE);
    sync_printf(t, "+", OP_ADD);
    sync_printf(t, "*", OP_MULTIPLY);
    sync_printf(t, "MIN", OP_MIN);
    sync_printf(t, "MAX", OP_MAX);
    sync_printf("            },\n");

    sync_printf("            comparison_t: {\n");
    sync_printf(t, "==", EQUAL);
    sync_printf(t, "!=", NON_EQUAL);
    sync_printf(t, ">", GREATER);
    sync_printf(t, ">=", GREATER_OR_EQUAL);
    sync_printf(t, "<", SMALLER);
    sync_printf(t, "<=", SMALLER_OR_EQUAL);
    sync_printf("            },\n");

    sync_printf("            curve_type_t: {\n");
    sync_printf(t, "Linear", CURVE_NONE);
    sync_printf(t, "Fixed value", CURVE_FIXED);
    sync_printf(t, "Min/Max", CURVE_MIN_MAX);
    sync_printf(t, "0/Max", CURVE_ZERO_MAX);
    sync_printf(t, ">0", CURVE_GT_ZERO);
    sync_printf(t, "<0", CURVE_LT_ZERO);
    sync_printf(t, "Absolute", CURVE_ABSVAL);
    sync_printf(t, "Expo", CURVE_EXPO);
    sync_printf(t, "Deadband", CURVE_DEADBAND);
    sync_printf(t, "3-Point", CURVE_3POINT);
    sync_printf(t, "5-Point", CURVE_5POINT);
    sync_printf(t, "7-Point", CURVE_7POINT);
    sync_printf(t, "9-Point", CURVE_9POINT);
    sync_printf(t, "11-Point", CURVE_11POINT);
    sync_printf(t, "13-Point", CURVE_13POINT);
    sync_printf("            },\n");

    sync_printf("            interpolation_type_t: {\n");
    sync_printf(t, "Linear", INTERPOLATION_LINEAR);
    sync_printf(t, "Smoothing", INTERPOLATION_SMOOTHING);
    sync_printf("            },\n");

    sync_printf("        }\n");
    sync_printf("    }\n");
    sync_printf("};\n");

    print_separator();
    dump_javascript_config();
}

