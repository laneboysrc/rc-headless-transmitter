#pragma once

// NUMBER_OF_ADC_CHANNELS defines how many channels we measure using the ADC.
// It includes all analog inputs to the transmitter (sticks, pots), as well
// as the battery voltage input and the (internal!) voltage reference.
//
// IMPORTANT:
// This value must be equal to the number of elements in adc_channel_selection!
#define NUMBER_OF_ADC_CHANNELS 11

// Index of battery voltage ADC inputs in adc_array_*.
// Corresponds to the order of the adc channels in adc_channel_selection[].
#define BATTERY_VOLTAGE_INDEX 9
#define REFERENCE_VOLTAGE_INDEX 10

// NUMBER_OF_DIGITAL_INPUTS defines the maximum number of digital inputs
// the cardware can support. Note that analog inputs can be configured
// as digital inputs as well, so they must be included in this number even
// when used in their analog form.
// The STM32F103C8T6 board we are using has 9 analog/digital inputs and 9
// digital inputs, so 18 in total.
#define NUMBER_OF_DIGITAL_INPUTS 18


extern const pcb_input_t pcb_inputs[];
extern const uint8_t adc_channel_selection[NUMBER_OF_ADC_CHANNELS];