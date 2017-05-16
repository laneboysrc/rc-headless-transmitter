This project uses different type of microcontrollers:
* [STM32F103](http://www.st.com/content/st_com/en/products/microcontrollers/stm32-32-bit-arm-cortex-mcus/stm32f1-series/stm32f103.html?querycriteria=productId=LN1565)
* [Nordic nRF51822](https://www.nordicsemi.com/eng/Products/Bluetooth-low-energy/nRF51822)

On the software side, you need to be familiar with [Git](https://git-scm.com/), the [ARM GCC toolchain](https://launchpad.net/gcc-arm-embedded), [GNU Make](https://www.gnu.org/software/make/), [OpenOCD](http://openocd.org/) and the [ST-Link programmer](http://www.st.com/content/st_com/en/products/development-tools/hardware-development-tools/development-tool-hardware-for-mcus/debug-hardware-for-mcus/debug-hardware-for-stm32-mcus/st-link-v2.html).

If you are on Windows it may be easier to compile the software with [Git Bash](https://git-for-windows.github.io/) shell.

The web interface and associated dev tools are built in JavaScript using [Node.js](https://nodejs.org/), [Webpack](http://webpack.github.io/) and the [Material Design Lite framework](https://getmdl.io/).

**IMPORTANT**
This project makes use of Git submodules. Please clone it by running:

    git clone --recursive https://github.com/laneboysrc/rc-headless-transmitter.git

Alternatively, run the following commands in the project root:

    git submodule init
    git submodule update


---

# GH-PAGES

We can host the web-app via Github pages conveniently. Since it is served via HTTPS we can use ServiceWorker and other goodies.

## Setup

In the root of the project, execute

    git clone https://github.com/laneboysrc/rc-headless-transmitter.git --branch gh-pages --single-branch gh-pages

This creates a folder named `gh-pages` with the web-app source code, cloned from the current state of the rc-headless-transmitter's `gh-pages` branch. Note that the `gh-pages` is in `.gitignore` of the `master` branch, so it does not appear in the `master` branch.

When building the web-app (run `npm run build` in `configurator/web-app`), the files are automatically placed into the `gh-pages` folder.

To update the web-app on Github, go into the `gh-pages` folder, commit the changes, and run `git push`.


Source:
[http://stackoverflow.com/questions/1778088/how-to-clone-a-single-branch-in-git](http://stackoverflow.com/questions/1778088/how-to-clone-a-single-branch-in-git)

