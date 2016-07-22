# *Configurator* web-app implemention

This web-app implements a *configurator* that can access a *Headless TX* via a
bridge that implements the Websocket protocol.

Please refer to the [configurator](../../doc/configurator.md) documentation for
more information.


## Build instructions

To compile all source files into a single HTML file for distribution the following tools are needed:

- Node.js - [http://nodejs.org/](http://nodejs.org/)

*Important:* A recent (LTS) Node.js version is required. Refer to
[https://github.com/nodesource/distributions](https://github.com/nodesource/distributions)
for details

Run `npm install` to fetch the required modules.
Note: there are also two modules taken from `../common-modules/`!

You can then run `npm start` to start the continous build process and
development web server. You can then access the build on `localhost:8080`.

Use `npm production` to build the single-page web-app for deployment.