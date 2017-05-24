#include <stdint.h>
#include <stdbool.h>

#include <channels.h>
#include <config.h>
#include <curves.h>
#include <inputs.h>
#include <mixer.h>


// ****************************************************************************
static bool is_mixer_enabled(mixer_switch_t *sw)
{
    uint8_t value;

    if (sw->sw == NONE) {
        return true;
    }

    value = INPUTS_get_switch_value(sw->sw);

    switch(sw->cmp) {
        case EQUAL:
            return (value == sw->value);

        case NON_EQUAL:
            return (value != sw->value);

        case GREATER:
            return (value > sw->value);

        case GREATER_OR_EQUAL:
            return (value >= sw->value);

        case SMALLER:
            return (value < sw->value);

        case SMALLER_OR_EQUAL:
            return (value <= sw->value);

        default:
            return true;
    }
}


// ****************************************************************************
static int32_t get_value(src_label_t src)
{
    if (src >= FIRST_INPUT_LABEL &&  src <= LAST_INPUT_LABEL) {
        input_label_t input_src = src - FIRST_INPUT_LABEL;

        return INPUTS_get_value(input_src);
    }

    if (src >= FIRST_CHANNEL_LABEL &&  src <= LAST_CHANNEL_LABEL) {
        channel_label_t ch = src - FIRST_CHANNEL_LABEL;

        return channels[ch];
    }

    if (src >= FIRST_RF_CHANNEL_LABEL &&  src <= LAST_RF_CHANNEL_LABEL) {
        channel_label_t ch = src - FIRST_RF_CHANNEL_LABEL;

        return rf_channels[ch];
    }

    if (src == BATTERY_MV) {
        return INPUTS_get_battery_voltage();
    }

    // Something went wrong, let's return 0 ...
    return 0;
}


// ****************************************************************************
static int32_t get_trim(src_label_t src)
{
    if (src >= FIRST_INPUT_LABEL &&  src <= LAST_INPUT_LABEL) {
        input_label_t input_src = src - FIRST_INPUT_LABEL;

        return INPUTS_get_trim(input_src);
    }
    return 0;
}


// ****************************************************************************
// if (Switch) then
//     Destination  op  f(Curve, Source) * Scalar + Offset (+ Trim)
// endif
static void apply_mixer_unit(mixer_unit_t *m)
{
    int32_t value;
    int32_t *p_channel = &channels[m->dst];

    // STEP 1: Check switch and bail out if condition not met
    if (!is_mixer_enabled(&m->sw)) {
        return;
    }

    // STEP 2: Get source value; invert if necessary
    value = get_value(m->src) * (m->invert_source ? -1 : 1);

    // STEP 3: Apply curve
    value = CURVE_evaluate(&m->curve, value);

    // STEP 4: Apply scalar and offset
    value = value * m->scalar / 100 + PERCENT_TO_CHANNEL(m->offset);

    // STEP 5: Apply operation on the mixer output value and the destination
    switch (m->op) {
        case OP_REPLACE:
        default:
            *p_channel = value;
            break;

        case OP_ADD:
            *p_channel += value;
            break;

        case OP_MULTIPLY:
            *p_channel = (*p_channel * value) / CHANNEL_100_PERCENT;
            break;

        case OP_MIN:
            *p_channel = (*p_channel < value) ? *p_channel : value;
            break;

        case OP_MAX:
            *p_channel = (*p_channel > value) ? *p_channel : value;
            break;
    }

    // STEP 6: Apply trim
    if (m->apply_trim) {
        int32_t trim;

        trim = get_trim(m->src) * (m->invert_source ? -1 : 1);
        *p_channel += trim;
    }
}


// ****************************************************************************
void MIXER_evaluate(void)
{
    INPUTS_filter_and_normalize();

    for (unsigned i = 0; i < NUMBER_OF_CHANNELS; i++) {
        channels[i] = 0;
    }

    for (unsigned i = 0; i < MAX_MIXER_UNITS; i++) {
        mixer_unit_t *m = &config.model.mixer_units[i];
        if (m->src == SRC_NONE) {
            break;
        }

        apply_mixer_unit(m);
    }
}


// ****************************************************************************
void MIXER_init(void)
{
    // Nothing to do ...
}