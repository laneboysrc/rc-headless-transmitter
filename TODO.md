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
  - Look into Redis

- Add page for hop channel generation (radio buttons + generate button)

- Curve editing: show appropriate points and adjust their name

- Show which src labels are supported by the transmitter when selecting items

- Use addEventListener instead onclick and such
  - Add event listeners in MDLHelper, but watch out when revisiting the page
- Use input even on slider as it is active during sliding.

- Delete mixer units
  - Requires rearranging other mixers
- Add mixer units
  - Requires rearranging of the mixer unit order
- Add models
- Load models into the transmitter
- Add settings page to configure things like sync URL

- Database: add list function that retrieves entries for a given schema, with
  configurable values to retrieve (e.g. name, tag, ...)
  - Works async as it directly accesses the storage

- Add tabindex=0 to sliders etc (test if focusable with keyboard)

- Hint numbers-only input fields for hop channels, to get the right keyboard on
  mobile

- How do we get a description of the elements in the configuration?

- Build a separate executable that dumps the configuration, instead of having
  the main app do it

- Consider a generic way to describe live inputs sent to the configurator. It is
  mostly `src_label_t` inputs, but we must also be able to describe the switch
  value, trim values, and others such as battery voltage.
