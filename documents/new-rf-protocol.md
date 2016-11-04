## RF protocol for more than 3 channels

The HK310 protocol can only support up to 3 channels. Since we now have the
possibility to build our own transmitter and receiver, we can change the
protocol to support more channels. We still want to use the nRF based RF
solution, since it is robust, cheap and we know it well.


## HK300 / HK310 / X3S RF protocol

* 20 hop channels
* 5 byte address
* 3 servo channels
* Stick data sent every 5 ms
* Hop frequency changed every 5 ms
* Failsafe sent


## Requirements of the new protocol

* Based on HK300 protocol
* At least 8 channels
* signed 12 bit, corresponding to 476..1500..2523 us (500 ns resolution)
    - 8 channels, signed 12 bits (0 corresponds to 1500 us servo output == center)
        - So a packet would be 12 Bytes of data, plus one frame identifier
    - More channels can be added by introducing multiple frames. The higher channels could be sent at a
    slower update rate


