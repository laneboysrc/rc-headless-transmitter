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

- Show which src labels are supported by the transmitter when selecting items

- Delete transmitter

- Prepare for translation

- Show battery voltage on device_list

- Add tabindex=0 to sliders etc (test if focusable with keyboard)

- How do we get a description of the elements in the configuration?

- Live stick/switch/output view
  - Create live_t that describes live inputs sent to the configurator. It compises
    all `src_label_t` inputs, but also switch values, trim values, and others
    such as battery voltage.

- Splash screen

- Use input event on slider as it is active during sliding.

- Add model icon data

- checkout beforeinstallprompt in manifest.json

- Refactor using Babel, and Promises, and Error object, TypeError when WS is not blob

- History mangling does not seem to work well on Chrome (Android)
  - Maybe needs setTimeout hack

- In all button onclick handlers pass the event along (ModelList.addModel(event);)
  In the function call Utils.cancelBubble(event);
  We need this to make div onclick handlers that trigger the button work



- Rework configurator protocol to use UUID so that we know to which device
  we want to connect
  - Instead of sending all hop channels, send a seed and max-channel and use
    a LFSR (0..125 range)
- Remove copy command, it won't work over the slow websocket
  - Instead we must be able to get and set the whole mixerunit structure

- Use https://github.com/jakearchibald/indexeddb-promised/blob/master/lib/idb.js
  - Prepare the database for multiple object stores


- ModelList needs a loading indicator while populating the available models

- Curve editing: show appropriate points and adjust their name

- Delete mixer units
  - Requires rearranging other mixers
  - Include undo
- Add mixer units
- Re-arrange mixer units
  - Use individual cards for each mixer, and have a up and down arrow to
    move it around

- i++ instead i+=1
- use const
- use let instead of var
- Rename dev to Device, rename database_object to devObject?

- Fix drawer being open when returning

- ModelList: sort models by name