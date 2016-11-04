# UART to Websocket bridge protocol

This tool can be connected to a *headless transmitter* via the UART. It exposes
the *headless transmitter* to a *configurator* using the Websocket protocol.

Please refer to the [configurator](../../documents/configurator.md) documentation for
more information.


## Build instructions

To compile all source files into a single HTML file for distribution the following tools are needed:

- Node.js - [http://nodejs.org/](http://nodejs.org/)

After installing these tools, run `npm install` to fetch the required modules.

You can then run `npm start /dev/ttyUSB0`.