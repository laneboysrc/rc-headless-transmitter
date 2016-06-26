#include <stdint.h>

#include <channels.h>
#include <config.h>
#include <curves.h>
#include <inputs.h>
#include <mixer.h>


// ****************************************************************************
// if (Switch) then
//     Destination  op  f(Curve, Source) * Scalar + Offset (+ Trim)
// endif
static void apply_mixer_unit(mixer_unit_t *m)
{
    int32_t value;
    int32_t *p_channel = &channels[m->dst - OUTPUT_CHANNEL_TAG_OFFSET];

    // STEP 1: Check switch and bail out if condition not met
    // FIXME:

    // STEP 2: Get source value; invert if necessary
    value = INPUTS_get_value(m->src) * (m->invert_source ? -1 : 1);

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
            *p_channel *= value / CHANNEL_100_PERCENT;

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

        trim = INPUTS_get_trim(m->src) * (m->invert_source ? -1 : 1);
        *p_channel += trim;
    }
}


// ****************************************************************************
void MIXER_evaluate(void)
{
    INPUTS_filter_and_normalize();

    for (uint8_t i = 0; i < NUMBER_OF_CHANNELS; i++) {
        channels[i] = 0;
    }

    for (unsigned i = 0; i < MAX_MIXER_UNITS; i++) {
        mixer_unit_t *m = &config.model.mixer_units[i];
        if (m->src == NONE) {
            break;
        }

        apply_mixer_unit(m);
    }
}


// ****************************************************************************
void MIXER_init(void)
{

}