// Inputs available on the AliExpress STM32F103C8T6 board

#include <libopencm3/stm32/gpio.h>

#include <inputs.h>


const uint8_t adc_channel_selection[NUMBER_OF_ADC_CHANNELS] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 17};


const pcb_input_t pcb_inputs[MAX_TRANSMITTER_INPUTS] = {
                                                                                    // Schematic reference
    {.type = ANALOG_DIGITAL, .gpioport = GPIOA, .gpio = GPIO1, .adc_channel = 1},   // ADC1
    {.type = ANALOG_DIGITAL, .gpioport = GPIOA, .gpio = GPIO2, .adc_channel = 2},   // ADC2
    {.type = ANALOG_DIGITAL, .gpioport = GPIOA, .gpio = GPIO3, .adc_channel = 3},   // ADC3
    {.type = ANALOG_DIGITAL, .gpioport = GPIOA, .gpio = GPIO4, .adc_channel = 4},   // ADC4
    {.type = ANALOG_DIGITAL, .gpioport = GPIOA, .gpio = GPIO5, .adc_channel = 5},   // ADC5
    {.type = ANALOG_DIGITAL, .gpioport = GPIOA, .gpio = GPIO6, .adc_channel = 6},   // ADC6
    {.type = ANALOG_DIGITAL, .gpioport = GPIOA, .gpio = GPIO7, .adc_channel = 7},   // ADC7
    {.type = ANALOG_DIGITAL, .gpioport = GPIOB, .gpio = GPIO0, .adc_channel = 8},   // ADC8
    {.type = ANALOG_DIGITAL, .gpioport = GPIOB, .gpio = GPIO1, .adc_channel = 9},   // ADC9
    {.type = DIGITAL, .gpioport = GPIOB, .gpio = GPIO11},                           // SW1
    {.type = DIGITAL, .gpioport = GPIOB, .gpio = GPIO10},                           // SW2
    {.type = DIGITAL, .gpioport = GPIOB, .gpio = GPIO3},                            // SW3
    {.type = DIGITAL, .gpioport = GPIOB, .gpio = GPIO4},                            // SW4
    {.type = DIGITAL, .gpioport = GPIOB, .gpio = GPIO5},                            // SW5
    {.type = DIGITAL, .gpioport = GPIOB, .gpio = GPIO6},                            // SW6
    {.type = DIGITAL, .gpioport = GPIOB, .gpio = GPIO7},                            // SW7
    {.type = DIGITAL, .gpioport = GPIOB, .gpio = GPIO8},                            // SW8
    {.type = DIGITAL, .gpioport = GPIOB, .gpio = GPIO9}                             // SW9

    // Note: ADC0 is used for measuring the battery voltage, therefore it does
    // not appear in this list
};

