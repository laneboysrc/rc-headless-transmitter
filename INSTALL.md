# How to get up and running

This project requires **intermediate** skills in electronics and micro-controller firmware. While the electronics are based on off-the-shelf modules, everything needs to be wired correctly on a prototyping board and installed in the transmitter.

Don't be discouraged: One can learn *anything* with the help of the Internet today. It is only up to *you* to invest the time. **A day where you learn something new is a good day.**

On the software side, you need to be familiar with [Git](https://git-scm.com/), the [ARM GCC toolchain](https://launchpad.net/gcc-arm-embedded), [GNU Make](https://www.gnu.org/software/make/), [OpenOCD](http://openocd.org/) and the [ST-Link programmer](http://www.st.com/content/st_com/en/products/development-tools/hardware-development-tools/development-tool-hardware-for-mcus/debug-hardware-for-mcus/debug-hardware-for-stm32-mcus/st-link-v2.html).

If you are on Windows it may be easier to compile the software with [Git Bash](https://git-for-windows.github.io/) shell.

This project uses three different type of microcontrollers: [STM32F103](http://www.st.com/content/st_com/en/products/microcontrollers/stm32-32-bit-arm-cortex-mcus/stm32f1-series/stm32f103.html?querycriteria=productId=LN1565), [Nordic nRF51822](https://www.nordicsemi.com/eng/Products/Bluetooth-low-energy/nRF51822) and [Espressif ESP8266](http://www.espressif.com/en/products/hardware/esp8266ex/overview).

The web interface and associated dev tools are built in JavaScript using [Node.js](https://nodejs.org/), [Webpack](http://webpack.github.io/) and the [Material Design Lite framework](https://getmdl.io/).

**IMPORTANT**
This project makes use of Git submodules. Please clone it by running:

    git clone --recursive https://github.com/laneboysrc/rc-headless-transmitter.git

Alternatively, run the following commands in the project root:

    git submodule init
    git submodule update

