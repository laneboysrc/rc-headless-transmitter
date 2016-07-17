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
        .rf_protocol_type = RF_PROTOCOL_HK310,
        .rf = {
            .protocol_hk310 = {
                .hop_channels = {20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39},
                .address = {0x0d, 0x0e, 0x0a, 0x0d, 0x00}
            }
        }
    },
    .tx = {
        .name = "CONFIG CORRUPTED",
        .passphrase = 1234,  // What else could be a default passphrase :)
    }
};


// ****************************************************************************
const config_t config_flash = {
    .version = CONFIG_VERSION,

    .tx = {
        .name = "E Sky 0905A",
        .uuid = {0x43, 0x53, 0x8f, 0xe8, 0x44, 0xc9, 0x11, 0xe6, 0x9f, 0x17,
                 0xaf, 0x7b, 0xe9, 0xc4, 0x47, 0x9e},
        .passphrase = 1234,                                 // What else :)
        .hardware_inputs = {
            {.type = ANALOG_WITH_CENTER_AUTO_RETURN,        // PA1/ADC1 Ailerons
             .calibration = {510, 1962, 3380}},

            {.type = ANALOG_WITH_CENTER_AUTO_RETURN,        // PA2/ADC2 Elevator
             .calibration = {590, 1943, 3240}},

            {.type = ANALOG_NO_CENTER,                      // PA3/ADC3 Throttle
             .calibration = {670, ADC_VALUE_HALF, 3370}},

            {.type = ANALOG_WITH_CENTER_AUTO_RETURN,        // PA4/ADC4 Rudder
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
        .uuid = {0xc9, 0x1c, 0xab, 0xaa, 0x44, 0xc9, 0x11, 0xe6, 0x9b, 0xc2,
                 0x03, 0xac, 0x25, 0xe3, 0x0b, 0x5b},
        .mixer_units = {
            {
                .src = IN_AIL,
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
                .src = IN_ELE,
                .dst = CH2,
                .curve = {
                    .type = CURVE_NONE,
                },
                .scalar = 100,
                .offset = 0,
                .apply_trim = true
            },
            {
                .src = IN_THR,
                .dst = CH3,
                .curve = {
                    .type = CURVE_NONE,
                },
                .offset = 0,
                .scalar = 100,
                .apply_trim = true
            },
            {
                .src = IN_RUD,
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

        .rf_protocol_type = RF_PROTOCOL_HK310,
        .rf = {
            .protocol_hk310 = {
                .hop_channels = {41, 21, 16, 66, 38, 33, 23, 32, 48, 37, 30, 54, 1, 12, 34, 19, 59, 17, 53, 49},
                // .hop_channels = {20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39},
                .address = {0xab, 0x22, 0x08, 0x97, 0x45}
            }
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
void CONFIG_init(void)
{
    CONFIG_load();
}

