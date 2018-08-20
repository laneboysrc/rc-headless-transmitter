This directory contains the firmware that implements a WebUSB compatible dongle. The dongle can be used by the web-app when using a browser with WebUSB support (currently Chrome/Chromium only).

It runs on the STM32F103C8T6 micro-controller that controls the nrf51-nrf-uart-bridge.

The software makes used of [libopencm3](http://libopencm3.org/).

The firmware is built using a [GNU Make](https://www.gnu.org/software/make/) makefile. The compiler is [ARM GCC toolchain](https://launchpad.net/gcc-arm-embedded), version 5.2.1. [OpenOCD](http://openocd.org/) is used to program the firmware into the micro-controller.

In the [Makefile](Makefile), adjust the variable `GNU_INSTALL_ROOT` and `OPENOCD` to match your installation.

Run

    make

to build the firmware. When done, run

    make program

to flash the firmware into the micro-controller.

