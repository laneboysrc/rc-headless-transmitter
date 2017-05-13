

Pins:

Orange Pi Zero                              nRF51 CORE51822B
(all pins refer to the 26 pin connector)

1  3V3                                      12 VCC
3  GPIO12 (SWCLK)                           32 SWCLK
5  GPIO11 (SWDIO)                           31 SWDIO
6  GND                                      11 GND
7  GPIO6 -> power-off button
8  UART1_TX                                 25 P11 (`UART0_CONFIG_PSEL_RXD`)
10 UART1_RX                                 23 P09 (`UART0_CONFIG_PSEL_TXD`)

The power-off button must have a 1..100k Ohm resistor to 3V3



Optional OpenOCD SWD programming pins for the SMT32F103C8T6 in the transmitter:

14 GND    -> STM32F1 GND
16 GPIO19 -> STM32F1 SWCLK
18 GPIO18 -> STM32F1 SWDIO

