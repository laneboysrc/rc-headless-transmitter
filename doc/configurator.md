# Configurator

Since the *Headless TX* does not have a user interface, we need an external device to configure it. We call this device or software *Configurator*.

When connected to a *Headless TX*, the *Configurator* can provide the following functions:

* Live configuration of inputs, mixers, sub-trim values, end points, etc
* Live configuration of the transmitter hardware (inputs, their names and types, trims, invert)
* Live mixer configuration
* Live output configuration (reversing, endpoints, sub-trim)
* Calibration function for analog inputs (sticks, pots)
* Live display of stick, pot, switch, push-button, trims and output channel data
* Show the battery state

The *Configurator* can also provide other functionality:

* Maintain a database of models and transmitter configurations
* Synchronize the model and transmitter database with other *configurators*


The *Configurator* functionality can be implemented in different ways:

* Custom device

    Dedicated embedded device with display and buttons. Similar to a programming box for an ESC.

* Web app

    An application that runs in a Web browser

* Smartphone app

Using the a *Web app* as *Configurator*, which works in any modern browser, is the most attractive option as it can be used on a wide range of devices: PC, Smartphone, Tablet.

A *Chrome app*, which is similar to a *Web app*, would be able to access the UART (serial port) directly. This method is popular for multi-rotor control boards such as Cleanflight. However, using a *Chrome app* limits the use to PCs, running a particular browser only. That said, this option is still quite attractive from an ease-of-use perspective: Install the *Configurator* from the Chrome App-store, connect a USB-to-serial converter, and off you go.



## Principle of operation

The *Headless TX* performs its operation based on a configuration that is stored in its persistent memory (Flash memory of the microcontroller). The configuration determines which inputs provides what functions, how the inputs are mixed to form output channels, etc.

The firmware is designed such that the configuration can be changed at run-time; the *Headless TX* adapts to configurations dynamically.

The configuration comprises of settings that are transmitter hardware specific, and setting that are model specific. While the transmitter hardware and model specific settings are kept separate, they are stored in one area of consecutive memory.

The *Headless TX* provides an API that allows an external device -- the *Configurator* -- to change the configuration.

The API is very simple: Read parts of the configuration memory, write parts of the configuration memory, and copy from one memory area to another memory area within the configuration memory.

The advantage of this method is that the implementation in the *Headless TX* is very simple. On the down-side, the *Configurator* must know the precise memory layout of the all the elements within the configuration memory.



## Transports

The *Configurator* must be able to connect to a *Headless TX* in order to perform operations on the API provided by the *Headless TX*.

The *Headless TX* offers the following transports natively:

* nRF Enhanced Shockburst protocol

    The nRF protocol makes use of the nRF24L01 used to send data to the model. *Configurator* data is sent in pauses when no model transmission is taking place.

* UART protocol

    The UART (serial port) protocol is available by connecting to the UART provided by the microcontroller.


The design goal is to keep the protocol running over the different transports the same, so that the transports appear transparent to the *Configurator*.

This implies that the protocol is designed around the lowest common denominator provided by all transports.


### Bridging

Unfortunately a *Web app* -- our most attractive target for implementing the *Configurator* -- is not able to utilize any of the transports provided by the *Headless TX* directly.

To be able to make a *Configurator Web app*, we need a bridging mechanism that goes between the *Headless TX* and the *Configurator*. The **HTTP** and **Websocket** protocols are ideal for this purpose.

Another potential transport would be **BLE**. The *Web Bluetooth* protocol allows web apps to connect to BLE devices. However, *Web Bluetooth* is relatively new and not mature yet.

For native *Smartphone apps* it would also be possible to utilize standardized **Bluetooth SPP** (Serial Port Profile) modules, which could transport the UART protocol over Bluetooth.

From a physical implementation point-of-view, the bridge can be integrated into the *Headless TX*. If implemented as separate device, a single bridge can be used for multiple *Headless TX*.
On the down-side, having the bridge as separate device means that the user has to carry yet another device around when playing.


### Bridge protocol considerations

Ideally the protocol that a *Headless TX bridge* provides to the *Configurator* is equivalent, or at least very similar, to the native transport protocols supported by the *Headless TX*.


### *Configurator* implementations

Refering to the discussion above, we can can summarize the available options of
how to implement the *Configurator*:

* Custom device, UART protocol
    - PRO: Stand-alone device; Can be powered from the transmitter; Single device
    - CON: High development effort; Wired connection to the Tx; Potentially limited UI; Medium cost
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
    - PRO: Good user experience; Reasonable development effort; Wireless; Low cost
    - CON:
* Web app, BLE to UART bridge
    - PRO: Good user experience; Reasonable development effort; Low cost
    - CON: Web Bluetooth not mature yet; Wired
* Web app, BLE to nRF bridge
    - PRO: Good user experience; Reasonable development effort; Wireless; Low cost
    - CON: Web Bluetooth not mature yet; Custom BLE to nRF bridge
* Chrome app, UART protocol
    - PRO: Good user experience; Reasonable development effort; Low cost
    - CON: Chrome browser on PC only; Wired;

In addition to the list above, we can also consider building any of the Web app options as *Chrome app*. This may be as simple as adding a manifest file.

Some options were not considered:

* Smartphone app, Bluetooth SPP to nRF bridge

    The advantage of Bluetooth SPP is that off-the-shelf modules can be used. By bridging SPP to nRF custom hardware must be built, and for that other options are more attractive.

* Chrome app, UART to nRF bridge

    The main advantage of the Chrome app would be that it offers native serial port support. However, the UART to nRF bridge is non-standard and requires users to build one. This effort would be better directed to one of the *Web app* options, which are more universal. As stated above, the *Web app* may also be packaged as *Chrome app*.

From the table above, we conclude that a *Websocket to nRF bridge* is the implementation that should receive highest priority.


### Websocket to nRF/UART bridge

The cheapest way to build a bridge with a HTTP/Websocket interface is by using **ESP8266** modules. The older ESP8266 modules have only a UART interface, but newer versions provide access to an SPI port that would allow direct interfacing with a nRF24L01 module.

Since the ESP8266 has a UART output, it may actually be a good first step to implement a *Websocket to UART bridge*, and then extend it to *Websocket to nRF*.

The *Websocket to nRF bridge* can be powered from a single, small Li-Ion cell. A few LEDs should be provided for indicating status.

There will certainly be interference between Wi-Fi and the nRF protocol, but given that during configuration all devices will be in close proximity that should not be to much of a problem. Still, this requires testing!

The *Websocket to nRF bridge* can also easily be simulated, e.g. using Python or NodeJS. This allows development of the *Web app* or *Smartphone app* without using actual hardware.



## Security considerations

While this device falls in the category of *Toy*, we still must consider potential security issues.

When the *Configurator* connects via the UART directly, the *Headless TX* can trust the *Configurator* -- after all, physical access to the *Headless TX* was obtained.

Things are different when the *Configurator* connects via one of the wireless methods. In case of an open system, anyone with a wireless *Configurator* could connect to our transmitter and ruin our day. This may not even be malicious: Other *Headless TX* users may accidentally connect to our transmitter while trying to configure their own unit.

A simple 4-digit pass-phrase can prevent accidental configuration from happening.

Since the pass-phrase is stored as part of the transmitter configuration, our own *Configurator* could automatically log into the transmitter as it can retrieve the pass-phrase from its local database. Others would not have the configuration of our transmitter in their database, so they would need to enter the pass-phrase.

Do note: a malicious user could sniff the pass-phrase while we connect to our transmitter, or obtain it from a sync'ed copy of our database. But then, a malicious user can also sniff our address and bind data and directly manipulate our model; or simply jam the 2.4 GHz band. We therefore consider the pass-phrase being sufficient.

Following tradition, the default pass-phrase of a virgin transmitter is the same as we use on our luggage: '1234'.



## nRF protocol details

The nRF protocol integrates with the RF protocol that is employed in the HobbyKing HK300, HK310 and 3XS transmitters. We refer to this protocol as *HK310 protocol* from now on.


### The *HK310 protocol*

The *HK310 protocol* has the following properties:

* The legacy nRF24 protocol (non Shockburst version) is used at 250 KBps
* The address is 5 bytes long and is unique for each model
* All packets sent by the transmitter have a payload length of 10 bytes
* One burst of transmission occurs every 5 ms
* A transmission burst comprises of:
    - Two identical stick (or failsafe) packets, with data for 3 channels
    - A bind packet, sent at low power with a fixed address on channel 81
* After each transmission burst, the the frequency is changed to the next in a list of 20 hop channels

One transmission burst takes about 1.2 ms.

One challenge in the *Headless TX* was that, due the use of inexpensive nRF24+PA (power amplifier) module, we were unable to output at a really low RF power. Even at the lowest power setting the bind packets can be received from quite far away. In order to avoid interference with other RC transmitters, the *Headless TX* therefore only outputs bind packets for the first 10 seconds after power on.


### Integrating with the *HK310 protocol*

We extend the transmission burst of the *HK310 protocol* with one more *configurator packet*. This implies that one *configurator packet* is sent every 5 ms.

The *configurator packet* use a different radio setup than the *HK310 protocol*:

* Enhanced Shockburst with auto-acknowledge (AA) enabled, with optional ACK payload
* 2 MBps data rate
* Variable payload length up to the maximum of 32 bytes
* 2-Byte CRC
* Lowest possible transmit power (at least on the *Headless TX* side, which utilizes a RF amplifier)
* ARD is set to 500 us

The *Headless TX* acts as the PTX (Primary role Transmitter, as defined in the
nRF24 specification), the *Configurator* acts as PRX (Primary role Receiver).

The *Configurator* is able to send information to the Headless TX as part of the
Acknowledge procedure when receiving a packet from the *Headless TX*.

From a protocol point-of-view, one could say that the *Headless TX* is the master, and the *Configurator* is the slave, with the master polling the slave in regular intervals.


### nRF protocol states

The nRF Shockburst protocol is designed for one pair of PTX and PRX. Since there is a possibility that more than one *Configurator* is in use at the same time, we must ensure that integrity is preserved. To achieve this, we only allow one *Configurator* to connect to a *Headless TX* at a given moment in time.

From a protocol view, we achieve this by differentiating between *NOT CONNECTED* and *CONNECTED* state.


### nRF protocol *NOT CONNECTED* state

This is the default state for both the *Headless TX* and the *Configurator*.

All communication in this state happens on the fixed nRF channel **79** with address **4C:42:72:63:78** (`LBrcx` in hex).

The *Headless TX* sends a `TX_FREE_TO_CONNECT` packet whenever the transmission burst is sending on the first hop channel. This means that `TX_FREE_TO_CONNECT` packets are sent every 100 ms (20 hop channels times 5 ms each).

Since there may be multiple *Headless TX* on the air, the `TX_FREE_TO_CONNECT` packet contains the 8-byte UUID of the transmitter as well as a human-readable transmitter name.

The *Configurator* listens for `TX_FREE_TO_CONNECT` and shows the user a list of all transmitters in the neighborhood. When the user chooses a transmitter, the *Configurator* replies to the next `TX_FREE_TO_CONNECT` call with `CFG_REQUEST_TO_CONNECT` and changes its state to `CONNECTED`.
The `CFG_REQUEST_TO_CONNECT` packet contains the UUID of the transmitter to connecto to, the pass-phrase, a unique 5-byte address and hop channel information.

When the *Headless TX* receives a `CFG_REQUEST_TO_CONNECT` request with a matching UUID and pass-
phrase, it changes its state to `CONNECTED`.

The nRF24 PRX function itself does not provide a method to receive packets without acknowledging them. This would mean that if multiple *Configurator* are present, each listening for `TX_FREE_TO_CONNECT` packets, every *Configurator* will send ACK responses at the same time, causing issues.

To overcome this problem, the *Headless TX* broadcasts the `TX_FREE_TO_CONNECT` packets with the `W_TX_PAYLOAD_NOACK` feature of the nRF24. This method transmits a packet without requesting the PRX to acknowledge it. All *Configurator* can receive the  `TX_FREE_TO_CONNECT` packet but no-one is acknowledging it.

In order to answer the  `TX_FREE_TO_CONNECT` packet, immediately after the `TX_FREE_TO_CONNECT` was broadcast the *Headless TX* sends yet another packet with a single byte payload, but using the lower 5 Bytes of the UUID as address. This packet requests an acknowledgement from a PRX and is unique for each transmitter.

This means that when a *Configurator* sends a `CFG_REQUEST_TO_CONNECT` packet, it does so by configuring the address to the lower 5 Bytes of the UUID.


### nRF protocol *NOT CONNECTED* commands

Commands sent by the *Headless TX* always start with `TX_`. Command sent by the *Configurator* always start with `CFG_`.

All data is in little endian format, i.e. the least significant byte is transmitted first.

* `TX_FREE_TO_CONNECT`

    `0x30 uu uu uu uu uu uu uu uu uu tx tx tx tx tx tx tx tx tx tx tx tx tx tx tx tx b0 b1`

    uu:     Transmitter UUID 8 bytes
    tx:     Transmitter name 16 bytes (\0-terminated C-String [A-Z,a-z,0-9 ],
            padded with \0)
    b0, b1: Battery voltage in millivolts. Unsigned 16 bit integer.

    When sending this packet, the auto-acknowledge feature of the nRF24 is disabled. This is acheived by using the `W_TX_PAYLOAD_NOACK` nRF24 SPI command.

    Immediately after the packet was sent, another packet is sent, this time with the auto-acknowledge enabled (regular `W_TX_PAYLOAD` nRF SPI command). This command is sent on the address comprising of the lower 5 Bytes of the transmitter UUID. The payload is

    `0x30`

* `CFG_REQUEST_TO_CONNECT`

    `0x31 uu uu uu uu uu uu uu uu uu a0 a1 a2 a3 a4 p0 p1 oo sd`

    uu:     Transmitter UUID 8 bytes
    a0..4:  5 byte random nRF address to use during the connection
    p0..1:  unsigned 16-bit representation of the 4-digit pass-phrase
    oo, sd: offset and seed for a 7-bit Galois LFSR to calculate the hop channel sequence

    `oo` and `sd` are used to calculate the hop seqeunce for the connection.

    `sd` is the initial state of a [7-bit Galois LFSR](https://en.wikipedia.org/wiki/Linear-feedback_shift_register), `polynomial x^7 + x^6 + 1`. `sd` must be between 1 and 127.
    Offset `oo` is added after each LFSR round, with a modulo of 127.
    Values larger than 69 are skipped so that the resulting hop channels are between 1 and 69 only.

    The following pseudo-code shows how the 20 hop channels used during the *CONNECTED* state are calculated:

        oo = received_oo
        lfsr = received_sd

        function next
            do
                lsb = lfsr & 1;
                lfsr >>= 1;
                if (lsb) {
                    lfsr ^= 0x60;   // x^7 + x^6 + 1
                }
                channel = (lfsr + oo) % 127;
            while (channel > 69  &&  channel in hop_channels);
            // Note: this loop runs worst-case 7 times

            return channel
        end function next

        for i in 0..19
            hop_channel[i] = next()


### nRF protocol *CONNECTED* state

In *CONNECTED* state, the *Headless TX* sends one packet every 5 ms on the address received in the `CFG_REQUEST_TO_CONNECT` packet, looping through the 20 hop channels received in the same packet.

Note that the first packet after connection is sent on the first hop channel. The *Configurator* knows when to expect the packet: ~5 ms after the `CFG_REQUEST_TO_CONNECT` was taken out of its TX buffer by the auto-acknowledge function.

Due to the use of the AA feature of the Shockburst protocol, every packet sent by the *Headless TX* is acknowledged by the *Configurator*, assuming the RF connection is stable and the hop sequence is synchronized.

If the *Headless TX* does not receive any acknowledgment within a window of 600 ms, it enters the *NOT CONNECTED* state.

If the *Configurator* does not receive any packet from from the *Headless TX* within a window of 600 ms, it enters the *NOT CONNECTED* state. There may be two reasons why the *Configurator* never received any packets:

- The `CFG_REQUEST_TO_CONNECT` message was lost or damaged during transmission.
- The pass-phrase was incorrect.

The *Configurator* may want to prompt the user for a new pass-phrase in case it tried a pass-phrase automatically -- for example a pass-phrase stored in its database.

While connected, the *Configurator* can issue requests to the *Headless TX* by adding the appropriate command to the auto-acknowledge payload.

When the *Headless TX* receives a packet acknowledgment without payload, or there was no acknowledgment for whatever reasons, the *Headless TX* sends an `TX_INFO` command as next packet.

The protocol is designed in such a way that every request from the *Configurator* (except `CFG_DISCONNECT`) causes the *Headless TX* to send a packet that is **not** `TX_INFO` as the next packet. This way the *Configurator* can know whether its request has been successfully received: if it is `TX_INFO`, something went wrong and the *Configurator* must resend the request.

The *Headless TX* does not resend packets. Info packets are repeated continuously, so no issue there. Missing responses to *Configurator* requests are handled by the *Configurator*.

When the *Headless TX* receives a payload along with the packet acknowledgment, it processes the command and responds with an appropriate answer in the next packet (sent during the next transmission burst; i.e. approx 5 ms later).


### nRF protocol *CONNECTED* commands

Commands sent by the *Headless TX* always start with `TX_`. Command sent by the *Configurator* always start with `CFG_`.

All data is in little endian format, i.e. the least significant byte is transmitted first.


* `CFG_READ`

    `0x72 a0 a1 cn`

    Read a chunk of data from the configuration.

    a0, a1: Offset within the configuration to read, unsigned 16 bit integer
    cn:     Number of bytes to read. Must be between 1 and 29

    The *Headless TX* provides the requested data in the next packet using the `TX_REQUESTED_DATA` command.

    In case the request lies outside of the configuration data, or count is invalid, the *Headless TX* ignores the request.


* `CFG_WRITE`

    `0x77 a0 a1 dt ...`

    Write data to the configuration.

    a0, a1: Offset within the configuration to write, unsigned 16 bit integer
    dt:    1..29 bytes of data

    The *Headless TX* responds with `TX_WRITE_SUCCESSFUL` in the next packet.

    In case the request lies outside of the configuration data, the *Headless TX* ignores the request.


* `CFG_COPY`

    `0x63 s0 s1 d0 d1 c0 c1`

    Copy a block of data from offset `source` to offset `destination` within the configuration. This command is useful when rearranging, deleting or inserting mixer units. Note that source and destinations may overlap -- the implementation in the *Headless TX* has to ensure correct behavior (hint: you can not use memcpy).

    s0, s1: Offset within the configuration to copy from, unsigned 16 bit integer
    d0, d1: Offset within the configuration to copy to, unsigned 16 bit integer
    c0, c1: Number of bytes to copy, unsigned 16 bit integer

    The *Headless TX* responds with `TX_COPY_SUCCESSFUL` in the next packet.

    In case the request lies outside of the configuration data, the *Headless TX* ignores the request.


* `CFG_DISCONNECT`

    `0x64`

    After receiving this request, the *Headless TX* immediately enters *NOT CONNECTED* state.

    After this command has been taken out of the *Configurator* TX buffer by the auto-acknowledge function, the *Configurator* enters *NOT CONNECTED* state.
    Note that this implies that the *Configurator* has to wait for the next successful packet received from the *Headless TX*, which may take up to 600 ms (timeout) if the connection is poor. During this time the *Configurator* is still assumed to be *CONNECTED* and must follow the hop sequence.


* `TX_INFO`

    `0x49 i0 i1 d0 d1 d2 d3 ...`

    Sent when there is no pending request from the *Configurator*. Contains the current value of selected mixer inputs. See below for more information.

    i0, i1: Identifier for the mixer inputs. Corresponds to the enumeration called `src_label_t` in the firmware
    d0..3: Current value of the input. Signed 32 bit integer.

    In total a single packet can contain info of up to 4 mixer inputs.


* `TX_REQUESTED_DATA`

    `0x52 a0 a1 dt ...`

    Sent in the next packet after receiving a `CFG_READ` request.

    a0, a1: Offset within the configuration as requested, unsigned 16 bit integer
    dt:    1..29 bytes of data starting at offset a0, a1


* `TX_WRITE_SUCCESSFUL`

    `0x57 i0 i1 d0 d1 d2 d3 ...`

    Sent in the next packet after receiving a `CFG_WRITE` request.
    The parameters are the same as described in `TX_INFO`.


* `TX_COPY_SUCCESSFUL`

    `0x43 i0 i1 d0 d1 d2 d3 ...`

    Sent in the next packet after receiving a `CFG_WRITE` request.
    The parameters are the same as described in `TX_INFO`.


## Bandwidth estimation

The read/write payload is up to 29 bytes.

The size of the configuration in the *Headless TX* is 4620 bytes. The model configuration uses 2892 bytes.
(Note: this may have changed after writing this document. Refer to the firmware for the actual number)

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

The UART runs at 115200 BAUD. Because the UART is a serial line without framing, we need to use a packet framing protocol.

We have chosen for the SLIP protocol, defined in
[RFC 1055](https://tools.ietf.org/html/rfc1055).

The commands are exactly the same as for the *nRF protocol*.

The *Configurator* must emulate the nRF protocol with respect to master/slave:

* The *Headless TX* sends a packet in regular intervals (every 5 ms). After receciving a valid packet, the *Configurator* can send a single packet to the *Headless TX*.

* If the *Configurator* does not have any packet pending, it does not transmit any data after receiving a packet from the *Headless TX*


## Websocket protocol

The *Websocket protocol* runs on port **9706**.

The *Websocket protocol* implements the same commands as described above.

One major difference is that the *Websocket protocol* does not provide real-time transfer of data. As such, a *Configurator* talking to a bridge using the *Websocket protocol* can not rely that the next received packet is the answer to the previous sent command, as it is with the *nRF protocol*.

Since the command structure is designed in such a way that every command has a definite response, the *Configurator* has to wait until the appropriate answer arrives.

The down-size of this approach is that this significantly reduces the achievable through-put, as the *Configurator* would have to wait for the answer to the previous request before it can send the next request.

To overcome this issue, a bridge can optionally implement a packet buffer. A bridge implementing such a buffer sends the following message to a *Configurator* immediately upon a Websocket connection is established:

* `WS_MAX_PACKETS_IN_TRANSIT`

    `0x42 nn`

    nn: maximum number of buffered requests

By default, the *Configurator* assumes that the buffer has only a size of 1 packet. Only after receiving the above command it can send multiple packets to the bridge.

The bridge has to re-send the packets in its buffer when they fail, as there are no means to signal failure to the *Configurator*.
