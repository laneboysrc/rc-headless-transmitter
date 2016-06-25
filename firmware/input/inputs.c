#include <stdint.h>
#include <stdio.h>
#include <stdbool.h>

#include <libopencm3/stm32/adc.h>
#include <libopencm3/stm32/dma.h>
#include <libopencm3/stm32/gpio.h>
#include <libopencm3/stm32/rcc.h>

#include <config.h>
#include <inputs.h>
#include <systick.h>


#define WINDOW_SIZE 10
#define SAMPLE_COUNT NUMBER_OF_ADC_CHANNELS * WINDOW_SIZE


typedef struct{
    int32_t value;
    uint8_t switch_value;
} logical_input_value_t;


static uint16_t adc_array_oversample[SAMPLE_COUNT];
static uint16_t adc_array_raw[NUMBER_OF_ADC_CHANNELS];
static uint16_t adc_array_calibrated[NUMBER_OF_ADC_CHANNELS];

static int32_t normalized_inputs[NUMBER_OF_ADC_CHANNELS];
static uint8_t transmitter_digital_inputs[MAX_TRANSMITTER_INPUTS];


static logical_input_value_t logical_inputs[MAX_LOGICAL_INPUTS];



// ****************************************************************************
// static uint32_t adc_read_channel(unsigned channel)
// {
//     uint8_t channel_array[1];
//     // Select the channel we want to convert
//     channel_array[0] = channel;
//     adc_set_regular_sequence(ADC1, 1, channel_array);


//     // If the ADC_CR2_ON bit is already set -> setting it another time
//     // starts the conversion.

//     adc_start_conversion_direct(ADC1);

//     // Wait for end of conversion.
//     while (! adc_eoc(ADC1));

//     return adc_read_regular(ADC1);
// }



// ****************************************************************************
static void adc_set_conversion_sequence(void)
{
    adc_set_regular_sequence(ADC1, NUMBER_OF_ADC_CHANNELS, (uint8_t *)adc_channel_selection);
    adc_set_continuous_conversion_mode(ADC1);
    adc_start_conversion_direct(ADC1);
}


// ****************************************************************************
static void adc_init(void)
{
    rcc_periph_clock_enable(RCC_ADC1);

    adc_power_off(ADC1);

    rcc_periph_reset_pulse(RST_ADC1);
    rcc_set_adcpre(RCC_CFGR_ADCPRE_PCLK2_DIV2);     // 12MHz ADC clock

    /* We configure to scan the entire group each time conversion is requested. */
    adc_enable_scan_mode(ADC1);
    adc_set_single_conversion_mode(ADC1);
    adc_disable_discontinuous_mode_regular(ADC1);
    adc_disable_external_trigger_regular(ADC1);
    adc_set_right_aligned(ADC1);

    // 239.5 + 12.5 cycles @ 12 MHz ADC clock means 21 us per conversion
    adc_set_sample_time_on_all_channels(ADC1, ADC_SMPR_SMP_239DOT5CYC);

    adc_power_on(ADC1);
    adc_reset_calibration(ADC1);
    adc_calibration(ADC1);

    // Enable the voltage reference and temperature sensor inputs
    adc_enable_temperature_sensor(ADC1);

    adc_set_conversion_sequence();


    // DMA set-up. This enables reading all ADC channels round-robin,
    // filling up adc_array_oversample and then starting all over. No software
    // involvement needed.
    // Whenever the software wants ADC data, it reads adc_array_oversample.
    //
    // The code is based on code from http://code.google.com/p/rayaairbot
    rcc_periph_clock_enable(RCC_DMA1);

    dma_enable_circular_mode(DMA1, DMA_CHANNEL1);
    dma_set_read_from_peripheral(DMA1, DMA_CHANNEL1);
    dma_set_peripheral_size(DMA1, DMA_CHANNEL1, DMA_CCR_PSIZE_16BIT);
    dma_set_peripheral_address(DMA1, DMA_CHANNEL1,(uint32_t) &ADC_DR(ADC1));
    dma_set_memory_size(DMA1, DMA_CHANNEL1, DMA_CCR_MSIZE_16BIT);
    dma_set_memory_address(DMA1, DMA_CHANNEL1, (uint32_t) &adc_array_oversample);
    dma_enable_memory_increment_mode(DMA1, DMA_CHANNEL1);
    dma_set_number_of_data(DMA1, DMA_CHANNEL1, SAMPLE_COUNT);

    // The DMA is now ready to go, waiting for the ADC to provide data
    dma_enable_channel(DMA1, DMA_CHANNEL1);
    adc_enable_dma(ADC1);
}


// ****************************************************************************
static uint8_t adc_channel_to_index(uint8_t adc_channel)
{
    size_t number_of_elements = sizeof(adc_channel_selection) / sizeof(adc_channel_selection[0]);

    for (size_t i = 0; i < number_of_elements; i++) {
        if (adc_channel_selection[i] == adc_channel) {
            return i;
        }
    }

    return 0;
}


// ****************************************************************************
static int32_t get_normalized_input(uint8_t tx_index)
{
    transmitter_input_t *t = &config.tx.transmitter_inputs[tx_index];
    uint8_t adc_channel = t->pcb_input.adc_channel;
    uint8_t adc_index = adc_channel_to_index(adc_channel);

    return normalized_inputs[adc_index];
}


// ****************************************************************************
static void read_switch(logical_input_t *li, logical_input_value_t *v)
{
    port_t first_port = li->transmitter_inputs[0];
    transmitter_input_t *t = &config.tx.transmitter_inputs[first_port];

    switch (t->type) {
        case SWITCH_ON_OFF:
            // Generic multi-position switch; n=2, 4..12
           break;

        case SWITCH_ON_OPEN_OFF:
            // Special case for 3-position switch using a single IO port
            v->switch_value = transmitter_digital_inputs[first_port];
            v->value = 0;
            if (v->switch_value == 0) {
                v->value = CHANNEL_N100_PERCENT;
            }
            else if (v->switch_value == 2) {
                v->value = CHANNEL_100_PERCENT;
            }
            break;

        case MOMENTARY_ON_OFF:
            // Virtual multi-position switch using momentary button(s); n=2..12
            // FIXME: how to determine whether we need to
            //      increment, loop
            //      decrement, loop
            //      saw-tooth
            //      single-click increment, double-click decrement
            break;

        default:
            break;
    }
}


// ****************************************************************************
static void read_bcd_switch(logical_input_t *li, logical_input_value_t *v)
{
    port_t first_port = li->transmitter_inputs[0];
    transmitter_input_t *t = &config.tx.transmitter_inputs[first_port];

    (void) t;
    (void) v;
}


// ****************************************************************************
static void read_trim(logical_input_t *li, logical_input_value_t *v)
{
    port_t first_port = li->transmitter_inputs[0];
    transmitter_input_t *t = &config.tx.transmitter_inputs[first_port];

    if (t->type == ANALOG_WITH_CENTER  ||  t->type == ANALOG_NO_CENTER) {
        // FIXME: do we need to shrink this down or keep at 100%?
        v->value = get_normalized_input(first_port);
    }
    else {
        // Not analog, so must be two momentary buttons
        // FIXME: implement momentary button state machine
    }
}


// ****************************************************************************
void INPUTS_configure(void)
{
    for (size_t i = 0; i < MAX_TRANSMITTER_INPUTS; i++) {
        transmitter_input_t *t = &config.tx.transmitter_inputs[i];
        uint32_t gpioport = t->pcb_input.gpioport;
        uint16_t gpio = t->pcb_input.gpio;

        if (t->pcb_input.type == PCB_INPUT_NOT_USED) {
            continue;
        }

        switch (t->type) {
            case ANALOG_WITH_CENTER:
            case ANALOG_NO_CENTER:
            case ANALOG_NO_CENTER_POSITIVE_ONLY:
                gpio_set_mode(gpioport, GPIO_MODE_INPUT, GPIO_CNF_INPUT_ANALOG, gpio);
                break;

            case SWITCH_ON_OFF:
            case SWITCH_ON_OPEN_OFF:
            case MOMENTARY_ON_OFF:
            case TRANSMITTER_INPUT_NOT_USED:
                gpio_set_mode(gpioport, GPIO_MODE_INPUT, GPIO_CNF_INPUT_PULL_UPDOWN, gpio);
                gpio_clear(gpioport, gpio);
                break;

            default:
                break;
        }
    }
}


// ****************************************************************************
void INPUTS_init(void)
{
    INPUTS_configure();
    adc_init();
}


// ****************************************************************************
// Returns the battery voltage in millivolts
// Since the ADC uses VDD (3.3V) as reference, we measure the internal 1.2V
// reference (ADC17) of the STM32 to determine how much voltage one bit
// represents without having to rely on the 3.3V accuracy.
//
// We then multiply the measured battery voltage on ADC0 by this value and
// scale the result by the resistor divider (22k over 33k).
// The calulation is carried out in uV to get maximum resolution.
//
// one_bit_voltage = 1.2V / ADC(17)
// battery_voltage = ADC(0) * one_bit_voltage * ((22k + 33k) / 33k)
//
// This algorithm was verified with a Keithley 2700 6.5 digit DMM over the
// whole discharge of a Li-Ion battery, from 4.15V down to 2.5V. It is
// surprisingly accurate!
//
uint32_t INPUTS_get_battery_voltage(void)
{
    return adc_array_raw[BATTERY_VOLTAGE_INDEX] * (33 + 22) * 1200000 / adc_array_raw[REFERENCE_VOLTAGE_INDEX] / 33000;
}


// ****************************************************************************
// This function is called regularly to preprocess the inputs in order to
// have the latest inputs available to the mixer.
void INPUTS_filter_and_normalize(void)
{
    // STEP 1: average the ADC channels
    for (int i = 0; i < NUMBER_OF_ADC_CHANNELS; i++) {
        uint16_t filtered_result = 0;
        int idx = i;

        for (int j = 0; j < WINDOW_SIZE; j++) {
            filtered_result += adc_array_oversample[idx];
            idx += NUMBER_OF_ADC_CHANNELS;
        }

        filtered_result /= WINDOW_SIZE;
        adc_array_raw[i] = filtered_result;
    }

    // STEP 2: Normalize the analog transmitter inputs; read the digital
    //         transmitter inputs
    for (int i = 0; i < MAX_TRANSMITTER_INPUTS; i++) {
        uint32_t raw;
        uint8_t adc_index;
        transmitter_input_t *t = &config.tx.transmitter_inputs[i];
        uint32_t gpioport = t->pcb_input.gpioport;
        uint16_t gpio = t->pcb_input.gpio;


        switch (t->type) {
            case ANALOG_WITH_CENTER:
            case ANALOG_NO_CENTER:
            case ANALOG_NO_CENTER_POSITIVE_ONLY:
                adc_index = adc_channel_to_index(t->pcb_input.adc_channel);
                raw = adc_array_raw[adc_index];
                if (raw < t->calibration[0]) {
                    adc_array_calibrated[adc_index] = 0;
                }
                else if (raw >= t->calibration[2]) {
                    // Note: we are clamping to (ADC_VALUE_MAX + 1) because
                    // the positive range is only 2047, while the negative is
                    // -2048. This has the effect that after calibration the
                    // range is -100% .. 99%, instead of up to 100%. By adding
                    // 1 we make the range to positive to 100%.
                    adc_array_calibrated[adc_index] = ADC_VALUE_MAX + 1;
                }
                else if (raw == t->calibration[1]) {
                    adc_array_calibrated[adc_index] = ADC_VALUE_HALF;
                }
                else if (raw > t->calibration[1]) {
                    // Note: As above, clamp to (ADC_VALUE_MAX + 1)
                    adc_array_calibrated[adc_index] = ADC_VALUE_HALF + (raw - t->calibration[1]) * (ADC_VALUE_HALF + 1) / (t->calibration[2] - t->calibration[1]);
                }
                else {
                    adc_array_calibrated[adc_index] = (raw - t->calibration[0]) * ADC_VALUE_HALF / (t->calibration[1] - t->calibration[0]);
                }

                normalized_inputs[adc_index] = (adc_array_calibrated[adc_index] - ADC_VALUE_HALF) * CHANNEL_100_PERCENT / ADC_VALUE_HALF;
                break;

            case SWITCH_ON_OFF:
            case MOMENTARY_ON_OFF:
                transmitter_digital_inputs[i] = gpio_get(gpioport, gpio) ? 1 : 0;
                break;

            case SWITCH_ON_OPEN_OFF:
                gpio_clear(gpioport, gpio);     // Pull down; just in case...
                transmitter_digital_inputs[i] = 0;
                if (gpio_get(gpioport, gpio)) {
                    transmitter_digital_inputs[i] = 2;
                    break;
                }
                gpio_set(gpioport, gpio);       // Pull up
                if (gpio_get(gpioport, gpio)) {
                    transmitter_digital_inputs[i] = 1;
                }
                gpio_clear(gpioport, gpio);     // Restpre pull down
                break;

            default:
                break;
        }
    }

    // STEP 3: Process the logical inputs using the new values obtained above
    for (int i = 0; i < MAX_LOGICAL_INPUTS; i++) {
        logical_input_t *li = &config.tx.logical_inputs[i];
        port_t first_port = li->transmitter_inputs[0];
        logical_input_value_t *v = &logical_inputs[i];

        switch (li->type) {
            case ANALOG:
                v->value = get_normalized_input(first_port);
                v->switch_value = (v->value > 0) ? 1 : 0;
                break;

            case MOMENTARY:
                v->switch_value = transmitter_digital_inputs[first_port];
                v->value = v->switch_value ? CHANNEL_100_PERCENT : CHANNEL_N100_PERCENT;
                break;

            case SWITCH:
                read_switch(li, v);
                break;

            case BCD_SWITCH:
                read_bcd_switch(li, v);
                break;

            case TRIM:
                read_trim(li, v);
                break;

            default:
                break;
        }
    }
}


// ****************************************************************************
int32_t INPUTS_get_value(label_t input)
{
    for (unsigned i = 0; i < MAX_LOGICAL_INPUTS; i++) {
        logical_input_t *li = &config.tx.logical_inputs[i];

        if (li->type == LOGICAL_INPUT_NOT_USED  ||  li->type == TRIM) {
            continue;
        }

        for (unsigned j = 0; j < MAX_LABELS; j++) {
            if (li->labels[j] == input) {
                return logical_inputs[i].value;
            }
        }
    }

    return 0;
}


// ****************************************************************************
uint8_t INPUTS_get_switch_value(label_t input)
{
    for (unsigned i = 0; i < MAX_LOGICAL_INPUTS; i++) {
        logical_input_t *li = &config.tx.logical_inputs[i];

        if (li->type == LOGICAL_INPUT_NOT_USED  ||  li->type == TRIM) {
            continue;
        }

        for (unsigned j = 0; j < MAX_LABELS; j++) {
            if (li->labels[j] == input) {
                return logical_inputs[i].switch_value;
            }
        }
    }

    return 0;
}


// ****************************************************************************
int32_t INPUTS_get_trim(label_t input)
{
    for (unsigned i = 0; i < MAX_LOGICAL_INPUTS; i++) {
        logical_input_t *li = &config.tx.logical_inputs[i];

        if (li->type != TRIM) {
            continue;
        }

        for (unsigned j = 0; j < MAX_LABELS; j++) {
            if (li->labels[j] == input) {
                return logical_inputs[i].value;
            }
        }
    }

    return 0;
}


// ****************************************************************************
void INPUTS_dump_adc(void)
{
    printf("BAT: %lumV  ", INPUTS_get_battery_voltage());
    for (int i = 0; i < 4; i++) {
        printf("CH%d:%4ld%% (%4u->%4u)  ", i, CHANNEL_TO_PERCENT(normalized_inputs[i]), adc_array_raw[i], adc_array_calibrated[i]);
    }
    printf("\n");

    // printf("%lu, %u, %u\n", INPUTS_get_battery_voltage(), adc_array_raw[0], adc_array_raw[10]);

    // uint8_t adc_index;
    // transmitter_input_t *t = &config.tx.transmitter_inputs[0];
    // adc_index = adc_channel_to_index(t->input);
    // printf("adc_index = %d\n", adc_index);
}
