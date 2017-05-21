# Futaba FP-2F analog meter

R = 400 Ohm
Full scale: 450 mV /
Red to orange: 225 mV /

The needle moves until 480mV (needle at far right), which should be our design maximum.

So we need a voltage divider from 3.3V to 0.48V, with the bottom resistor being 400 Ohm

      3.3       0.48            3.3 * 400
    ------- = -------   =>      --------- - 400 = x   =>   x = 2350 ohm  ~ 2200 Ohm
    x + 400     400                0.48

If we use 2k2, we get a maximum voltage of 508 mV, which is plenty.