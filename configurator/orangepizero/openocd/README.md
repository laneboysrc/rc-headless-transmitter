If you don't have a SWD programmer to flash the nRF51822 or the STM32F103, you can use the Orange Pi Zero in conjuction with the Open OCD.


    git clone https://github.com/ntfreak/openocd
    sudo apt-get install libtool texinfo pkg-config

    cd openocd
    ./bootstrap
    ./configure --enable-sysfsgpio
    make
    sudo make install

This folder contains two configuration scripts and shell scripts to flash the nRF51822 or STM32F103C8T6. They use different GPIO ports on the Orange Pi Zero, which means the nRF51822 can stay connected when flashing the STM32F103.

The nRF51822 uses pins

    3 GPIO12        SWCLK
    5 GPIO11        SWDIO

the STM32F103 uses pins

    16 GPIO19       SWCLK
    18 GPIO18       SWDIO
