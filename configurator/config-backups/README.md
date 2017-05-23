This folder contains backups of configurations for transmitters and models
owned by LANE Boys RC. They will most likely not be useful for you at all.

They were created by the configurator web-app, and can be reimported there
if needed. They were put here for backup purpose.



## Steering dual-rate

On some transmitters we may have a switch, on others we have a potentiometer.
Ideally we can use the same model configuration in both scenarios, and if neither pot nor switch is present the DR is set to 100%. Ideally the DR value for switch is 70%, and the minimum DR value for pot is 50%.

The dual rate is achived by *multiplying* the CH1 value (already derived from ST) by the amount specified by a mixer that uses ST-DR as input.

The following values apply to pots and switches:


            left/off      right/on       not present
    Pot     0             100            0
    SW      -100          100            0

The pot value is written for an pot of analog, positive only value.

Given this combination, we will use 3 point curve with the following mapping:

       x       y
    -100     100
       0     100
     100      70

We can not achieve unfortunately that the maximum DR value for the switch and pot are different.