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


## configurator
- Offline mode
- Database syncing
  - Which protocol?
    - File storage using JSON?
    - Custom REST protocol?
- Persistent data storage

- Fix issue with mixer.html not showing properly on small screens
- Make hop channel edit field wider
- Check all Text field validations and handle in code
  - Can we use the same regex to parse the result?

- Show which src labels are supported by the transmitter when selecting items

- Use addEventListener instead onclick and such
- Use input even on slider as it is active during sliding.

- Delete mixer units
- Add mixer units
- Switch editing
- Curve editing

- Use var instead of let to make Safari work?

- Refactor URL: use global variable for model and tx uuid
- Database: Add load function to cache a list of uuids
  - Because the database works async we but we need pages to access elements sync
- Database: add last_changed field direct access copy for syncing
- Rename database class to "device" (find a better name...) since the
  refactoring means it represents a tx/model combination
  - Maybe we really need to think about Tx and Model classes, with an underlying
    device class

- Database: add list function that retrieves entries for a given schema, with
  configurable values to  retrieve (e.g. name, tag, ...)
  - Works async as it directly accesses the storage

- Add tag to MODEL and TX that we can use e.g. to store a model type (airplane,
  car ...) or transmitter type (stick radio, vintage, 4-ch...)

- Add settings page to configure things like sync URL