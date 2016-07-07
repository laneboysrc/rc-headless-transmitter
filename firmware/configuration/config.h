#pragma once

#include <channels.h>
#include <inputs.h>
#include <limits.h>
#include <mixer.h>
#include <protocol_hk310.h>


#define CONFIG_VERSION 1

typedef struct {
    uint32_t version;

    struct {
        uint8_t uuid[16];
        char name[16];
        hardware_input_t hardware_inputs[MAX_TRANSMITTER_INPUTS];
        logical_input_t logical_inputs[MAX_LOGICAL_INPUTS];
        int32_t trim_range;
        int32_t trim_step_size;
        uint32_t bind_timeout_ms;
        uint32_t double_click_timeout_ms;
        uint8_t led_pwm_percent;
    } tx;

    struct {
        uint8_t uuid[16];
        char name[16];
        mixer_unit_t mixer_units[MAX_MIXER_UNITS];
        limits_t limits[NUMBER_OF_OUTPUT_CHANNELS];
        protocol_hk310_t protocol_hk310;
    } model;
} config_t;


extern config_t config;
extern const config_t config_flash;

void CONFIG_init(void);
void CONFIG_load(void);
void CONFIG_save(void);
void CONFIG_background_flash_write(void);

