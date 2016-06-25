#include <stdint.h>

#include <channels.h>
#include <config.h>
#include <curves.h>
#include <inputs.h>
#include <mixer.h>


// ****************************************************************************
// if (Switch) then
//     Destination  op  f(Curve, Source) * Scalar + Offset
// endif
static void apply_mixer_unit(mixer_unit_t *m)
{
    int32_t value;

    // 1st: Get source value
    value = INPUTS_get_value(m->src);

    // Invert if necessary
    if (m->invert_source) {
        value = - value;
    }

    // 2nd: apply curve
    value = CURVE_evaluate(&m->curve, value);

    // 3rd: apply scalar and offset
     value = value * m->scalar / 100 + PERCENT_TO_CHANNEL(m->offset);

     channels[m->dest - CH1] = value;
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