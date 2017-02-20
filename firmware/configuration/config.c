#include <stdbool.h>
#include <stdio.h>
#include <string.h>

#include <libopencm3/cm3/common.h>
#include <libopencm3/stm32/desig.h>

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
                .hop_channels = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19},
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
        // UUID for unconfigured transmitter
        .name = "Unconfigured TX",
        .uuid = {0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff},
        // .name = "E Sky 0905A",
        // .uuid = {0x43, 0x53, 0x8f, 0xe8, 0x44, 0xc9, 0x11, 0xe6},
        .passphrase = 1234,                                 // What else :)
        .hardware_inputs = {
            {.type = ANALOG_WITH_CENTER_AUTO_RETURN,        // 0: PA1/ADC1 Ailerons
             .calibration = {510, 1962, 3380}},

            {.type = ANALOG_WITH_CENTER_AUTO_RETURN,        // 1: PA2/ADC2 Elevator
             .calibration = {590, 1943, 3240}},

            {.type = ANALOG_NO_CENTER,                      // 2: PA3/ADC3 Throttle
             .calibration = {670, ADC_VALUE_HALF, 3370}},

            {.type = ANALOG_WITH_CENTER_AUTO_RETURN,        // 3: PA4/ADC4 Rudder
             .calibration = {580, 1874, 3410}},

            {.type = TRANSMITTER_INPUT_NOT_USED},           // 4: PA5/ADC5
            {.type = TRANSMITTER_INPUT_NOT_USED},           // 5: PA5/ADC6
            {.type = TRANSMITTER_INPUT_NOT_USED},           // 6: PA6/ADC7
            {.type = TRANSMITTER_INPUT_NOT_USED},           // 7: PB0/ADC8
            {.type = TRANSMITTER_INPUT_NOT_USED},           // 8: PB1/ADC9

            {.type = TRANSMITTER_INPUT_NOT_USED},           // 9: PB3
            {.type = TRANSMITTER_INPUT_NOT_USED},           // 10: PB4
            {.type = TRANSMITTER_INPUT_NOT_USED},           // 11: PB5
            {.type = TRANSMITTER_INPUT_NOT_USED},           // 12: PB6
            {.type = TRANSMITTER_INPUT_NOT_USED},           // 13: PB7
            {.type = TRANSMITTER_INPUT_NOT_USED},           // 14: PB8
            {.type = TRANSMITTER_INPUT_NOT_USED},           // 15: PB9
            {.type = TRANSMITTER_INPUT_NOT_USED},           // 16: PB10
            {.type = TRANSMITTER_INPUT_NOT_USED}            // 17: PB11
        },
        .logical_inputs = {
            {.type = ANALOG, .hardware_inputs = {0}, .labels = {AIL}},
            {.type = ANALOG, .hardware_inputs = {1}, .labels = {ELE}},
            {.type = ANALOG, .hardware_inputs = {2}, .labels = {THR, TH}},
            {.type = ANALOG, .hardware_inputs = {3}, .labels = {RUD, ST}},
        },
        .trim_range = PERCENT_TO_CHANNEL(30),
        .trim_step_size = PERCENT_TO_CHANNEL(1),
        .led_pwm_percent = 30,
        .bind_timeout_ms = 10 * 1000,
        .double_click_timeout_ms = 300
    },

    .model = {
        // UUID for unconfigured models
        .name = "Unconfigured",
        .uuid = {0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff},
        // .name = "HK Mini DLG",
        // .uuid = {0xc9, 0x1c, 0xab, 0xaa, 0x44, 0xc9, 0x11, 0xe6},
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
        // .rf = {
        //     .protocol_hk310 = {
        //         .hop_channels = {41, 21, 16, 66, 38, 33, 23, 32, 48, 37, 30, 54, 1, 12, 34, 19, 59, 17, 53, 49},
        //         .address = {0xab, 0x22, 0x08, 0x97, 0x45}
        //     }
        // }
    }
};


// ****************************************************************************
// The configuration contains read-only value describing the hardware inputs
// as well as for the transmitter UUID (which is derived from the STM32
// "Device Electronic Signature").
// To ensure they are not accidentally overwritten this function sets the
// values in the configuration to what was defined at compile time.
static void restore_read_only_config(void)
{
    uint32_t *uuid = (uint32_t *) config.tx.uuid;
    uint32_t chip_id[3];

    desig_get_unique_id(chip_id);

    *uuid++ = chip_id[2];
    *uuid = chip_id[1] + chip_id[0];

    for (size_t i = 0; i < MAX_TRANSMITTER_INPUTS; i++) {
        pcb_input_t *dst = &config.tx.hardware_inputs[i].pcb_input;
        const pcb_input_t *src = &pcb_inputs[i];

        memcpy(dst, src, sizeof(pcb_input_t));
    }
}


// ****************************************************************************
void CONFIG_save(void)
{
    restore_read_only_config();
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

    restore_read_only_config();
}


// ****************************************************************************
void CONFIG_init(void)
{
    CONFIG_load();
}

