
- Add sensible failsafe configuration

- Separate hardware dependent files so that it is easy to port to other chips
  - How to deal with libopencm3?
  - Support STM32 Nucleo?
  - Support Teensy?

- Add auto-stick calibration function
    - Applies to all analog inputs
    - Triggered when the transmitter is powered on while at least one input
      of type `ANALOG_WITH_CENTER_AUTO_RETURN` or `MOMENTARY_ON_OFF` is
      held away from the center.
    - Needs to beep similar to self-timer on camera, getting faster when a
      timeout expires. Once expires, it measures the center position.
      Only analog inputs with a center are measured
    - When done, beep a different pattern and monitor the values. Record highest
      and lowest values. Make sure we've seen input on all analog channels
      before finishing the procedure, with a different beep.
    - While calibrating, still run the RF(?)

- Center detent: beep when center
  - Applies to `ANALOG_WITH_CENTER` only

- Beep when throttle not 0 at start of transmitter, and refuse operation
  - Find throttle by looking for "TH" and "THR" with analog type that is not `ANALOG_WITH_CENTER_AUTO_RETURN`
  - But still allow configurator to work
  - Can this be an issue when the sticks are not calibrated yet?

- Run-time adaptation to `hardware_inputs` and `logical_inputs` changes

- Test lots of active mixer units, check how long calculation takes

- Add version date (based on Git) to all software

## nRF51 UART bridge

- Hop timeout recover if multiple hops fail
- Send `MAX_PACKETS_IN_TRANSIT` upwards
- Implement a command to query the value for UART purpose, since there is no explicit connection on the UART as there is with websocket or other transports
- When connection is lost due to timeout this needs to be properly reported up


## Configurator
- Database syncing using RemoteStorage.io

- Use a better app-shell architecture
- Base on web components
  - Polymer? SkateJS? VUE.js?
  - Make ranges (limits, endpoints) not be able to go past each-other
    - Maybe make a custom element that limits upper and lower?

- Add help text
  - How do we get a description of the elements in the configuration?
  - Make help page for logical inputs to explain valid combinations

- Implement passphrase UI

- Live stick/switch/output view
  - Add more elements like normalized ADC values, switch values, etc to live_t.

- Use https://github.com/jakearchibald/indexeddb-promised/blob/master/lib/idb.js
  - Prepare the database for multiple object stores

- Propagate nRF connection lost back via bridges
  - Especially important since the other protocols are considered reliable

- The backup JSON file should be human readable, right now it is just binary data wrapped in JSON

- Make nodejs-uart bridges aware of MSG_DEBUG for nRF51

- Test virgin Raspberry Pi configurator and improve instructions
- Check for certificate errors when connecting to Raspberry Pi bridge

- Warning message if left/center/right in reverse order, or handle in SW automatically
- Warning message for configuration that is only applicable after reset, i.e. port settings
- Explain trim (logical inputs)
- What do colors mean when selecting labels on logical inputs?

- PWM output to drive old analog meter, relative to battery voltage