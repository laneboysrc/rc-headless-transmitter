Beside the Orange Pi Zero, you need a nRF51822 module.
This document describes the module named CORE51822B, which you can find on AliExpress.

NOTE: other nRF51822 modules have different pin-outs, use the pin names instead as reference!


The CORE51822B modules gets connected to the Orange Pi Zero 26-pin header as follows:

    Orange Pi Zero                    CORE51822B
    (26 pin connector)

    1  3V3                            12 VCC
    3  GPIO12 (SWCLK)                 32 SWCLK
    5  GPIO11 (SWDIO)                 31 SWDIO
    6  GND                            11 GND
    8  UART1_TX                       25 P11 (`UART0_CONFIG_PSEL_RXD`)
    10 UART1_RX                       23 P09 (`UART0_CONFIG_PSEL_TXD`)


# Optional shut-down button

Unless you are using a "frozen file system" on the Orange Pi Zero, one should always shut the operating system down before removing power to avoid accidental corruption of the file system.

For this purpose the configurator can monitor a push-button on GPIO6 of the Orange Pi Zero. When the button is held for more than 2 seconds the Orange Pi Zero shuts down.

    Orange Pi Zero
    (26 pin connector)

    7  GPIO6                          power-off button

The power-off button switch to GND (Orange Pi Zero pin 6) and must have a 1..100k Ohm pull-up resistor to 3V3 (Orange Pi Zero pin 1).


# Optional OpenOCD SWD programming pins for the STM32F103C8T6 in the transmitter

If you don't have an ST-Link or similar programmer for the STM32F103 used in the transmitter, you can program it with the Orange Pi Zero. The following pins need to be connected.

    14 GND    -> STM32F1 GND
    16 GPIO19 -> STM32F1 SWCLK
    18 GPIO18 -> STM32F1 SWDIO

The [openocd/](openocd/) folder contains a shell script and configuration file to use those pins.