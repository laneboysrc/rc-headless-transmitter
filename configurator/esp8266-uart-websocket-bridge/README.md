This directory contains the firmware that goes into the *configurator* of the [*headless transmitter*](https://github.com/laneboysrc/rc-headless-transmitter).

It runs on the Espressif ESP8266 Wi-Fi micro-controller.

We found that using the [Arduino development environment](http://arduino.cc/) was the easiest to get the ESP8266 firmware compiled. You need to use the [ESP8266 support package](https://github.com/esp8266/Arduino) via board manager.

For better development experience, we are not using the Arduino IDE but rather traditional GNU Make files, powered by [makeEspArduino](https://github.com/plerup/makeEspArduino). Adjust the variable `ARDUINO_DIR` in the make file to point to your Arduino installation.

Alternatively, you can compile and upload the firmware using the Arduino IDE.

Run

    make

to build the firmware. When done, run

    make upload

to flash the firmware into the ESP8266. You need to connect a the ESP8266 via a USB-to-serial converter. Adjust `UPLOAD_PORT` in the makefile to suit the device name of your converter.

To load the web-app, first run `npm run production` in the [web-app directory](../web-app/), the run `make spiffs-webapp` in this directory.
Note that this only works on operating systems that support symbolic linking (Linux, Mac), on Windows may you have to copy the contents of the `../web-app/_build/` folder manually to the `data.web-app/` folder.

