- Add sensible failsafe configuration

- Programming box nRF protocol
- Programming box UART protocol
- Programming box BT protocol

## configurator
- Make type names human readable
- Make utils.js

- Host MDL and fonts locally for better speed
- Offline mode

- Change config.js so that we can have different config versions


- We need to limit destination channels, so we have to use something else than label_t
    - There are actually 3 lists:
        * labels that can be assigned to logical inputs
        * output channels (channels, virtual channels and hidden virtual channels)
        * mixer sources; this is the sum of the previous two
    - We must make enough space for hidden virtual channels, but they should not appear in the lists shown to the user. We still need to give the information about hidden virtual channels to the configurator so that we can use them for complex mixer types in the future
- Fix `OUTPUT_CHANNEL_TAG_OFFSET` appearing in select_single

- Fix issue with mixer.html not showing properly on small screens

- Show which src labels are supported by the transmitter when selecting items