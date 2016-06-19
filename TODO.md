* Add sensible failsafe configuration

* What to do with unused analog inputs, or analog inputs that are used as digital?
    * It seems that the analog input is still read when configured as digital input

* Ideally we should have a table that converts ADC numbers to the
  sequence index. This way `pcb_input_t` can hold the adc_channel, and `input.c`
  can lookup the table to find the corresponding index in the adc array memory
  for a given adc_channel.

* Dynamic input configuration based on config

* Support for switch, momentary buttons, etc

* Programming box nRF protocol
* Programming box UART protocol
* Programming box BT protocol
