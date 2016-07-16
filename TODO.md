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

- Fix issue with mixer.html not showing properly on small screens
- Make hop channel edit field wider

- Show which src labels are supported by the transmitter when selecting items

- Use addEventListener instead onclick and such
  - Add event listeners in MDLHelper, but watch out when revisiting the page
- Use input even on slider as it is active during sliding.

- Switch editing
- Curve editing
- Delete mixer units
  - Requires rearranging other mixers
- Add mixer units
  - Requires rearranging of the mixer unit order
- Add models
- Load models into the transmitter
- Add settings page to configure things like sync URL

- Use var instead of let to make Safari work?

- Database: add list function that retrieves entries for a given schema, with
  configurable values to  retrieve (e.g. name, tag, ...)
  - Works async as it directly accesses the storage

- Add uuid back into url so that we can retrieve the correct database entries
  on page reloads


- Add tabindex=0 to sliders etc (test if focusable with keyboard)

- Check all Text field validations and handle in code
  - Can we use the same regex to parse the result?
  - Do that in MDLHelper
    - use validity.valid on text field (if (inp.validity && inp.validity.valid) )
  - Watch out for ^, $ and white space
- Introduce options object to MDLHelper, and have one of such options be
  formatter and parser for address, hop channels