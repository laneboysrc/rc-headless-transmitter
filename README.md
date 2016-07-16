# STM32F103 and NRF24L01+ based headless transmitter

This project implements a 2.4 GHz RC transmitter using the NRF24L01+ wireless module and the STM32F103C8T6 module. It runs of a 1S Li-Ion battery.

**WORK IN PROGRESS**

**Only partial functionality has been implemented so far. Currently changing the transmitter configuration requires recompiling and flashing the firmware as external programming functionality has not been implemented yet**

The transmitter is designed to be used in old RC transmitter hardware, or to turn a cheap RC simulator transmitter into a fully operational RC transmitter. As such it is designed for headless operation. Setup is carried out via a custom-designed wireless programming box, a PC using a USB-to-serial adapter, or a Smartphone via Bluetooth.

## Credits

This project would not have been possible without the author being able to stand on the shoulders of giants:


### Deviation

http://deviationtx.com/

A replacement firmware designed primarily for the Walkera Devo series RC Transmitters.


### ER9X

https://github.com/MikeBland/mbtx

er9x/ersky9x radio firmware


### libopencm3

http://libopencm3.org/

Open Source ARM cortex m microcontroller library.


### Material Design Lite
### Jekyll
### JSHint
### Gnu GCC
### https://github.com/Pithikos/python-websocket-server
### MDN
### StackOverflow
### DuckDuckGo
### Nordic
### STM
<!-- https://github.com/mtrpcic/pathjs/blob/master/path.js -->

