# Headless TX  |  STM32F1 NRF24L01+ Headless Transmitter Architecture

## System overview

'''
    FIXME: Add overall system view with transmitter, configurator, and explain terms
'''

## Model vs Transmitter hardware configuration

* Ideally we are able to drive the same car with different transmitter hardware, with the system automatically adapting to the transmitter hardware
* This implies that inputs are tagged (e.g. Aileron, Rudder, Elevator, Steering, Throttle, Gear, ST-Trim, ST-DR, TH-Hold ...) so that the mixer can read from the right values
* An input may have multiple tags (Steering, Rudder) but each tag must only be assigned once
* The inputs also have generic tags like CH1, SW1... so that they can be used in mixers
* Inputs may have 0..100 on one transmitter, and -100..0..100 on another one, i.e. they may be with or without center point!
* If a mixer can not find its input, the input is considered value "0"
* The direction is normalized: forward, more, right = positive; backward, less, left = negative

* So the "mixer" describes the vehicle, but the input section describes the transmitter
* This should also allow us to extract "mixer" configurations from the 3XS model memory expansion EEPROM
* The *configurator* can change mixer configuration as well as hardware configuration

* Trims have to be assigneable to a specific input. Trims may be either a pair of push-buttons (option: support a separate centering button?) or a potentiometer, or be mechanical (i.e. not existant from a software point-of-view).



## Overall transmitter architecture

    +----------------+    +-----------------------------------+    +------------+   +--------+
    |                |    |                                   |    |            |   |        |
    |     INPUTS     |    |              MIXER                |    |  CHANNELS  |   |   RF   |
    |                |    |                                   |    |            |   | module |
    |                |    |   +---------------------------+   |    |  +-------+ |   |        |
    |  sticks,       |    |   |        Mixer unit         |   |    |  |  RF   | |   |        |
    |  pots,         |    |   +---------------------------+   |    |  |      +------->       |
    |  push-buttons  |    |   +---------------------------+   |    |  |       | |   |        |
    |  switches    +------->  |        Mixer unit         |  +------> +-------+ |   |        |
    |                |    |   +---------------------------+   |    |  +-------+ |   |        |
    |                |    |   +---------------------------+   |    |  |Virtual| |   |        |
    |                |    |   |                           |   |    |  |       | |   |        |
    |                |    |   +---------------------------+   |    |  |       | |   +--------+
    |                |    |                                   |    |  +-------+ |
    |                |    |                                   |    |            |
    +----------------+    |                                   |    +-----+------+
                          |                ...                |          |
                          |                                   |          |
                          |                                   |          |
                    +------>  +---------------------------+   |          |
                    |     |   |        Mixer unit         |   |          |
                    |     |   +---------------------------+   |          |
                    |     |                                   |          |
                    |     +-----------------------------------+          |
                    |                                                    |
                    |                                                    |
                    +----------------------------------------------------+

    (Diagram made with the awesome asciiflow.com)



## Inputs
To achieve maximum flexibility, the inputs (sticks, switches, pots etc) of the transmitter have been abstracted in three levels.

### PCB inputs
*PCB inputs* describe all available input ports on the circuit board of the transmitter, and their potential function. Since *PCB inputs* are determined by the hardware, they are a compile-time only configuration. In software we reference them as *pcb_inputs*.

The STM32F103C8T6 based hardware using the AliExpress board has the following *PCB inputs*:
* 9 analog/digital inputs
    * Can be configured as analog or digital input
* 9 digital inputs

### hardware inputs
Some, or all, *PCB inputs* are connected to control devices such as sticks, pots or switches in a particular transmitter. We refer to those as *Hardware inputs*. There is a 1:1 relationship between a *Hardware inputs* and a *PCB inputs*. A *Hardware input* narrows down the *PCB input* type to one of the following:

* Analog with center detent, spring-loaded auto-return to center: -100..0..100
* Analog with center detent: -100..0..100
* Analog without center detent: -100..100
* Analog without center detent, positive only: 0..100
* Switch on/off: Open / Vcc (pull-down)
* Switch 3-position:  GND / Open / Vcc
* Momentary: Open / Vcc (pull-down)

The analog type *Hardware inputs* can only be assigned to *PCB inputs* of type analog/digital.

For the analog inputs the *Hardware input* holds the endpoint- (and where applicable center-point) calibration values.
*Hardware inputs* are usually setup once when configuring a newly built transmitter.

In software, we reference *Hardware input* as *config.tx.hardware_inputs*.

### Logical inputs
In the configuration one or more *Hardware input* can be combined to form a *Logical input* that can be referenced as user input by the mixer.

Like *Hardware inputs*, *Logical inputs* are configured once for each physical transmitter hardware and do not need to be changed when configuring models.

Every logical input can have up to 5 *labels* that indicate the potential function of the input. This way one transmitter can have a Dual Rate switch, while another one can have a Dual Rate potentiometer. The mixers in the model configuration use the *labels* to retrieve the input values.

In software, we reference the *Logical inputs* as *config.tx.logical_inputs*.


There are several types of *logical inputs* available

* Analog
    * Can only have a single Analog type *Hardware input* assigned
* Momentary
    * Can only have a single Momentary type *Hardware input* assigned
* Switches
    * n-position switch
        * Can have a single Momentary type *Hardware input* assigned
            * Each press toggles to the next position
            * Can be configured to:
                * increment, loop
                * decrement, loop
                * saw-tooth
                * single-click increment, double-click decrement
            * Transmitter beeps the current number?
        * Can have a two Momentary type *Hardware input* assigned
            * up/down
        * n=3: can have a single 3-position switch *Hardware input* assigned
        * n=2,4..12 can have n on/off switch *Hardware input* assigned
            * In theory we could do with n-1 digital inputs, using the state when all inputs are open as first position. However, this may cause issues that the first position is triggered when switching between the other positions, as contacts may temporarily open.
            * Therefore it is better to use n inputs and treat "all inputs open"as well as "more than one input closed" as error condition.
* BCD switch n=2..4
    * Must have n on/off switch switch *Hardware input* assigned
    * Output values are 0..(2^n-1)
* Trims
    * Can have two Momentary type *Hardware inputs* assigned (up/down)
    * Can have a single Analog type *Hardware input* assigned (with or without detent, but must not be *Analog without center detent, positive only* or *Analog with auto return to center*)

**Every *Switch* or *Trim* that uses a Momentary type *Hardware input* must remember their state across power cycles**

### Input API
The mixer can acces the inputs by passing a *label* to one of the input functions.
If no input with the label is configured, the value returned by any of the functions is '0'.

`INPUTS_get_value(label_t l)`
Returns the value for the input with the label l in the range of

    CHANNEL_100_PERCENT .. CHANNEL_CENTER .. CHANNEL_N100_PERCENT

`INPUTS_get_switch_value(label_t l)`
The  *switch value* for Momentary and Switch functions is 0..n, where n is the number of positions the switch has. The  *switch value* for analog inputs is 0 or 1, depending whether the analog input is -100..0 or 0..100.
The switch value is retrieved in mixer-units to check whether a mixer-unit is enabled or disabled.

`INPUTS_get_trim(label_t l)`
Returns the trim value for the input corresponding to the label.



## Mixer
The mixer is derived from the DeviationTx project, but modified. The mixer calculates signed values where 100% corresponds to 10000. Internally the mixer calculates with signed 32 bit resolution.

### Mixer unit
The mixer unit is derived from the DeviationTx project. Each mixer-unit performs a simple function:

    if (Switch) then
        Destination  op  f(Curve, OptionalInvert(Source)) * Scalar + Offset + OptionalInvert(Trim)
    endif

where:
  - Switch: a switch state that, if true, enables the mixer unit. If Switch is <None> then the mixer unit is always enabled.
  - Destination: The destination channel that receives the output of the mixer unit.
  - op: The operation to perform. Can be
    * = replace destination channel value with output of the mixer unit),
    * += add mixer unit output to current destination channel value
    * *= multiply mixer unit output, with `CHANNEL_100_PERCENT` being treated as 100%, with the current destination channel value
    * MAX (whichever is greater, the current output channel or the output of the mixer)
    * MIN (whichever is smaller)
  - f(): One of the curve functions applied to the input source
  - OptionalInvert: Switch to invert the incoming Source
  - Source: The input source for the mixer unit. Can be
    - Phyiscal transmitter inputs (sticks, pots, switches, push-buttons)
    - Channels (output channels as sent to the receiver)
    - Virtual channels (10 available for user selection, 10 hidden for high-level mixer use)
  - Scaler: A scaling factor
  - Offset: An offset value to move the result up or down
  - Trim: If enabled then the trim value (range +/-100) is added to the mixer unit output, taking source channel inversion into account

Multiple mixer units can be configured to operate on the same destination. The order of which the mixer units are configured plays an important role of the final resulting channel value.

The mixer unit also receives a *tag* that is not used by the transmitter but provides information to the mixer UI in the *configurator*. Since high-level mixers in the UI may require more than one mixer-unit to implement, the UI can use the tags to identify the mixer-units that belong together and the corresponding high-level mixer function.

### Mapping mixer units to high-level mixing functions shown in the UI

Simple:
  - 1 mixer unit
  - Trim is enabled
  - Switch is "None"
  **Do we want to expose that, or should Expo/Dr be the default type**

Cut (TH-hold):
  - 1 mixer unit
  - Switch and Scale exposed, Source is *None*, Curve is *Fixed*, Offset is 0

Expo/Dr:
  - Up to 4 mixer units
  - Virtual setup:

    Src       Mixer       Condition   Mux    Dest
    -----------------------------------------------------
    (source)  f1/scalar1  None        =      (virtual)
    (source)  f2/scalar2  (switch1)   =      (virtual)
    (source)  f3/scalar3  (switch2)   =      (virtual)
    (virtual) 1:1/100%                (mux)  (destination)

  This way in the UI the Expo/Dr appears as a single mixer, which result can be mux'ed as normal.
  - UI shows:
    - 3 curves f1..3; f2/f3 can be set to "linked", which means they copy the value from f1
      - Note that "linked" can not be read back from the Tx. So if the user programs the same curve twice, when reading it back from the Tx it may be shown as linked.
        - Need to decide on the UI: is "linked" an entry in the curve, or is there a separate button like in the DeviationTx UI ("Mid-Rate", "Low-Rate")
    - 2 switches (switch1..2). If a switch is set to "None" that mixer unit is removed
    - 3 scalars to adjust the actual dual rate

Other types to think about:
* 4-wheel steering, with potentiometer to select seamlessly crabbing/2-wheel/4-wheel steering
* V-tail
* Flaperons

Note that in the UI a single of those mixers can have two outputs, for example for 4-wheel steering, or V-tail, or Flaperons


### Mixer resources

Because Expo/Dr can use up to 4 mixer units, we need to figure out how to detect that we run out of mixer units or (hidden) virtual channels. The overflow can occur when we add a mixer to a destination

Memory is not really an issue (20 KBytes on the MCU), but we have to read/write the settings over the air! Also the UI will be tricky if we allow too many mixer units.

10 Expo/DR = 40 mixer units

    typedef struct  {
        curve_t curve;
        label_t src;
        label_t dest;
        uint8_t sw;
        int8_t scalar;
        int8_t offset;
        uint8_t tag;
        unsigned invert_source : 1;
    } mixer_unit_t;

= 24 bytes per mixer unit
So 100 mixers would be 2.4 KBytes

The *configurator* must align the mixers in the TX so that they can be processed in one loop.

### Output channel configuration
After all mixers have been processed, each output channel has a value that needs to be sent to the receiver over the air. Before passing the channel value to the radio protocol, a final set of operations are performed to tweak the corresponding servo outputs:

- Normal/Reverse
- End points -/+
- Sub-trim (applied after scale/endpoints; We want this independent of scale)
- Fail-safe value
- Limit +/ (just hard limits, checked last)
- Speed (0..250, speed of output change in *degrees per 100 ms*)



## Battery indication:

* LED lights up when powered
* LED blinks when battery is low
* Regular beep when battery is low, getting more frequent the lower the battery gets

