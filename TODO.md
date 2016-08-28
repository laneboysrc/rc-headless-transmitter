- APACHE 2 license where necessary

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


## Configurator
- Offline mode

- Database syncing
  - Which protocol?
    - File storage using JSON?
    - Custom REST protocol?
  - Look into Redis

- How do we get a description of the elements in the configuration?

- Live stick/switch/output view
  - Create live_t that describes live inputs sent to the configurator. It compises
    all `src_label_t` inputs, but also switch values, trim values, and others
    such as battery voltage.

- Splash screen

- checkout beforeinstallprompt in manifest.json

- Use https://github.com/jakearchibald/indexeddb-promised/blob/master/lib/idb.js
  - Prepare the database for multiple object stores

- Toast and Snackbar text needs to move into HTML for translation

- Make help page for logical inputs to explain valid combinations

- ModelList needs a loading indicator while populating the available models

- LogicalInputs: Scroll to created logical input after performing 'add'

- Delete transmitter




- Use input event on slider as it is active during sliding.
- Stick calibration
- Websocket and UART protocol considered w/o error, NRF protocol auto-retry
- WRITE/READ/COPY promises must be stopped when disconnecting
- Curve editing: show appropriate points and adjust their name
