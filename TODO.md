
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

- Bug: 2 beep sound when momentary button down disconnects configurator?
  - Maybe has to do with persistent storage taking too long, therefore losing sync?

- Every *Switch* or *Trim* that uses a Momentary type *Hardware input* must remember their state across power cycles

- Test lots of active mixer units, check how long calculation takes


## Configurator
- Offline mode

- Database syncing
  - Which protocol?
    - File storage using JSON?
    - Custom REST protocol?
  - Look into Redis

- How do we get a description of the elements in the configuration?

- Implement passphrase UI

- Live stick/switch/output view
  - Add more elements like normalized ADC values, switch values, etc to live_t.

- Use https://github.com/jakearchibald/indexeddb-promised/blob/master/lib/idb.js
  - Prepare the database for multiple object stores

- Make help page for logical inputs to explain valid combinations

- ModelList needs a loading indicator while populating the available models

- LogicalInputs: Scroll to created logical input after performing 'add'

- Make ranges (limits, endpoints) not be able to go past each-other
  - Maybe make a custom element that limits upper and lower?

- YouTube and blog don't work when connected to the ESP
  - Build ESP configurator detector by checking if we can retrieve info from a random URL
  - Set time on ESP from connected browser?!

- Propagate nRF connection lost back via bridges
  - Especially important since the other protocols are considered reliable

- Need to be able to download transmitter configuration after firmware update
  - Easiest way for now is to build a tool that makes a .c file out of the backup JSON file
  - The backup JSON file should be human readable, right now it is just binary data wrapped in JSON

- Wi-Fi configuration through web interface
  - Need a sensible default, i.e. detect what the factory setting is
- Configurator frequencies should avoid Wi-Fi frequency

- Make nodejs-uart bridges aware of MSG_DEBUG for nRF51

- Parse and save manually entered RF address and channels

- LoadDevice should be in Device, not in device_list


- Add binary files and instructions





