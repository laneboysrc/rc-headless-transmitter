- Add sensible failsafe configuration

- Programming box nRF protocol
- Programming box UART protocol
- Programming box BT protocol

- PCB inputs should carry human readable Pin name, Pin number, Schematic reference
- *Transmitter inputs* should be named *hardware inputs* instead
- Programming box should be named configurator
- tx structure needs a GUID
    - By default the GUID is 0 (or all 0xff?). Upon first contact with a programming box, the programming box assignes a GUID automatically
- tx structure needs a human readable name
- model structure needs a GUID
