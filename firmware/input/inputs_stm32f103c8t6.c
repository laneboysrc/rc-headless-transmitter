// Inputs available on the AliExpress STM32F103C8T6 board

#include <libopencm3/stm32/gpio.h>

#include <inputs.h>


const uint8_t adc_channel_selection[NUMBER_OF_ADC_CHANNELS] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 17};


const pcb_input_t pcb_inputs[MAX_TRANSMITTER_INPUTS] = {
    {.type = ANALOG_DIGITAL, .gpioport = GPIOA, .gpio = GPIO1, .adc_channel = 1,
     .pin_name = "PA1/ADC1"},

    {.type = ANALOG_DIGITAL, .gpioport = GPIOA, .gpio = GPIO2, .adc_channel = 2,
     .pin_name = "PA2/ADC2"},

    {.type = ANALOG_DIGITAL, .gpioport = GPIOA, .gpio = GPIO3, .adc_channel = 3,
     .pin_name = "PA3/ADC3"},

    {.type = ANALOG_DIGITAL, .gpioport = GPIOA, .gpio = GPIO4, .adc_channel = 4,
     .pin_name = "PA4/ADC4"},

    {.type = ANALOG_DIGITAL, .gpioport = GPIOA, .gpio = GPIO5, .adc_channel = 5,
     .pin_name = "PA5/ADC5"},

    {.type = ANALOG_DIGITAL, .gpioport = GPIOA, .gpio = GPIO6, .adc_channel = 6,
     .pin_name = "PA6/ADC6"},

    {.type = ANALOG_DIGITAL, .gpioport = GPIOA, .gpio = GPIO7, .adc_channel = 7,
     .pin_name = "PA7/ADC7"},

    {.type = ANALOG_DIGITAL, .gpioport = GPIOB, .gpio = GPIO0, .adc_channel = 8,
     .pin_name = "PB0/ADC8"},

    {.type = ANALOG_DIGITAL, .gpioport = GPIOB, .gpio = GPIO1, .adc_channel = 9,
     .pin_name = "PB1/ADC9"},

    {.type = DIGITAL, .gpioport = GPIOB, .gpio = GPIO3,
     .pin_name = "PB3"},

    {.type = DIGITAL, .gpioport = GPIOB, .gpio = GPIO4,
     .pin_name = "PB4"},

    {.type = DIGITAL, .gpioport = GPIOB, .gpio = GPIO5,
     .pin_name = "PB5"},

    {.type = DIGITAL, .gpioport = GPIOB, .gpio = GPIO6,
     .pin_name = "PB6"},

    {.type = DIGITAL, .gpioport = GPIOB, .gpio = GPIO7,
     .pin_name = "PB7"},

    {.type = DIGITAL, .gpioport = GPIOB, .gpio = GPIO8,
     .pin_name = "PB8"},

    {.type = DIGITAL, .gpioport = GPIOB, .gpio = GPIO9,
     .pin_name = "PB9"},

    {.type = DIGITAL, .gpioport = GPIOB, .gpio = GPIO10,
     .pin_name = "PB10"},

    {.type = DIGITAL, .gpioport = GPIOB, .gpio = GPIO11,
     .pin_name = "PB11"}

    // Note: ADC0 is used for measuring the battery voltage, therefore it does
    // not appear in this list
};

