# Configurator

Since the *Headless TX* does not have a user interface itself, we need an
external device to configure it. We call this device or software *configurator*.

When connected to a *Headless TX*, the *configurator* can provide the following
functions:

* Live configuration of inputs, mixers, sub-trim values, end points, etc
- Live configuration of the transmitter hardware (inputs, their names and
  types, trims, invert)
- Calibration function for analog inputs (sticks, pots)
- Live mixer configuration
- Live output configuration (reversing, endpoints, sub-trim)
- Live display of stick, pot, switch, push-button, trims and output channel data
* Show the battery state

The *configurator* can also provide other functionality:

* Maintain a database of models and transmitter configurations
* Synchronize the model and transmitter database between *configurators*


The *configurator* functionality can be implemented in several different ways:

* Custom device

    Dedicated embedded device with display and buttons. Similar to a
    programming box for an ESC.

* Web app
* Smartphone app

Using the a *Web app* as *configurator*, which works in any modern browser, is the
most attractive option as it can be used on a wide range of devices: PC,
Smartphone, Tablet.

A *Chrome app*, which is similar to a *Web app*, would be able to access the
UART directly. This method is popular for multi-rotor control boards such as
Cleanflight. However, using a *Chrome app* limits the use to PCs, running a
particular browser only. That said, this option is still quite attractive from
an ease-of-use perspective: Install the *configurator* from the Chrome app-
store, connect a USB-to-serial converter, and off you go.



## Principles of operation

The *Headless TX* performs its operation based on a configuration that is
stored in its persistent memory. The configuration determines which inputs provides what functions, how the inputs are mixed to form output channels, etc.

The firmware is designed such that the configuration can be changed at run-time; the *Headless TX*  adapts to configurations dynamically.

The configuration comprises of settings that are transmitter hardware specific,
and setting that are model specific. The whole configuration is stored in one
place as one area of consecutive memory.

The *Headless TX* provides an API that allows an external device -- the
*configurator* -- to change the configuration.

The API is very simple: Read parts of the configuration memory, write parts of
the configuration memory, and copy from one memory area to another memory area
within the configuration memory.

The advantage of this method is that the implementation in the *Headless TX* is
very simple. On the down-side, the *configurator* must know the precise memory
layout of the all the elements within the configuration memory.



## Transports

The *Headless TX* offers the following transports natively:

* nRF Enhanced Shockburst protocol

    The nRF protocol makes use of the nRF24L01 used to send data to the model.
    *Configurator* data is sent in pauses when no model transmission is taking
    place.

* UART protocol

    The UART (serial port) protocol is available by connecting to the UART
    provided by the STM32.


All protocols are designed to be interchangeable, which means that the transport
is transparent to the application using it.

This implies that the protocol is designed around the lowest common denominator
provided by all transports.


### Bridging

Unfortunately a *Web app* -- our most attractive target for implementing the
*configurator* -- is not able to utilize any of the transports provided by the
*Headless TX* directly.

To be able to make a *configurator Web app*, we need a bridging mechanism that
goes between the *Headless TX* and the web app-based *configurator*. The
**HTTP** and **Websocket** protocols are ideal for this purpose.

Another potential transport would be **BLE**. The *Web Bluetooth* protocol
allows web apps to connect to BLE devices. However, *Web Bluetooth* is
relatively new and not mature yet.

For native *Smartphone apps* it would also be possible to utilize standardized
**Bluetooth SPP** (Serial Port Profile) modules, which could transport the UART
protocol over Bluetooth.

From a physical implementation point-of-view the bridge can be integrated into
the *Headless TX*. If implemented as separate device, the bridge can be used
for multiple *Headless TX*. Having the bridge as separate device means that
the user has to carry yet another device around when playing.


### Bridge protocol considerations

Ideally the protocol that a *Headless TX bridge* provides to the *configurator*
is equivalent, or at least very similar, to the native transport protocols
supported by the *Headless TX*.


### *Configurator* implementations

Refering to the discussion above, we can can summarize the available options of
how to implement the *configurator*:

* Custom device, UART protocol
    - PRO: Stand-alone device; Can be powered from the transmitter; Single device
    - CON: High development effort; Wired connection to the Tx; Potentially
           limited UI; Medium cost
* Custom device, nRF protocol
    - PRO: Stand-alone device; Wireless; Single device
    - CON: High development effort; Potentially limited UI; Medium cost
* Smartphone app, Websocket to UART bridge
    - PRO: Great user experience; Low cost
    - CON: High development effort; Wired connection
* Smartphone app, Websocket to nRF bridge
    - PRO: Great user experience; Wireless; Low cost
    - CON: High development effort
* Smartphone app, BLE to UART bridge
    - PRO: Great user experience; Low cost; Use existing BLE to UART bridge
    - CON: High development effort; Wired connection
* Smartphone app, BLE to nRF bridge
    - PRO: Great user experience; Wireless
    - CON: High development effort; Custom BLE to nRF bridge
* Smartphone app, Bluetooth SPP to UART bridge
    - PRO: Great user experience; Low cost; Use existing SPP module
    - CON: High development effort; Wired connection; High power consumption?
* Web app, Websocket to UART bridge
    - PRO: Good user experience; Reasonable development effort; Low cost
    - CON: Wired
* Web app, Websocket to nRF bridge
    - PRO: Good user experience; Reasonable development effort; Wireless;
           Low cost
    - CON:
* Web app, BLE to UART bridge
    - PRO: Good user experience; Reasonable development effort; Low cost
    - CON: Web Bluetooth not mature yet; Wired
* Web app, BLE to nRF bridge
    - PRO: Good user experience; Reasonable development effort; Wireless;
           Low cost
    - CON: Web Bluetooth not mature yet; Custom BLE to nRF bridge
* Chrome app, UART protocol
    - PRO: Good user experience; Reasonable development effort; Low cost
    - CON: Chrome browser on PC only; Wired;

In addition to the list above, we can also consider building any of the Web app
options as *Chrome app*. This may be as simple as adding a manifest file.

Some options were not considered:
* Smartphone app, Bluetooth SPP to nRF bridge
    The advantage of Bluetooth SPP is that off-the-shelf modules can be used. By
    bridging SPP to nRF custom hardware must be built, and for that other
    options are more attractive.

* Chrome app, UART to nRF bridge
    The main advantage of the Chrome app would be that it offers native serial
    port support. However, the UART to nRF bridge is non-standard and requires
    users to build one. This effort would be better directed to one of the *Web
    app* options, which are more universal. As stated above, the *Web app* may
    also be packaged as *Chrome app*.

From the table above, we conclude that a *Websocket to nRF bridge* is the
implementation that should receive highest priority. The


### Websocket to nRF/UART bridge

The cheapest way to build a bridge with a HTTP/Websocket interface is by using
**ESP8266** modules. The oldest modules have only a UART interface, but newer
versions provide access to an SPI port that would allow direct interfacing
with an nRF24L01 module.

Since the ESP8266 has a UART output, it may actually be a good first step to
implement a *Websocket to UART bridge*, and then extend it to
*Websocket to nRF*.

The *Websocket to nRF bridge* can be powered from a single, small Li-Ion cell.
A few LEDs should be provided for indicating status.

There will certainly be interference between Wi-Fi and the nRF protocol, but
given that during configuration all devices will be in close proximit that
should not be to much of a problem. Still, this requires testing!

The *Websocket to nRF bridge* can also easily be simulated, e.g. using Python.
This allows development of the *Web app* or *Smartphone app* without using
actual hardware.

Ideally the Websocket protocol corresponds 1:1 to the *nRF protocol*.


## Security considerations

While this implementation is used in toys, we may still think about issues that
can arise.

When the *configurator* connects via the UART directly, the *Headless TX* can
trust the *configurator* -- after all, physical access to the *Headless TX* was
obtained.

Things are different when the *configurator* connects via one of the wireless
methods. In case of an open system, anyone with a wireless *configurator* could
connect to our transmitter and ruin our day. This may not even be malicious:
Other *Headless TX* users may accidentally connect to our transmitter while
trying to configure their own unit.

A simple 4-digit pass-phrase can prevent accidental configuration from
happening.

Since the pass-phrase is stored as part of the transmitter configuration, our
own *configurator* could automatically log into the transmitter as it can
retrieve the pass-phrase from its local database. Others would not have the
configuration of our transmitter in their database, so they would need to enter
the pass-phrase.

Do note: a malicious user could sniff the pass-phrase while we connect to our
transmitter, or obtain it from a sync'ed copy of our database. But then, a
malicious user can also sniff our address and bind data and directly manipulate
our model; or simply jam the 2.4 GHz band. We therefore consider the pass-phrase
being sufficient.

Following tradition, the default pass-phrase of a virgin transmitter is '1234'.


## nRF protocol details

The nRF protocol integrates with the RF protocol that is employed in the
HobbyKing HK300, HK310 and 3XS transmitters. We refer to this protocol as
*HK310 protocol* from now on.


### The *HK310 protocol*

The *HK310 protocol* has the following properties:

* The legacy nRF24 protocol (non Shockburst version) is used at 250 kBps
* The address is 5 bytes long and changes from model to model
* All packets have a length of 10 bytes
* One burst of transmission occurs every 5 ms
* A transmission burst comprises of:
    - Two identical stick (or failsafe) packets, holding data for 3 channels
    - A bind packet, sent at low power with a fixed address on channel 81
* After each transmission burst, the the frequency is changed to the next in a
  list of 20 hop channels

One transmission burst (3 packets) take about 1.2 ms.

One challenge in the *Headless TX* was that due the use of inexpensive nRF24+PA
(power amplifier) module we were unable to output a really low RF power. Even at
the lowest power setting the bind packets could be received from quite far away.
In order to avoid interference with other RC transmitters, the Headless TX only
outputs bind packets for the first 10 seconds after power on.


### Integrating with the *HK310 protocol*

We extend the transmission burst of the *HK310 protocol* with one more
*configurator packet*. Therefore one *configurator packet* is sent every 5 ms.

The *configurator packet* use a different radio setup than the *HK310 protocol*:

* Enhanced Shockburst with auto-acknowledge (AA) enabled, with optional payload
* 2 MBps data rate
* Variable payload length up to the maximum of 32 bytes
* 2-byte CRC
* Lowest possible transmit power (at least on the *Headless TX* side, which
  utilizes a RF amplifier)
* ARD is set to 500 us

The Headless TX acts as the PTX (Primary role Transmitter, as defined in the
nRF24 specification), the *configurator* acts as PRX (Primary role Receiver).

The *configurator* is able to send information to the Headless TX as part of the
Acknowledge procedure when receiving a packet from the *Headless TX*.

From a protocol point-of-view, one could say that the *Headless TX* is the
master, and the *configurator* is the slave, with the master polling the slave
in regular intervals.


### nRF protocol states

The nRF Shockburst protocol is designed for one pair of PTX and PRX. Since there
is a possibility that more than one *configurator* is in use by different
persons, we must ensure that integrity is preserved. To achieve this, we only
allow one *configurator* to connect to a *Headless TX* at a given moment in
time.

From a protocol view, we differentiate between *NOT CONNECTED* and *CONNECTED*
state.


### nRF protocol *NOT CONNECTED* state

This is the default state for both the *Headless TX* and the *configurator*.

All communication in this state happens on the fixed nRF channel 111 with
address 4C:42:72:63:78 (`LBrcx` in hex).

NOTE: Channel 111 is 2.511 GHz, which is out of the 2.4 GHz band. Maybe we
should rather use another channel, e.g. 79?

The *Headless TX* sends a `TX_FREE_TO_CONNECT` packet whenever the transmission
burst for the vehicle is sending on the first hop channel. This means that
`TX_FREE_TO_CONNECT` packets are sent every 100 ms (20 hop channels times 5 ms
each).

The *configurator* listens for `TX_FREE_TO_CONNECT` and shows the user a list of
all transmitters in the neighborhood. When the user chooses a transmitter, the
*configurator* replies to the next `TX_FREE_TO_CONNECT` call with
`CFG_REQUEST_TO_CONNECT` and changes its state to `CONNECTED`.

When the *Headless TX* receives a `CFG_REQUEST_TO_CONNECT` request and the pass-
phrase matches, it changes its state to `CONNECTED`.


### nRF protocol *NOT CONNECTED* commands

Commands sent by the *Headless TX* always start with `TX_`. Command sent by the
*configurator* always start with `CFG_`.

* `TX_FREE_TO_CONNECT`

    `0x30 tx tx tx tx tx tx tx tx tx tx tx tx tx tx tx tx`

    tx: transmitter name 16 bytes (C-String [A-Z,a-z,0-9 ], 1..16 characters)


* `CFG_REQUEST_TO_CONNECT`

    `0x31 a0 a1 a2 a3 a4 h0 h1 h2 h3 h4 h5 h6 h7 h8 h9 ha hb hc hd he hf hg hh hi hj p0 p1`

    a0..4:  5 byte random nRF address to use during the connection
    h0..hj: 20 bytes hop channel number to use during the connection
    p0..1:  unsigned 16-bit representation of the 4-digit pass-phrase


### nRF protocol *CONNECTED* state

In *CONNECTED* state, the *Headless TX* sends one packet every 5 ms on the
address received in the `CFG_REQUEST_TO_CONNECT` packet, looping
through the 20 hop channels received in the same packet.

Note that the first packet after connection is sent on the first hop channel.
The *configurator* knows when to expect the packet: ~5 ms after the
`CFG_REQUEST_TO_CONNECT` was take out of its TX buffer by the Auto-Acknowledge
function.

Due to the use of the AA feature of the Shockburst protocol, every packet sent
by the *Headless TX* is acknowledged by the *configurator*, assuming the RF
connection is stable and the hop sequence is synchronized.

If the *Headless TX* does not receive any acknowledgment within a window of
600 ms, it enters the *NOT CONNECTED* state.

If the *configurator* does not receive any packet from from the *Headless TX*
within a window of 600 ms, it enters the *NOT CONNECTED* state. There may be
two reasons while the *configurator* never received any packets:

- The `CFG_REQUEST_TO_CONNECT` was lost or damaged during the transmission.
- The pass-phrase was incorrect.

The *configurator* may want to prompt the user for a new pass-phrase in case it
tried a pass-phrase automatically -- for example a pass-phrase stored in its
database.

While connected, the *configurator* can issue requests to the *Headless TX* by
adding the appropriate command to the AA payload.

When the *Headless TX* receives a packet acknowledgment without payload, or
there was no acknowledgment for whatever reasons, the *Headless TX* sends an
`TX_INFO` command as next packet.

The protocol is designed in such a way that every request from the
*configurator* (except `CFG_DISCONNECT`) causes the *Headless TX* to send a
packet that is **not** `TX_INFO` as the next packet. This way the *configurator*
can know whether its request has been successfully received: if it is `TX_INFO`,
something went wrong and the *configurator* must resend the request.

The *Headless TX* does not resend packets. Info packets are repeated
continuously, so no issue there. Missing responses to *configurator* requests
are handled by the *configurator*.

When the *Headless TX* receives a payload along with the packet acknowledgment,
it processes the command and responds with an appropriate answer in the next
packet (sent during the next transmission burst; i.e. approx 5 ms later).

### nRF protocol *CONNECTED* commands

Commands sent by the *Headless TX* always start with `TX_`. Command sent by the
*configurator* always start with `CFG_`.


* `CFG_READ`

    `0x72 a0 a1 cn`

    Read a chunk of data from the configuration.

    a0, a1: Offset within the configuration to read, unsigned 16 bit integer
    cn:     Number of bytes to read. Must be between 1 and 29

    The *Headless TX* provides the requested data in the next packet using
    the `TX_REQUESTED_DATA` command.

    In case the request lies outside of the configuration data, or count is
    invalid, the *Headless TX* ignores the request.


* `CFG_WRITE`

    `0x77 a0 a1 dt ...`

    Write data to the configuration.

    a0, a1: Offset within the configuration to write, unsigned 16 bit integer
    dt:    1..28 bytes of data

    The *Headless TX* responds with `TX_WRITE_SUCCESSFUL` in the next packet.

    In case the request lies outside of the configuration data, the *Headless
    TX* ignores the request.


* `CFG_COPY`

    `0x63 s0 s1 d0 d1 c0 c1`

    Copy a block of data from offset `source` to offset `destination` within the
    configuration. This command is useful when rearranging, deleting or
    inserting mixer units. Note that source and destinations may overlap -- the
    implementation in the *Headless TX* has to ensure correct behavior (hint:
    you can not use memcpy).

    s0, s1: Offset within the configuration to copy from, unsigned 16 bit integer
    d0, d1: Offset within the configuration to copy to, unsigned 16 bit integer
    c0, c1: Number of bytes to copy, unsigned 16 bit integer

    The *Headless TX* responds with `TX_COPY_SUCCESSFUL` in the next packet.

    In case the request lies outside of the configuration data, the *Headless
    TX* ignores the request.


* `CFG_DISCONNECT`

    `0x64`

    After receiving this request, the *Headless TX* immediately enters
    *NOT CONNECTED* state.

    After sending this command has been taken out of the *configurator* TX
    buffer by the Auto-Acknowledge function, the *configurator* enters
    *NOT CONNECTED* state. Note that this implies that the *configurator* has
    to wait for the next successful packet received from the *Headless TX*,
    which may take up to 600 ms (timeout) if the connection is poor. During this
    time the *configurator* is still assumed to be *CONNECTED* and must follow
    the
     hop sequence.


* `TX_INFO`

    `0x49 i0 i1 d0 d1 ...`

    Sent when there is no pending request from the *configurator*. Contains
    the current value of selected mixer inputs. See below for more information.

    i0, i1: Identifier for the mixer inputs. Corresponds to the enumeration
            called `src_label_t` in the firmware
    d0, d1: Current data of the input. Signed 16 bit integer.

    In total a single packet can contain info of up to 7 mixer inputs.


* `TX_REQUESTED_DATA`

    `0x52 a0 a1 dt ...`

    Sent in the next packet after receiving a `CFG_READ` request.

    a0, a1: Offset within the configuration as requested, unsigned 16 bit integer
    dt:    1..31 bytes of data starting at offset a0, a1


* `TX_WRITE_SUCCESSFUL`

    `0x57 i0 i1 d0 d1 ...`

    Sent in the next packet after receiving a `CFG_WRITE` request.
    The parameters are the same as described in `TX_INFO`.


* `TX_COPY_SUCCESSFUL`

    `0x43 i0 i1 d0 d1 ...`

    Sent in the next packet after receiving a `CFG_WRITE` request.
    The parameters are the same as described in `TX_INFO`.


## Bandwidth estimation

The read payload is up to 29 bytes, the write payload up to 28 bytes.

The size of the configuration in the *Headless TX* is 4620 bytes. The model
configuration uses 2892 bytes.
(Note: this may have changed after writing this document. Refer to the firmware
for the actual number)

Reading the configuration:

    1 packet every 5 ms -> 200 packets per second
    1 read packet == 29 bytes
    4620 bytes to read

    => 160 packets to transfer the whole configuration
    => 800 ms under ideal conditions
    => 5800 bytes per second, 46400 kBps

Writing the configuration:

    1 packet every 5 ms -> 200 packets per second
    1 write packet == 28 bytes
    4620 bytes to write

    => 165 packets to transfer the whole configuration
    => 825 ms under ideal conditions
    => 5600 bytes per second, 44800 kBps

Loading a new model:

    1 packet every 5 ms -> 200 packets per second
    1 write packet == 28 bytes
    2892 bytes to write

    => 104 packets to transfer the whole configuration
    => 520 ms under ideal conditions
    => 5600 bytes per second, 44800 kBps


## UART protocol

The UART runs at 115200 BAUD. Because the UART is a serial line without framing,
we need to use a packet framing protocol.

We have chosen for the SLIP protocol, defined in
[RFC 1055](https://tools.ietf.org/html/rfc1055).

The commands are exactly the same as for the *nRF protocol*.
