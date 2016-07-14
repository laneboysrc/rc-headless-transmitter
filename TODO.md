- Add sensible failsafe configuration

- Configurator nRF protocol
- Configurator Wi-Fi protocol
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


