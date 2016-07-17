#include <stdio.h>
#include <stdint.h>

#include <channels.h>
#include <config.h>
#include <limits.h>
#include <systick.h>

#define MIN(a,b) (((a)<(b))?(a):(b))
#define MAX(a,b) (((a)>(b))?(a):(b))


// ****************************************************************************
void LIMITS_apply(void)
{
    static uint32_t last_ms = 0;
    uint32_t elapsed_ms;

    elapsed_ms = milliseconds - last_ms;
    last_ms = milliseconds;

    for (int i = 0; i < NUMBER_OF_RF_CHANNELS; i++) {
        limits_t *l = &config.model.limits[i];
        int32_t input_value = channels[i];
        int32_t output_value;
        int32_t failsafe_value;

        // Map the channel CHANNEL_100_NPERCENT .. 0 .. CHANNEL_100_PERCENT to
        // (ep_l .. 0 .. ep_h) + subtrim.
        // This way the end points dictate throw (not hard stop) and the subtrim
        // dictates the center around the throws
        if (input_value >= 0) {
            output_value = l->subtrim + l->ep_h * input_value / CHANNEL_100_PERCENT;
        }
        else {
            output_value = l->subtrim + l->ep_l * input_value / CHANNEL_N100_PERCENT;
        }

        // Limit the speed a servo output can change.
        // l->speed unit is "degrees per 100 ms"
        if (l->speed) {
            int32_t rate;

            rate = CHANNEL_100_PERCENT * l->speed / 60 * elapsed_ms / 100;
            if (output_value - rf_channels[i] > rate) {
                output_value = rf_channels[i] + rate;
            }
            else if (output_value - rf_channels[i] < -rate) {
                output_value = rf_channels[i] - rate;
            }
        }

        // Clamp to the configurable limits
        output_value = MAX(output_value, l->limit_l);
        output_value = MIN(output_value, l->limit_h);

        // Set the failsafe value, applying subtrim
        failsafe_value = l->subtrim + l->failsafe;

        // Invert the channel if requested
        if (l->invert) {
            output_value = -output_value;
            failsafe_value = -failsafe_value;
        }

        // Clamp to hard-coded limits of +/-180% to ensure valid servo pulses
        output_value = MAX(output_value, HARD_LIMIT_L);
        output_value = MIN(output_value, HARD_LIMIT_H);
        failsafe_value = MAX(failsafe_value, HARD_LIMIT_L);
        failsafe_value = MIN(failsafe_value, HARD_LIMIT_H);

        rf_channels[i] = output_value;
        failsafe[i] = failsafe_value;
    }
}
