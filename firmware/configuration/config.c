#include <stdbool.h>
#include <stdio.h>
#include <string.h>

#include <config.h>
#include <inputs.h>
#include <persistent_storage.h>
#include <systick.h>


config_t config;


// ****************************************************************************
static const config_t config_failsafe = {
    .version = 0xffffffff,
    // FIXME: add some useful defaults
    .model = {
        .name = "CONFIG CORRUPTED",
        .protocol_hk310 = {
            .hop_channels = {20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39},
            .address = {0x0d, 0x0e, 0x0a, 0x0d, 0x00}
        }
    }
};


// ****************************************************************************
const config_t config_flash = {
    .version = CONFIG_VERSION,

    .tx = {
        .hardware_inputs = {
            {.type = ANALOG_WITH_CENTER,                    // PA1/ADC1 Ailerons
             .calibration = {510, 1962, 3380}},

            {.type = ANALOG_WITH_CENTER,                    // PA2/ADC2 Elevator
             .calibration = {590, 1943, 3240}},

            {.type = ANALOG_NO_CENTER,                      // PA3/ADC3 Throttle
             .calibration = {670, ADC_VALUE_HALF, 3370}},

            {.type = ANALOG_WITH_CENTER,                    // PA4/ADC4 Rudder
             .calibration = {580, 1874, 3410}},

            {.type = TRANSMITTER_INPUT_NOT_USED},           // PA5/ADC5
            {.type = TRANSMITTER_INPUT_NOT_USED},           // PA5/ADC6
            {.type = TRANSMITTER_INPUT_NOT_USED},           // PA6/ADC7
            {.type = TRANSMITTER_INPUT_NOT_USED},           // PA8/ADC8
            {.type = TRANSMITTER_INPUT_NOT_USED},           // PA9/ADC9

            {.type = MOMENTARY_ON_OFF},                     // PB11/SW1
            {.type = MOMENTARY_ON_OFF},                     // PB10/SW2

            {.type = TRANSMITTER_INPUT_NOT_USED},           // PB3/SW3
            {.type = TRANSMITTER_INPUT_NOT_USED},           // PB4/SW4
            {.type = TRANSMITTER_INPUT_NOT_USED},           // PB5/SW5
            {.type = TRANSMITTER_INPUT_NOT_USED},           // PB6/SW6
            {.type = TRANSMITTER_INPUT_NOT_USED},           // PB7/SW7
            {.type = TRANSMITTER_INPUT_NOT_USED},           // PB8/SW8
            {.type = TRANSMITTER_INPUT_NOT_USED}            // PB9/SW9
        },
        .logical_inputs = {
            {.type = ANALOG, .hardware_inputs = {0}, .labels = {AIL}},
            {.type = ANALOG, .hardware_inputs = {1}, .labels = {ELE}},
            {.type = ANALOG, .hardware_inputs = {2}, .labels = {THR, TH}},
            {.type = ANALOG, .hardware_inputs = {3}, .labels = {RUD, ST}},

            // {.type = SWITCH, .hardware_inputs = {9, 10}, .labels = {SW1},
            //  .position_count = 3}
            {.type = SWITCH, .hardware_inputs = {9, 10}, .labels = {SW1},
             .sub_type = UP_DOWN_BUTTONS, .position_count = 3}

            // {.type = TRIM, .hardware_inputs = {9, 10}, .labels = {AIL}},
            // {.type = TRIM, .hardware_inputs = {0}, .labels = {RUD, ST}},
        },
        .trim_range = PERCENT_TO_CHANNEL(30),
        .trim_step_size = PERCENT_TO_CHANNEL(1),
        .led_pwm_percent = 30,
        .bind_timeout_ms = 10 * 1000,
        .double_click_timeout_ms = 300
    },

    .model = {
        .name = "HK Mini DLG",
        .mixer_units = {
            {
                .src = AIL,
                .dst = CH1,
                .curve = {
                    .type = CURVE_NONE,
                    .points = {50, 50}
                },
                .scalar = 100,
                .offset = 0,
                .apply_trim = true
            },
            {
                .src = ELE,
                .dst = CH2,
                .curve = {
                    .type = CURVE_NONE,
                },
                .scalar = 100,
                .offset = 0,
                .apply_trim = true
            },
            {
                .src = THR,
                .dst = CH3,
                .curve = {
                    .type = CURVE_NONE,
                },
                .offset = 0,
                .scalar = 100,
                .apply_trim = true
            },
            {
                .src = RUD,
                .dst = CH4,
                .curve = {
                    .type = CURVE_NONE,
                },
                .scalar = 100,
                .offset = 0,
                .apply_trim = true
            },
            {
                .src = 0
            }
        },

        .limits =  {
            {
                .ep_l = PERCENT_TO_CHANNEL(-35), .ep_h = PERCENT_TO_CHANNEL(30), .subtrim = -1600,
                .limit_l = -150000, .limit_h = 150000,
                .failsafe = PERCENT_TO_CHANNEL(8)
            },
            {
                .ep_l = PERCENT_TO_CHANNEL(-30), .ep_h = PERCENT_TO_CHANNEL(35), .subtrim = -2200,
                .limit_l = -150000, .limit_h = 150000,
                .failsafe = PERCENT_TO_CHANNEL(-5),
                .invert = 1
            },
            {
                .ep_l = CHANNEL_N100_PERCENT, .ep_h = CHANNEL_100_PERCENT, .subtrim = 0,
                .limit_l = -150000, .limit_h = 150000
            },
            {
                .ep_l = CHANNEL_N100_PERCENT, .ep_h = CHANNEL_100_PERCENT, .subtrim = 0,
                .limit_l = -150000, .limit_h = 150000
            },
            {
                .ep_l = CHANNEL_N100_PERCENT, .ep_h = CHANNEL_100_PERCENT, .subtrim = 0,
                .limit_l = -150000, .limit_h = 150000
            },
            {
                .ep_l = CHANNEL_N100_PERCENT, .ep_h = CHANNEL_100_PERCENT, .subtrim = 0,
                .limit_l = -150000, .limit_h = 150000
            },
            {
                .ep_l = CHANNEL_N100_PERCENT, .ep_h = CHANNEL_100_PERCENT, .subtrim = 0,
                .limit_l = -150000, .limit_h = 150000
            },
            {
                .ep_l = CHANNEL_N100_PERCENT, .ep_h = CHANNEL_100_PERCENT, .subtrim = 0,
                .limit_l = -150000, .limit_h = 150000
            },
        },

        .protocol_hk310 = {
            .hop_channels = {41, 21, 16, 66, 38, 33, 23, 32, 48, 37, 30, 54, 1, 12, 34, 19, 59, 17, 53, 49},
            // .hop_channels = {20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39},
            .address = {0xab, 0x22, 0x08, 0x97, 0x45}
        }
    }
};


// ****************************************************************************
// The configuration contains read-only value describing the hardware inputs.
// To ensure they are not accidentally overwritten this function sets the
// values in the configuration to what was defined at compile time.
static void load_pcb_inputs(void)
{
    for (size_t i = 0; i < MAX_TRANSMITTER_INPUTS; i++) {
        pcb_input_t *dst = &config.tx.hardware_inputs[i].pcb_input;
        const pcb_input_t *src = &pcb_inputs[i];

        memcpy(dst, src, sizeof(pcb_input_t));
    }
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
void CONFIG_save(void)
{
    load_pcb_inputs();
    PERSISTENT_STORAGE_save_config();
}


// ****************************************************************************
void CONFIG_load(void)
{
    // Copy the settings stored in the flash (config_flash) into the
    // working-copy in RAM (config)
    memcpy(&config, &config_flash, sizeof(config_t));

    if (config.version != CONFIG_VERSION) {
        memcpy(&config, &config_failsafe, sizeof(config_t));
    }

    load_pcb_inputs();
}


// ****************************************************************************
// Source: http://stackoverflow.com/questions/3553296/c-sizeof-single-struct-member
#define membersizeof(type, member) sizeof(((type *)0)->member)
static void dump_javascript_1(void);
static void dump_javascript_2(void);
static void dump_javascript_3(void);
static void dump_javascript_4(void);
static void dump_javascript_5(void);
static void dump_javascript_config(void);

void CONFIG_dump_javascript_information(void)
{
    print_separator();
    printf("var CONFIG = {\n");
    printf("    CONFIG_S: %u,\n", sizeof(config));
    printf("    VERSION_O: %u,\n", offsetof(config_t, version));
    printf("    VERSION_S: %u,\n", membersizeof(config_t, version));
    printf("    TX_O: %u,\n", offsetof(config_t, tx));
    printf("    TX_S: %u,\n", membersizeof(config_t, tx));
    printf("    MODEL_O: %u,\n", offsetof(config_t, model));
    printf("    MODEL_S: %u\n", membersizeof(config_t, model));
    printf("};\n\n");

    printf("var TX = {\n");
    printf("    TX_S: %u,\n", membersizeof(config_t, tx));
    printf("    UUID_O: %u,\n", offsetof(config_t, tx.uuid));
    printf("    UUID_S: %u,\n", membersizeof(config_t, tx.uuid));
    printf("    NAME_O: %u,\n", offsetof(config_t, tx.name));
    printf("    NAME_S: %u,\n", membersizeof(config_t, tx.name));
    SYSTICK_set_callback(dump_javascript_1, 300);
}

static void dump_javascript_1(void) {
    printf("    HARDWARE_INPUTS_O: %u,\n", offsetof(config_t, tx.hardware_inputs));
    printf("    HARDWARE_INPUTS_S: %u,\n", membersizeof(config_t, tx.hardware_inputs));
    printf("    HARDWARE_INPUTS_ES: %u,\n", sizeof(hardware_input_t));
    printf("    HARDWARE_INPUTS_C: %u,\n", membersizeof(config_t, tx.hardware_inputs) / sizeof(hardware_input_t));
    printf("    HARDWARE_INPUTS_PCB_INPUT_O: %u,\n", offsetof(config_t, tx.hardware_inputs[0].pcb_input));
    printf("    HARDWARE_INPUTS_PCB_INPUT_S: %u,\n", membersizeof(config_t, tx.hardware_inputs[0].pcb_input));
    printf("    HARDWARE_INPUTS_PCB_INPUT_GPIOPORT_O: %u,\n", offsetof(config_t, tx.hardware_inputs[0].pcb_input.gpioport));
    printf("    HARDWARE_INPUTS_PCB_INPUT_GPIOPORT_S: %u,\n", membersizeof(config_t, tx.hardware_inputs[0].pcb_input.gpioport));
    printf("    HARDWARE_INPUTS_PCB_INPUT_GPIO_O: %u,\n", offsetof(config_t, tx.hardware_inputs[0].pcb_input.gpio));
    printf("    HARDWARE_INPUTS_PCB_INPUT_GPIO_S: %u,\n", membersizeof(config_t, tx.hardware_inputs[0].pcb_input.gpio));
    printf("    HARDWARE_INPUTS_PCB_INPUT_ADC_CHANNEL_O: %u,\n", offsetof(config_t, tx.hardware_inputs[0].pcb_input.adc_channel));
    printf("    HARDWARE_INPUTS_PCB_INPUT_ADC_CHANNEL_S: %u,\n", membersizeof(config_t, tx.hardware_inputs[0].pcb_input.adc_channel));
    printf("    HARDWARE_INPUTS_PCB_INPUT_TYPE_O: %u,\n", offsetof(config_t, tx.hardware_inputs[0].pcb_input.type));
    printf("    HARDWARE_INPUTS_PCB_INPUT_TYPE_S: %u,\n", membersizeof(config_t, tx.hardware_inputs[0].pcb_input.type));
    printf("    HARDWARE_INPUTS_PCB_INPUT_PIN_NAME_O: %u,\n", offsetof(config_t, tx.hardware_inputs[0].pcb_input.pin_name));
    printf("    HARDWARE_INPUTS_PCB_INPUT_PIN_NAME_S: %u,\n", membersizeof(config_t, tx.hardware_inputs[0].pcb_input.pin_name));
    printf("    HARDWARE_INPUTS_PCB_INPUT_SCHEMATIC_REFERENCE_O: %u,\n", offsetof(config_t, tx.hardware_inputs[0].pcb_input.schematic_reference));
    printf("    HARDWARE_INPUTS_PCB_INPUT_SCHEMATIC_REFERENCE_S: %u,\n", membersizeof(config_t, tx.hardware_inputs[0].pcb_input.schematic_reference));
    printf("    HARDWARE_INPUTS_TYPE_O: %u,\n", offsetof(config_t, tx.hardware_inputs[0].type));
    printf("    HARDWARE_INPUTS_TYPE_S: %u,\n", membersizeof(config_t, tx.hardware_inputs[0].type));
    printf("    HARDWARE_INPUTS_CALIBRATION_O: %u,\n", offsetof(config_t, tx.hardware_inputs[0].calibration));
    printf("    HARDWARE_INPUTS_CALIBRATION_S: %u,\n", membersizeof(config_t, tx.hardware_inputs[0].calibration));
    SYSTICK_set_callback(dump_javascript_2, 300);
}

static void dump_javascript_2(void) {
    printf("    LOGICAL_INPUTS_O: %u,\n", offsetof(config_t, tx.logical_inputs));
    printf("    LOGICAL_INPUTS_S: %u,\n", membersizeof(config_t, tx.logical_inputs));
    printf("    LOGICAL_INPUTS_ES: %u,\n", sizeof(logical_input_t));
    printf("    LOGICAL_INPUTS_C: %u,\n", membersizeof(config_t, tx.logical_inputs) / sizeof(logical_input_t));
    printf("    LOGICAL_INPUTS_TYPE_O: %u,\n", offsetof(config_t, tx.logical_inputs[0].type));
    printf("    LOGICAL_INPUTS_TYPE_S: %u,\n", membersizeof(config_t, tx.logical_inputs[0].type));
    printf("    LOGICAL_INPUTS_SUB_TYPE_O: %u,\n", offsetof(config_t, tx.logical_inputs[0].sub_type));
    printf("    LOGICAL_INPUTS_SUB_TYPE_S: %u,\n", membersizeof(config_t, tx.logical_inputs[0].sub_type));
    printf("    LOGICAL_INPUTS_POSITION_COUNT_O: %u,\n", offsetof(config_t, tx.logical_inputs[0].position_count));
    printf("    LOGICAL_INPUTS_POSITION_COUNT_S: %u,\n", membersizeof(config_t, tx.logical_inputs[0].position_count));
    printf("    LOGICAL_INPUTS_HARDWARE_INPUTS_O: %u,\n", offsetof(config_t, tx.logical_inputs[0].hardware_inputs));
    printf("    LOGICAL_INPUTS_HARDWARE_INPUTS_S: %u,\n", membersizeof(config_t, tx.logical_inputs[0].hardware_inputs));
    printf("    LOGICAL_INPUTS_LABELS_O: %u,\n", offsetof(config_t, tx.logical_inputs[0].labels));
    printf("    LOGICAL_INPUTS_LABELS_S: %u,\n", membersizeof(config_t, tx.logical_inputs[0].labels));
    printf("    TRIM_RANGE_O: %u,\n", offsetof(config_t, tx.trim_range));
    printf("    TRIM_RANGE_S: %u,\n", membersizeof(config_t, tx.trim_range));
    printf("    TRIM_STEP_SIZE_O: %u,\n", offsetof(config_t, tx.trim_step_size));
    printf("    TRIM_STEP_SIZE_S: %u,\n", membersizeof(config_t, tx.trim_step_size));
    printf("    DOUBLE_CLICK_TIMEOUT_MS_O: %u,\n", offsetof(config_t, tx.double_click_timeout_ms));
    printf("    DOUBLE_CLICK_TIMEOUT_MS_S: %u,\n", membersizeof(config_t, tx.double_click_timeout_ms));
    printf("    LED_PWM_PERCENT_O: %u,\n", offsetof(config_t, tx.led_pwm_percent));
    printf("    LED_PWM_PERCENT_S: %u,\n", membersizeof(config_t, tx.led_pwm_percent));
    printf("};\n\n");
    SYSTICK_set_callback(dump_javascript_3, 300);
}

static void dump_javascript_3(void) {
    printf("var MODEL = {\n");
    printf("    MODEL_S: %u,\n", membersizeof(config_t, model));
    printf("    UUID_O: %u,\n", offsetof(config_t, model.uuid));
    printf("    UUID_S: %u,\n", membersizeof(config_t, model.uuid));
    printf("    NAME_O: %u,\n", offsetof(config_t, model.name));
    printf("    NAME_S: %u,\n", membersizeof(config_t, model.name));
    printf("    MIXER_UNITS_O: %u,\n", offsetof(config_t, model.mixer_units));
    printf("    MIXER_UNITS_S: %u,\n", membersizeof(config_t, model.mixer_units));
    printf("    MIXER_UNITS_ES: %u,\n", sizeof(mixer_unit_t));
    printf("    MIXER_UNITS_C: %u,\n", membersizeof(config_t, model.mixer_units) / sizeof(mixer_unit_t));
    printf("    MIXER_UNITS_CURVE_O: %u,\n", offsetof(config_t, model.mixer_units[0].curve));
    printf("    MIXER_UNITS_CURVE_S: %u,\n", membersizeof(config_t, model.mixer_units[0].curve));
    // FIXME! How to deal with bit-fields?
    // printf("    MIXER_UNITS_CURVE_TYPE_O: %u,\n", offsetof(config_t, model.mixer_units[0].curve.type));
    // printf("    MIXER_UNITS_CURVE_TYPE_S: %u,\n", membersizeof(config_t, model.mixer_units[0].curve.type));
    // printf("    MIXER_UNITS_CURVE_SMOOTHING_O: %u,\n", offsetof(config_t, model.mixer_units[0].curve.smoothing));
    // printf("    MIXER_UNITS_CURVE_SMOOTHING_S: %u,\n", membersizeof(config_t, model.mixer_units[0].curve.smoothing));
    printf("    MIXER_UNITS_CURVE_POINTS_O: %u,\n", offsetof(config_t, model.mixer_units[0].curve.points));
    printf("    MIXER_UNITS_CURVE_POINTS_S: %u,\n", membersizeof(config_t, model.mixer_units[0].curve.points));
    printf("    MIXER_UNITS_SRC_O: %u,\n", offsetof(config_t, model.mixer_units[0].src));
    printf("    MIXER_UNITS_SRC_S: %u,\n", membersizeof(config_t, model.mixer_units[0].src));
    printf("    MIXER_UNITS_DST_O: %u,\n", offsetof(config_t, model.mixer_units[0].dst));
    printf("    MIXER_UNITS_DST_S: %u,\n", membersizeof(config_t, model.mixer_units[0].dst));
    printf("    MIXER_UNITS_SW_O: %u,\n", offsetof(config_t, model.mixer_units[0].sw));
    printf("    MIXER_UNITS_SW_S: %u,\n", membersizeof(config_t, model.mixer_units[0].sw));
    printf("    MIXER_UNITS_SW_SW_O: %u,\n", offsetof(config_t, model.mixer_units[0].sw.sw));
    printf("    MIXER_UNITS_SW_SW_S: %u,\n", membersizeof(config_t, model.mixer_units[0].sw.sw));
    printf("    MIXER_UNITS_SW_CMP_O: %u,\n", offsetof(config_t, model.mixer_units[0].sw.cmp));
    printf("    MIXER_UNITS_SW_CMP_S: %u,\n", membersizeof(config_t, model.mixer_units[0].sw.cmp));
    printf("    MIXER_UNITS_SW_VALUE_O: %u,\n", offsetof(config_t, model.mixer_units[0].sw.value));
    printf("    MIXER_UNITS_SW_VALUE_S: %u,\n", membersizeof(config_t, model.mixer_units[0].sw.value));
    printf("    MIXER_UNITS_OP_O: %u,\n", offsetof(config_t, model.mixer_units[0].op));
    printf("    MIXER_UNITS_OP_S: %u,\n", membersizeof(config_t, model.mixer_units[0].op));
    printf("    MIXER_UNITS_SCALAR_O: %u,\n", offsetof(config_t, model.mixer_units[0].scalar));
    printf("    MIXER_UNITS_SCALAR_S: %u,\n", membersizeof(config_t, model.mixer_units[0].scalar));
    printf("    MIXER_UNITS_OFFSET_O: %u,\n", offsetof(config_t, model.mixer_units[0].offset));
    printf("    MIXER_UNITS_OFFSET_S: %u,\n", membersizeof(config_t, model.mixer_units[0].offset));
    printf("    MIXER_UNITS_TAG_O: %u,\n", offsetof(config_t, model.mixer_units[0].tag));
    printf("    MIXER_UNITS_TAG_S: %u,\n", membersizeof(config_t, model.mixer_units[0].tag));
    // FIXME! How to deal with bit-fields?
    // printf("    MIXER_UNITS_INVERT_SOURCE_O: %u,\n", offsetof(config_t, model.mixer_units[0].invert_source));
    // printf("    MIXER_UNITS_INVERT_SOURCE_S: %u,\n", membersizeof(config_t, model.mixer_units[0].invert_source));
    // printf("    MIXER_UNITS_APPLY_TRIM_O: %u,\n", offsetof(config_t, model.mixer_units[0].apply_trim));
    // printf("    MIXER_UNITS_APPLY_TRIM_S: %u,\n", membersizeof(config_t, model.mixer_units[0].apply_trim));
    SYSTICK_set_callback(dump_javascript_4, 300);
}

static void dump_javascript_4(void) {
    printf("    LIMITS_O: %u,\n", offsetof(config_t, model.limits));
    printf("    LIMITS_S: %u,\n", membersizeof(config_t, model.limits));
    printf("    LIMITS_ES: %u,\n", sizeof(limits_t));
    printf("    LIMITS_C: %u,\n", membersizeof(config_t, model.limits) / sizeof(limits_t));
    printf("    LIMITS_EP_L_O: %u,\n", offsetof(config_t, model.limits[0].ep_l));
    printf("    LIMITS_EP_L_S: %u,\n", membersizeof(config_t, model.limits[0].ep_l));
    printf("    LIMITS_EP_R_O: %u,\n", offsetof(config_t, model.limits[0].ep_h));
    printf("    LIMITS_EP_R_S: %u,\n", membersizeof(config_t, model.limits[0].ep_h));
    printf("    LIMITS_SUBTRIM_O: %u,\n", offsetof(config_t, model.limits[0].subtrim));
    printf("    LIMITS_SUBTRIM_S: %u,\n", membersizeof(config_t, model.limits[0].subtrim));
    printf("    LIMITS_LIMIT_L_O: %u,\n", offsetof(config_t, model.limits[0].limit_l));
    printf("    LIMITS_LIMIT_L_S: %u,\n", membersizeof(config_t, model.limits[0].limit_l));
    printf("    LIMITS_LIMIT_H_O: %u,\n", offsetof(config_t, model.limits[0].limit_h));
    printf("    LIMITS_LIMIT_H_S: %u,\n", membersizeof(config_t, model.limits[0].limit_h));
    printf("    LIMITS_FAILSAFE_O: %u,\n", offsetof(config_t, model.limits[0].failsafe));
    printf("    LIMITS_FAILSAFE_S: %u,\n", membersizeof(config_t, model.limits[0].failsafe));
    printf("    LIMITS_SPEED_O: %u,\n", offsetof(config_t, model.limits[0].speed));
    printf("    LIMITS_SPEED_S: %u,\n", membersizeof(config_t, model.limits[0].speed));
    // FIXME! How to deal with bit-fields?
    // printf("    LIMITS_INVERT_O: %u,\n", offsetof(config_t, model.limits[0].invert));
    // printf("    LIMITS_INVERT_S: %u,\n", membersizeof(config_t, model.limits[0].invert));
    printf("    PROTOCOL_HK310_O: %u,\n", offsetof(config_t, model.protocol_hk310));
    printf("    PROTOCOL_HK310_S: %u,\n", membersizeof(config_t, model.protocol_hk310));
    printf("    PROTOCOL_HK310_HOP_CHANNELS_O: %u,\n", offsetof(config_t, model.protocol_hk310.hop_channels));
    printf("    PROTOCOL_HK310_HOP_CHANNELS_S: %u,\n", membersizeof(config_t, model.protocol_hk310.hop_channels));
    printf("    PROTOCOL_HK310_ADDRESS_O: %u,\n", offsetof(config_t, model.protocol_hk310.address));
    printf("    PROTOCOL_HK310_ADDRESS_S: %u,\n", membersizeof(config_t, model.protocol_hk310.address));
    printf("};\n");
    SYSTICK_set_callback(dump_javascript_5, 300);
}

static void dump_javascript_5(void) {
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
        SYSTICK_set_callback(dump_javascript_config, 50);
    }
    else {
        printf("\n]);\n");
    }
}

// ****************************************************************************
void CONFIG_init(void)
{
    CONFIG_load();
}




