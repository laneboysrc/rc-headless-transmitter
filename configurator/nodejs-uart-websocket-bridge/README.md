# UART to Websocket bridge protocol

This tool can be connected to a *headless transmitter* via the UART. It exposes the *headless transmitter* to a *configurator* using the WebSocket protocol.

This program is used on the Orange Pi Zero to bridge the nRF51822, which in turn bridges the UART to the *headless transmitter*, to the web-app.

Please refer to the [configurator](../../docs/configurator.md) documentation for more information.


## Build instructions

Install NodeJS [http://nodejs.org/](http://nodejs.org/)

Run `npm install` to fetch the required modules.

You can then run `npm start /dev/ttyS1`.