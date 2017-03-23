# Airtronics analog meter

R = 670 Ohm
Full scale: 400mV / 600uA
Orange to full: 200mV / 300uA
Red to orange: 140mV / 200uA

The needle moves until 500mV (needle at far right), which should be our design maximum.

So we need a voltage divider from 3.3V to 0.5V, with the bottom resistor being 670 Ohm

      3.3       0.5             3.3 * 670
    ------- = -------   =>      --------- - 670 = x   =>   x = 3752 ohm  ~ 3900 Ohm
    x + 670     670                0.5

If we use 3k9, we get a maximum voltage of 483 mV, which is plenty.