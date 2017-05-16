This directory contains the firmware that goes into the *configurator* of the [*headless transmitter*](https://github.com/laneboysrc/rc-headless-transmitter).

It runs on the Nordic nRF51822 RF micro-controller.

You need to download the [nRF5 SDK version 11.0](https://www.nordicsemi.com/eng/Products/Bluetooth-low-energy/nRF5-SDK) from Nordic. The SDK must reside in the `firmware/nrf51_sdk/` folder.
*Note:* It is important that you use the exact version mentioned above as newer versions have ab incompatible API.

The firmware is built using a [GNU Make](https://www.gnu.org/software/make/) makefile. The compiler is [ARM GCC toolchain](https://launchpad.net/gcc-arm-embedded), version 5.2.1. [OpenOCD](http://openocd.org/) is used to program the firmware into the micro-controller. You can use the ST-Link v2 to program the nRF51822.

In the [Makefile](Makefile), adjust the variable `GNU_INSTALL_ROOT` and `OPENOCD` and `NRF_SDK_PATH` to match your installation.

Run

    make

to build the firmware. When done, run

    make program

to flash the firmware into the micro-controller.

