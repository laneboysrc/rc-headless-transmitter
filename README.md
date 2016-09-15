# STM32F103 and NRF24L01+ based headless transmitter

This project implements a 2.4 GHz RC transmitter using the NRF24L01+ wireless module and the STM32F103C8T6 micro-controller. It runs of a 1S Li-Ion battery.

The transmitter is currently compatible with HobbyKing HKR3000 and HKR3100 receivers, as well as the [LANE Boys RC nrf24le01-rc](https://github.com/laneboysrc/nrf24l01-rc) DIY receivers.

The term *headless* comes from the IT industry, where a headless system is one that does not provide a user interface itself but is configured remotely. Within this project, *headless* means that the transmitter does not have a display or buttons for configuration, but rather relies on remote configuration through a web-browser on a Smartphone, Tablet or computer.

The motivation for this project was to upgrade old AM/FM RC transmitter hardware, and to turn a cheap RC simulator into a fully operational transmitter that supports multiple models.

By keeping the user interface for configuration out of the transmitter, we don't need to perform complicated mechanical modifications to add a display and buttons. Instead we replace the old electronics with a modern 32 bit ARM micro-controller and a reliable 2.4 GHz transceiver.


## How it works

The *headless transmitter* works like any low-end 2.4 GHz RC system on the market: power it on, and use it with the model you have it setup for.

However, unlike low-end transmitters, the *headless transmitter* supports advanced features like expo, mixing, failsafe and more.

In order to configure those advanced features, you need to use a web-browser on your Smartphone, Tablet or computer.

To be able to connect your Smartphone to the transmitter, we need to translate between different radio protocols: The transmitter uses its RC-based RF protocol, while the Smartphone supports Wi-Fi. This translation takes place in a small, external box called *configurator*.

When you want to configure your *headless transmitter*, you turn on the *configurator*, connect your phone to the Wi-Fi accesspoint the *configurator* provides, and lanch the configuration web-app to perform the configuration. When you are done, the changes are automatically saved in the transmitter and persist over power cycles.

The Smartphone also has a large amount of storage capacity. This allows us to store and upload configurations for multiple models. When we want to change to another model, we simply download its configuration into the *headless transmitter*. This only takes a few seconds.


## Power and cost
The power consumption of the transmitter is low: A single 800 mAh Li-Ion battery keeps the transmitter running for approximately 15 hours.

Cost is low too: When sourcing the modules from China, a transmitter can be modified for less than USD 10. The *configurator* hardware cost is less than USD 15. You only need one *configurator*, regardless of how many *headless transmitters* you have.


## WORK IN PROGRESS

This project is not finished yet. Refer to the [TODO](TODO.md) list for items that we plan to implement in the future.


## Skills required

This project requires **intermediate** skills in electronics and micro-controller firmware. While the electronics are based on off-the-shelf modules, everything needs to be wired correctly on a prototyping board and installed in the transmitter.

On the software side, you need to be familiar with Git, the ARM GCC toolchain, GNU Make, OpenOCD and the ST-Link programmer. This project uses three different type of microcontrollers: STM32F103, Nordic nRF51822 and ESP8266.

The web interface and associated dev tools are built using NodeJS, Webpack and the Material Design Lite framework.

Don't be discouraged though: One can learn *anything* with the help of the Internet today. It is only up to *you* to invest the time. **A day where you learn something new is a good day.**


## Credits

This project would not have been possible without the LANE Boys beinging able to stand on the shoulders of giants:


### Deviation

http://deviationtx.com/

A replacement firmware designed primarily for the Walkera Devo series RC Transmitters. Great project to study RC transmitter architecture.


### ER9X

https://github.com/MikeBland/mbtx

er9x/ersky9x radio firmware. This is how it all started. Thanks!


### libopencm3

http://libopencm3.org/

Open Source ARM Cortex M microcontroller library. Light-weight, easy to use, not too much abstraction. Just works!


### Material Design Lite

MDL allowed us to get a reasonable modern UI with little skills required. No complicated tool chain, just JS and CSS required.


### Google fonts

The icon font was especially helpful to get consistent looking icons. Super!


### JSHint

Great to see mistakes before you find them in the console log of your browser.


### Gnu GCC

Fantastic compiler with so many backends. Just works.


### MDN

The MDN was extremely helpful to brush up on the latest web technologies. The articles are concise and link to references.


### Can I Use.com

Extremely useful website to make decisions which of the hot new technologies make sense to use.


### StackOverflow

Have a programming-related problem? This excellent community sure has it solved already, providing great solutions.

### DuckDuckGo

Just like Google was in the beginning.


### STM

Excellent value for money micro-controllers. Their ST-Link debugger comes on inexpensive Nucleo boards and works great even for programming the Nordic MCU.


### Nordic

Great 2.4 GHz Radio, decent software stack, fair price. Thanks for opening up your SDK and documentation in the recent years!


### Arduino / ESP8266

### node-js and npm

Normally we use Python for scripts and self-made development tools. But since NodeJS was needed for using Webpack anyway, we used it instead. Worked great thanks to the library support at npm.


### Webpack and http://survivejs.com/webpack/developing-with-webpack

Web front-end development has become surprisingly complicated tool-wise in the last yeards. Thanks due to the guide at survivejs we were able get it going without having to spend too much time on learning tools.


### https://github.com/mtrpcic/pathjs/blob/master/path.js

Old-skool router so that we could use a simple web server on the ESP8266. Surely considered outdated, but just right for our needs.


### http://realfavicongenerator.net/






