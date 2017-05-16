# You can do it!

Don't be discouraged: One can learn *anything* with the help of the Internet today. It is only up to *you* to invest the time.

**A day where you learn something new is a good day.**

---

# How to get up and running

This project requires **basic** skills in electronics, soldering and Linux (Raspberry Pi level, e.g. using ssh, networking, running commands, editing files). While the electronics are based on off-the-shelf modules, everything needs to be wired correctly on a prototyping board and installed in the transmitter.

The *headless transmitter* comprises of an inexpensive ["Blue pill" board](https://www.aliexpress.com/item/1pcs-STM32F103C8T6-ARM-STM32-Minimum-System-Development-Board-Module-For-arduino/32478120209.html) with an STM32F103 microcontroller. It drives a nRF24L01+ module with integrated power amplifier. A single cell Li-Ion battery, protected and charged by another cheap module, is used as power source. There is no need to make a PCB, everything fits easily on a prototyping board.
Please refer to [transmitter/electronics/BOM.txt](transmitter/electronics/BOM.txt) for a full list of components required.

The *configurator* is built with an [Orange Pi Zero](https://www.aliexpress.com/store/product/New-Orange-Pi-Zero-H2-Quad-Core-Open-source-development-board-beyond-Raspberry-Pi/1553371_32760774493.html) and a CORE51822B module. The 256 MByte version of the Orange Pi Zero is enough for our simple application. It is powered by a suitable power bank or other 5V supply.

Follow the instructions in [configurator/organgepizero/INSTALL.md](configurator/organgepizero/INSTALL.md) to install and configure the Armbian Linux distribution and required software on the Orange Pi Zero.

The firmware for the micro-controllers comes pre-compiled in the [bin/](bin/) folder of the project, no need to install development tools and compile it yourself. You can use the Orange Pi Zero to flash it. Refer to [configurator/orangepizero/openocd/README.md](configurator/orangepizero/openocd/README.md) for instructions.


# First time use

Power up the *headless transmitter*. You should hear a short beep and the LED should be on. The transmitter is now operational, with a simple default configuration.

Turn on the *configurator* and wait until it has booted (green LED turns solid).

On your PC or Smartphone, open [https://laneboysrc.github.io/rc-headless-transmitter](https://laneboysrc.github.io/rc-headless-transmitter) in the web browser.

Now connect Wi-Fi to the SSID of the *configurator*, which is "LANE Boys RC". Use the passphrase you have configured when building the *configurator* (default is "12345678").

After pressing the `Connect` button on the web-app, the list of transmitters should show `Unconfigured Tx`. Click on the `Edit` icon next to the name. The transmitter should beep and after a few seconds the web-app will show the settings of the transmitter. You can now proceed with configuring it.

After connecting to a transmitter for the first time, you should give it a unique name and assign a new RF protocol address and hop sequence.

