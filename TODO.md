- Add sensible failsafe configuration

- Configurator nRF protocol
- Configurator Wi-Fi protocol
  - Using UART and Websocket, Python
  - Using nRF and Websocket, ESP8622
- Configurator UART protocol
- Configurator BT protocol

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


- Build a separate executable that dumps the configuration, instead of having
  the main app do it

## configurator
- Offline mode

- Database syncing
  - Which protocol?
    - File storage using JSON?
    - Custom REST protocol?
  - Look into Redis


- Show battery voltage on device_list

- How do we get a description of the elements in the configuration?

- Live stick/switch/output view
  - Create live_t that describes live inputs sent to the configurator. It compises
    all `src_label_t` inputs, but also switch values, trim values, and others
    such as battery voltage.

- Splash screen

- Use input event on slider as it is active during sliding.

- checkout beforeinstallprompt in manifest.json


- Center detent: beep when center (configurable?)

- Beep when throttle not 0 at start of transmitter, and refuse operation

- Beep SOS when config broken

- Use https://github.com/jakearchibald/indexeddb-promised/blob/master/lib/idb.js
  - Prepare the database for multiple object stores

- Curve editing: show appropriate points and adjust their name

- Make help page for logical inputs to explain valid combinations

- ModelList needs a loading indicator while populating the available models

- Delete transmitter

- Make select multiple number depend on logical input type, i.e. analog can only have one input

- Config: remove schematic reference, rather have schematic use pin names

- Toast and Snackbar text needs to move into HTML for translation
