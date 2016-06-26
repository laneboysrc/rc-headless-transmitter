#include <stdint.h>
#include <stdio.h>
#include <stdbool.h>

#include <libopencm3/stm32/adc.h>
#include <libopencm3/stm32/dma.h>
#include <libopencm3/stm32/gpio.h>
#include <libopencm3/stm32/rcc.h>

#include <config.h>
#include <inputs.h>
#include <sound.h>
#include <systick.h>


#define WINDOW_SIZE 10
#define SAMPLE_COUNT NUMBER_OF_ADC_CHANNELS * WINDOW_SIZE

// Values for auto-increment when momentary button is held
#define REPEAT_START_TIME 250
#define REPEAT_PAUSE_TIME 500
#define REPEAT_TIME 50

#define TRIM_BEEP_NOTE F4
#define TRIM_BEEP_TIME 30
#define TRIM_BEEP_NOTE_CENTER F5
#define TRIM_BEEP_TIME_CENTER 100
#define TRIM_BEEP_NOTE_MIN A5
#define TRIM_BEEP_TIME_MIN 100
#define TRIM_BEEP_NOTE_MAX TRIM_BEEP_NOTE_MIN
#define TRIM_BEEP_TIME_MAX TRIM_BEEP_TIME_MIN

#define SWITCH_BEEP_NOTE A5
#define SWITCH_BEEP_NOTE_5 A5
#define SWITCH_BEEP_TIME 65
#define SWITCH_BEEP_TIME_5 150

// State machine for momentary button handling
typedef enum {
    PB_IDLE = 0,
    PB_WAIT_FOR_RELEASE,
    PB_IDLE_SAWTOOTH_DOWN,
    PB_WAIT_FOR_RELEASE_SAWTOOTH_DOWN,
    PB_WAIT_FOR_RELEASE_CLICK1,
    PB_WAIT_FOR_CLICK2,
    PB_TRIM_DOWN_PRESSED,
    PB_TRIM_UP_PRESSED,
    PB_TRIM_DOWN_HELD,
    PB_TRIM_UP_HELD
} push_button_state_t;

typedef struct{
    int32_t value;
    uint8_t switch_value;
    push_button_state_t state;
    uint32_t state_timer;
} logical_input_value_t;


static uint16_t adc_array_oversample[SAMPLE_COUNT];
static uint16_t adc_array_raw[NUMBER_OF_ADC_CHANNELS];
static uint16_t adc_array_calibrated[NUMBER_OF_ADC_CHANNELS];

static int32_t normalized_inputs[NUMBER_OF_ADC_CHANNELS];
static uint8_t transmitter_digital_inputs[MAX_TRANSMITTER_INPUTS];

static logical_input_value_t logical_inputs[MAX_LOGICAL_INPUTS];

static uint8_t remaining_switch_beeps;


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
// Map n switch positions to the range of CHANNEL_N100_PERCENT..CHANNEL_100_PERCENT
static int32_t calculate_value_for_switch_position(uint8_t value, uint8_t n)
{
    int32_t step = (2 * CHANNEL_100_PERCENT) / (n - 1);

    return CHANNEL_N100_PERCENT + (step * value);
}


// ****************************************************************************
static void beep_trim(int32_t value)
{
    if (value == 0) {
        SOUND_play(TRIM_BEEP_NOTE_CENTER, TRIM_BEEP_TIME_CENTER, NULL);
    }
    else if (value >= config.tx.trim_range) {
        SOUND_play(TRIM_BEEP_NOTE_MAX, TRIM_BEEP_TIME_MAX, NULL);
    }
    else if (value <= -config.tx.trim_range) {
        SOUND_play(TRIM_BEEP_NOTE_MIN, TRIM_BEEP_TIME_MIN, NULL);
    }
    else {
        SOUND_play(TRIM_BEEP_NOTE, TRIM_BEEP_TIME, NULL);
    }
}


// ****************************************************************************
static void beep_switch_pause(void);
static void beep_switch_repeat(void);

static void beep_switch_pause(void)
{
    SOUND_play(PAUSE, SWITCH_BEEP_TIME, beep_switch_repeat);

}

static void beep_switch_repeat(void)
{
    if (remaining_switch_beeps > 5) {
        remaining_switch_beeps -= 5;
        SOUND_play(SWITCH_BEEP_NOTE_5, SWITCH_BEEP_TIME_5, beep_switch_pause);
    }
    else if (remaining_switch_beeps == 5) {
        remaining_switch_beeps = 0;
        SOUND_play(SWITCH_BEEP_NOTE_5, SWITCH_BEEP_TIME_5, NULL);
    }
    else if (remaining_switch_beeps == 1) {
        remaining_switch_beeps = 0;
        SOUND_play(SWITCH_BEEP_NOTE, SWITCH_BEEP_TIME, NULL);
    }
    else {
        remaining_switch_beeps -= 1;
        SOUND_play(SWITCH_BEEP_NOTE, SWITCH_BEEP_TIME, beep_switch_pause);
    }
}

static void beep_switch_value(uint8_t value)
{
    remaining_switch_beeps = value + 1;
    beep_switch_repeat();
}


// ****************************************************************************
// State machine for handing a n-position switch controlled by two momentary
// push buttons.
static void state_machine_up_down_buttons(logical_input_t *li, logical_input_value_t *v)
{
    uint8_t pb0 = 0;
    uint8_t pb1 = 0;

    pb0 = transmitter_digital_inputs[li->transmitter_inputs[0]];
    pb1 = transmitter_digital_inputs[li->transmitter_inputs[1]];

    switch (v->state) {
        case PB_IDLE:
            if (pb0) {
                if (v->switch_value > 0) {
                    --v->switch_value;
                }
                beep_switch_value(v->switch_value);
                v->state = PB_WAIT_FOR_RELEASE;
            }
            else if (pb1) {
                if (v->switch_value < (li->position_count - 1)) {
                    ++v->switch_value;
                }
                beep_switch_value(v->switch_value);
                v->state = PB_WAIT_FOR_RELEASE;
            }
            break;

        case PB_WAIT_FOR_RELEASE:
            if (!pb0 && !pb1) {
                v->state = PB_IDLE;
            }
            break;

        default:
            v->state = PB_IDLE;
            break;
    }
}


// ****************************************************************************
// State machine for handing a n-position switch controlled by a single
// momentary push buttons that increments the value and loops.
static void state_machine_increment_and_loop(logical_input_t *li, logical_input_value_t *v)
{
    uint8_t pb0 = 0;

    pb0 = transmitter_digital_inputs[li->transmitter_inputs[0]];

    switch (v->state) {
        case PB_IDLE:
            if (pb0) {
                if (v->switch_value < (li->position_count - 1)) {
                    ++v->switch_value;
                }
                else {
                    v->switch_value = 0;
                }
                beep_switch_value(v->switch_value);
                v->state = PB_WAIT_FOR_RELEASE;
            }
            break;

        case PB_WAIT_FOR_RELEASE:
            if (!pb0) {
                v->state = PB_IDLE;
            }
            break;

        default:
            v->state = PB_IDLE;
            break;
    }
}


// ****************************************************************************
// State machine for handing a n-position switch controlled by a single
// momentary push buttons that decrements the value and loops.
static void state_machine_decrement_and_loop(logical_input_t *li, logical_input_value_t *v)
{
    uint8_t pb0 = 0;

    pb0 = transmitter_digital_inputs[li->transmitter_inputs[0]];

    switch (v->state) {
        case PB_IDLE:
            if (pb0) {
                if (v->switch_value > 0) {
                    --v->switch_value;
                }
                else {
                    v->switch_value = li->position_count - 1;
                }
                beep_switch_value(v->switch_value);
                v->state = PB_WAIT_FOR_RELEASE;
            }
            break;

        case PB_WAIT_FOR_RELEASE:
            if (!pb0) {
                v->state = PB_IDLE;
            }
            break;

        default:
            v->state = PB_IDLE;
            break;
    }
}



// ****************************************************************************
// State machine for handing a n-position switch controlled by a single
// momentary push buttons that increases/decreases increments the switch
// position until the position n-1, then decrements the switch position until
// 0 ...
static void state_machine_saw_tooth(logical_input_t *li, logical_input_value_t *v)
{
    uint8_t pb0 = 0;

    pb0 = transmitter_digital_inputs[li->transmitter_inputs[0]];

    switch (v->state) {
        case PB_IDLE:
            if (pb0) {
                if (v->switch_value < (li->position_count - 1)) {
                    ++v->switch_value;
                    v->state = PB_WAIT_FOR_RELEASE;
                }
                else {
                    --v->switch_value;
                    v->state = PB_WAIT_FOR_RELEASE_SAWTOOTH_DOWN;
                }
                beep_switch_value(v->switch_value);
            }
            break;

        case PB_WAIT_FOR_RELEASE:
            if (!pb0) {
                v->state = PB_IDLE;
            }
            break;

        case PB_WAIT_FOR_RELEASE_SAWTOOTH_DOWN:
            if (!pb0) {
                v->state = PB_IDLE_SAWTOOTH_DOWN;
            }
            break;

        case PB_IDLE_SAWTOOTH_DOWN:
            if (pb0) {
                if (v->switch_value > 0) {
                    --v->switch_value;
                    v->state = PB_WAIT_FOR_RELEASE_SAWTOOTH_DOWN;
                }
                else {
                    ++v->switch_value;
                    v->state = PB_WAIT_FOR_RELEASE;
                }
                beep_switch_value(v->switch_value);
            }
            break;

        default:
            v->state = PB_IDLE;
            break;
    }
}


// ****************************************************************************
// State machine for handing a n-position switch controlled by a single
// momentary push buttons. Single clicks increment the switch position,
// double-clicks decrement the switch position.
static void state_machine_double_click_decrement(logical_input_t *li, logical_input_value_t *v)
{
    uint8_t pb0 = 0;

    pb0 = transmitter_digital_inputs[li->transmitter_inputs[0]];

    switch (v->state) {
        case PB_IDLE:
            if (pb0) {
                v->state_timer = milliseconds;
                v->state = PB_WAIT_FOR_RELEASE_CLICK1;
            }
            break;

        case PB_WAIT_FOR_RELEASE_CLICK1:
            if (!pb0) {
                v->state = PB_WAIT_FOR_CLICK2;
            }
            break;

        case PB_WAIT_FOR_CLICK2:
            if (pb0) {
                if (v->switch_value > 0) {
                    --v->switch_value;
                }
                beep_switch_value(v->switch_value);
                v->state = PB_WAIT_FOR_RELEASE;
            }
            else if (milliseconds > (v->state_timer + config.tx.double_click_timeout_ms)) {
                if (v->switch_value < (li->position_count - 1)) {
                    ++v->switch_value;
                }
                beep_switch_value(v->switch_value);
                v->state = PB_IDLE;
            }
            break;

        case PB_WAIT_FOR_RELEASE:
            if (!pb0) {
                v->state = PB_IDLE;
            }
            break;

        default:
            v->state = PB_IDLE;
            break;
    }
}


// ****************************************************************************
static void momentary_switch_state_machine(logical_input_t *li, logical_input_value_t *v)
{
    switch (li->sub_type) {
        case UP_DOWN_BUTTONS:
            state_machine_up_down_buttons(li, v);
            break;

        case INCREMENT_AND_LOOP:
            state_machine_increment_and_loop(li, v);
            break;

        case DECREMENT_AND_LOOP:
            state_machine_decrement_and_loop(li, v);
            break;

        case SAW_TOOTH:
            state_machine_saw_tooth(li, v);
            break;

        case DOUBLE_CLICK_DECREMENT:
            state_machine_double_click_decrement(li, v);
            break;

        default:
            break;
    }

    v->value = calculate_value_for_switch_position(v->switch_value, li->position_count);
}


// ****************************************************************************
static void trim_momentary_button_state_machine(logical_input_t *li, logical_input_value_t *v)
{
    uint8_t pb0 = 0;
    uint8_t pb1 = 0;

    pb0 = transmitter_digital_inputs[li->transmitter_inputs[0]];
    pb1 = transmitter_digital_inputs[li->transmitter_inputs[1]];

    switch (v->state) {
        case PB_IDLE:
            if (pb0) {
                v->state = PB_TRIM_DOWN_PRESSED;
                v->state_timer = milliseconds;
            }
            else if (pb1) {
                v->state = PB_TRIM_UP_PRESSED;
                v->state_timer = milliseconds;
            }
            break;

        case PB_TRIM_DOWN_PRESSED:
            if (!pb0) {
                // Down button release: execute one down step
                if (v->value > (0 - config.tx.trim_range)) {
                    v->value -= config.tx.trim_step_size;
                }
                beep_trim(v->value);
                v->state = PB_IDLE;
            }
            else if (pb1) {
                // Up button pressed too: center the trim
                v->value = 0;
                v->state = PB_WAIT_FOR_RELEASE;
                beep_trim(v->value);
            }
            else if (milliseconds > (v->state_timer + REPEAT_START_TIME)) {
                v->state = PB_TRIM_DOWN_HELD;
                v->state_timer = milliseconds;
            }
            break;

        case PB_TRIM_UP_PRESSED:
            if (!pb1) {
                // Up button release: execute one down step
                if (v->value < config.tx.trim_range) {
                    v->value += config.tx.trim_step_size;
                }
                beep_trim(v->value);
                v->state = PB_IDLE;
            }
            else if (pb0) {
                // Down button pressed too: center the trim
                v->value = 0;
                v->state = PB_WAIT_FOR_RELEASE;
                beep_trim(v->value);
            }
            else if (milliseconds > (v->state_timer + REPEAT_START_TIME)) {
                v->state = PB_TRIM_UP_HELD;
                v->state_timer = milliseconds;
            }
            break;

        case PB_TRIM_DOWN_HELD:
            if (!pb0) {
                // Wait for all buttons released
                v->state = PB_WAIT_FOR_RELEASE;
            }
            else if (milliseconds > (v->state_timer + REPEAT_TIME)) {
                if (v->value > (0 - config.tx.trim_range)) {
                    v->value -= config.tx.trim_step_size;
                    beep_trim(v->value);
                }

                v->state_timer = milliseconds;
                if (v->value == 0) {
                    v->state_timer += REPEAT_PAUSE_TIME;
                }
            }
            break;

        case PB_TRIM_UP_HELD:
            if (!pb1) {
                // Wait for all buttons released
                v->state = PB_WAIT_FOR_RELEASE;
            }
            else if (milliseconds > (v->state_timer + REPEAT_TIME)) {
                if (v->value < config.tx.trim_range) {
                    v->value += config.tx.trim_step_size;
                    beep_trim(v->value);
                }

                v->state_timer = milliseconds;
                if (v->value == 0) {
                    v->state_timer += REPEAT_PAUSE_TIME;
                }
            }
            break;

        case PB_WAIT_FOR_RELEASE:
            if (!pb0 && !pb1) {
                v->state = PB_IDLE;
            }
            break;

        default:
            v->state = PB_IDLE;
            break;
    }
}


// ****************************************************************************
static void read_switch(logical_input_t *li, logical_input_value_t *v)
{
    port_t first_port = li->transmitter_inputs[0];
    transmitter_input_t *t = &config.tx.transmitter_inputs[first_port];

    switch (t->type) {
        case SWITCH_ON_OFF:
            // Generic multi-position switch; n=2, 4..12
            if (li->position_count == 2) {
                v->switch_value = transmitter_digital_inputs[first_port];
                v->value = v->switch_value ? CHANNEL_100_PERCENT : CHANNEL_N100_PERCENT;
            }
            else {
                // n=4..12
                bool found = false;
                uint8_t value = 0;

                // Test all inputs associated with this multi-position switch
                for (int i = 0; i < li->position_count; i++) {
                    port_t port = li->transmitter_inputs[i];
                    if (transmitter_digital_inputs[port]) {
                        if (found) {
                            // More than one input set: illegal value, ignore!
                            return;
                        }

                        found = true;
                        value = i;
                    }
                }
                if (found) {
                    v->switch_value = value;
                    v->value = calculate_value_for_switch_position(value, li->position_count);
                }
            }
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
            momentary_switch_state_machine(li, v);
            break;

        default:
            break;
    }
}


// ****************************************************************************
static void read_bcd_switch(logical_input_t *li, logical_input_value_t *v)
{
    uint8_t value = 0;

    for (int i = 0; i < li->position_count; i++) {
        port_t port = li->transmitter_inputs[i];
        if (transmitter_digital_inputs[port]) {
            value += 1 << i;
        }
    }
    v->switch_value = value;
    v->value = calculate_value_for_switch_position(value, 1 << li->position_count);
}


// ****************************************************************************
static void read_trim(logical_input_t *li, logical_input_value_t *v)
{
    port_t first_port = li->transmitter_inputs[0];
    transmitter_input_t *t = &config.tx.transmitter_inputs[first_port];


    if (t->type == ANALOG_WITH_CENTER  ||  t->type == ANALOG_NO_CENTER) {
        v->value = get_normalized_input(first_port) * config.tx.trim_range / CHANNEL_100_PERCENT;
    }
    else {
        // Not analog, so must be two momentary buttons
        trim_momentary_button_state_machine(li, v);
    }

    // The switch value is not applicable for trims, so set it to 0
    v->switch_value = 0;
}


// ****************************************************************************
// Average the ADC channels
static void filter_analog_channels(void)
{
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
}


// ****************************************************************************
static void normalize_analog_input(transmitter_input_t *t)
{
    uint32_t raw;
    uint8_t adc_index;

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
    else {
        switch (t->type) {
            case ANALOG_NO_CENTER:
            case ANALOG_NO_CENTER_POSITIVE_ONLY:
                adc_array_calibrated[adc_index] = (raw - t->calibration[0]) * (ADC_VALUE_MAX + 1) / (t->calibration[2] - t->calibration[0]);
                break;

            case ANALOG_WITH_CENTER:
            default:
                if (raw == t->calibration[1]) {
                    adc_array_calibrated[adc_index] = ADC_VALUE_HALF;
                }
                else if (raw > t->calibration[1]) {
                    // Note: As above, clamp to (ADC_VALUE_MAX + 1)
                    adc_array_calibrated[adc_index] = ADC_VALUE_HALF + (raw - t->calibration[1]) * (ADC_VALUE_HALF + 1) / (t->calibration[2] - t->calibration[1]);
                }
                else {
                    adc_array_calibrated[adc_index] = (raw - t->calibration[0]) * ADC_VALUE_HALF / (t->calibration[1] - t->calibration[0]);
                }
                break;
        }
    }

    switch (t->type) {
        case ANALOG_NO_CENTER_POSITIVE_ONLY:
            normalized_inputs[adc_index] = adc_array_calibrated[adc_index] * CHANNEL_100_PERCENT / ADC_VALUE_MAX;
            break;

        case ANALOG_WITH_CENTER:
        case ANALOG_NO_CENTER:
        default:
            normalized_inputs[adc_index] = (adc_array_calibrated[adc_index] - ADC_VALUE_HALF) * CHANNEL_100_PERCENT / ADC_VALUE_HALF;
            break;
    }
}


// ****************************************************************************
// Normalize the analog transmitter inputs; read the digital transmitter
// inputs
static void compute_transmitter_inputs(void)
{
    for (int i = 0; i < MAX_TRANSMITTER_INPUTS; i++) {
        transmitter_input_t *t = &config.tx.transmitter_inputs[i];
        uint32_t gpioport = t->pcb_input.gpioport;
        uint16_t gpio = t->pcb_input.gpio;


        switch (t->type) {
            case ANALOG_NO_CENTER:
            case ANALOG_NO_CENTER_POSITIVE_ONLY:
            case ANALOG_WITH_CENTER:
                normalize_analog_input(t);
                break;

            case SWITCH_ON_OFF:
            case MOMENTARY_ON_OFF:
                transmitter_digital_inputs[i] = gpio_get(gpioport, gpio) ? 1 : 0;
                break;

            case SWITCH_ON_OPEN_OFF:
                // By default all inputs are pull-down, so this is what we
                // check first. If the input is low, we change to pull-up and
                // check the input again in a separate piece of code below.
                // We do this so that we have a delay between switching to
                // pull-up and reading the IO port.
                // We switch to pull-up only when necessary to avoid unnecessary
                // output noise.
                transmitter_digital_inputs[i] = 0;
                if (gpio_get(gpioport, gpio)) {
                    transmitter_digital_inputs[i] = 2;
                }
                else {
                    gpio_set(gpioport, gpio);     // Switch to pull-up
                }
                break;

            default:
                break;
        }
    }

    for (int i = 0; i < MAX_TRANSMITTER_INPUTS; i++) {
        transmitter_input_t *t = &config.tx.transmitter_inputs[i];
        uint32_t gpioport = t->pcb_input.gpioport;
        uint16_t gpio = t->pcb_input.gpio;

        switch (t->type) {
            case SWITCH_ON_OPEN_OFF:
                if (transmitter_digital_inputs[i] != 2) {
                    if (gpio_get(gpioport, gpio)) {
                        transmitter_digital_inputs[i] = 1;
                    }
                    gpio_clear(gpioport, gpio);     // Restore pull-down
                }
                break;

            default:
                break;
        }
    }
}


// ****************************************************************************
// Process the logical inputs using the new values obained by
// compute_transmitter_inputs
static void compute_logical_inputs(void)
{
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
// This function returns the battery voltage in millivolts
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
    filter_analog_channels();
    compute_transmitter_inputs();
    compute_logical_inputs();
}


// ****************************************************************************
int32_t INPUTS_get_value(label_t input)
{
    for (unsigned i = 0; i < MAX_LOGICAL_INPUTS; i++) {
        logical_input_t *li = &config.tx.logical_inputs[i];

        // Ignore TRIM and unused inputs
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

        // Ignore TRIM and unused inputs
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

        // Only find TRIM inputs
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
#if 0
    static uint32_t last_ms = 0;

    if ((milliseconds - last_ms) < 1000) {
        return;
    }
    last_ms = milliseconds;
#endif

#if 0
    printf("BAT: %lumV  ", INPUTS_get_battery_voltage());
    for (int i = 0; i < 4; i++) {
        printf("CH%d:%4ld%% (%4u->%4u)  ", i, CHANNEL_TO_PERCENT(normalized_inputs[i]), adc_array_raw[i], adc_array_calibrated[i]);
    }
    printf("\n");
#endif

#if 0
    printf("%lu, %u, %u\n", INPUTS_get_battery_voltage(), adc_array_raw[0], adc_array_raw[10]);
#endif

#if 0
    uint8_t adc_index;
    transmitter_input_t *t = &config.tx.transmitter_inputs[0];
    adc_index = adc_channel_to_index(t->input);
    printf("adc_index = %d\n", adc_index);
#endif

#if 1
    do {
        static uint8_t last_switch_value = 99;
        uint8_t value;

        value = INPUTS_get_switch_value(CH8);
        if (value != last_switch_value) {
            last_switch_value = value;
            printf("CH8: %d\n", value);
        }
    } while (0);
#endif

#if 0
    do {
        static int32_t last_value = 99;
        int32_t value;

        value = INPUTS_get_trim(ST);
        if (value != last_value) {
            last_value = value;
            printf("trim(ST): %ld\n", value);
        }
    } while (0);
#endif
}
