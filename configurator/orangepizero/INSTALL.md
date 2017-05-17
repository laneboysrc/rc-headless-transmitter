# Install Armbian

Download Armbian for the Orange Pi Zero from [https://www.armbian.com/orange-pi-zero/](https://www.armbian.com/orange-pi-zero/). Use the stable release `Armbian_5.25_Orangepizero_Ubuntu_xenial_default_3.4.113`. [Etcher](https://etcher.io) is a great too to flash the image onto a Micro-SD card.


# Basic configuration

Connect the Orange Pi Zero via an Ethernet cable (RJ45) to your router and power it up. After about 45 seconds the OS has booted (green LED becomes solid).

Connect to the Orange Pi Zero via ssh:

    ssh root@orangepizero

If your router does not resolve local hostnames then check its IP client table to find the IP address of the Orange Pi Zero and use that (e.g. `ssh root@192.168.1.103`).

The default password is `1234`. Follow the on-screen instructions to change the password and create a new user. After the installation returns to the command prompt, enter `reboot` to restart.

Login with your newly created username and password:


    ssh your-username@orangepizero
(or)

    ssh your-username@192.168.x.x

Set time zone with

    sudo dpkg-reconfigure tzdata

To allow running commands as superuser without password, run

    sudo visudo -f /etc/sudoers.d/your-username
and enter

    your-username ALL=(ALL) NOPASSWD:ALL

Update the operating system and reboot:

    sudo apt-get update
    sudo apt-get -y dist-upgrade
    sudo reboot


# Download the rc-headless-transmitter files

    git clone https://github.com/laneboysrc/rc-headless-transmitter.git

Note that the directory `~/rc-headless-transmitter/configurator/orangepizero/etc/` contains samples of most of the configuration files that need to be created. Feel free to copy them instead of editing them by hand.

For example, if the instructions say "`sudo nano /etc/apt/apt.conf.d/90no-auto-upgrades` and add `<content>`", then you can use the skeleton file instead:

    sudo cp ~/rc-headless-transmitter/configurator/orangepizero/etc/apt/apt.conf.d/90no-auto-upgrades /etc/apt/apt.conf.d/90no-auto-upgrades


# Disable automatic updates

The configurator is running without Internet connection most of the time. We can save a bit of power and startup time if we disable automatic updates, which will fail anyway due to lack of Internet access.

Create file /etc/apt/apt.conf.d/90no-auto-upgrades

    sudo nano /etc/apt/apt.conf.d/90no-auto-upgrades
and add

    APT::Periodic::Update-Package-Lists "0";
    APT::Periodic::Unattended-Upgrade "0";


# Enable GPIO access without root
Create file /etc/udev/rules.d/99-gpio.rules

    sudo nano /etc/udev/rules.d/99-gpio.rules
and add

    SUBSYSTEM=="gpio", ACTION=="add", PROGRAM="/bin/sh -c 'chown -R root:gpio /sys/class/gpio && chmod -R g+w /sys/class/gpio'"
    SUBSYSTEM=="gpio", ACTION=="add", PROGRAM="/bin/sh -c 'chown -R root:gpio /sys/devices/virtual/gpio && chmod -R g+w /sys/devices/virtual/gpio'"
    SUBSYSTEM=="gpio", ACTION=="add", PROGRAM="/bin/sh -c 'chown -R root:gpio /sys/devices/platform/sunxi-pinctrl/gpio && chmod -R g+w /sys/devices/platform/sunxi-pinctrl/gpio'"

Then run

    sudo groupadd --system gpio
    sudo usermod -a -G gpio your-username


# Network configuration
Create file: /etc/network/interfaces.hostapd-configurator

    sudo nano /etc/network/interfaces.hostapd-configurator
and add

    allow-hotplug wlan0
    iface wlan0 inet static
        address 192.168.4.1
        netmask 255.255.255.0

This configures the wireless access point we are setting up to use a static IP address of `192.168.4.1`. **Do not change this address, the configurator web-app uses this exact address to find your bridge!**

Create a symlink to the new file:

    cd /etc/network
    sudo rm interfaces
    sudo ln -s interfaces.hostapd-configurator interfaces

Change the hostname:

    sudo sh -c 'echo "configurator" > /etc/hostname'

Edit /etc/hosts:

    sudo nano /etc/hosts

  * Remove all `orangepizero` references
  * Add line `192.168.4.1 configurator`

**IMPORTANT: after the next reboot you have to use the new hostname `configurator` to login, rather than 'orangepizero'. E.g. `ssh your-username@configurator`**


# hostapd configuration
`hostapd` turns the Orange Pi Zero into wireless access point.

Create file /etc/hostapd.configurator.conf

    sudo nano /etc/hostapd.configurator.conf
and add

    wpa_passphrase=12345678
    ssid=LANE Boys RC
    channel=11
    interface=wlan0
    driver=nl80211
    utf8_ssid=1
    wpa=2
    wpa_key_mgmt=WPA-PSK
    wpa_pairwise=CCMP
    auth_algs=1
    hw_mode=g
    ieee80211n=1
    max_num_sta=5
    wmm_enabled=1
    macaddr_acl=0
Consider changing the Wi-Fi password in line 1!

Edit the existing file /etc/default/hostapd

    sudo nano /etc/default/hostapd
and add

    DAEMON_CONF="/etc/hostapd.configurator.conf"


# dnsmasq
`dnsmasq` provides a DHCP server, i.e. it issues IP addresses to the clients that connect to the Orange Pi Zero Wi-Fi.

Install the software:

    sudo apt-get install dnsmasq

Edit file /etc/dnsmasq.conf:

    sudo nano /etc/dnsmasq.conf:
and remove the comment (`#` character) from the line

    #conf-dir=/etc/dnsmasq.d,.bak

Create /etc/dnsmasq.d/configurator

    sudo nano /etc/dnsmasq.d/configurator
and add

    interface=wlan0      # Use interface wlan0
    listen-address=192.168.4.1 # Explicitly specify the address to listen on
    bind-interfaces      # Bind to the interface to make sure we aren't sending things elsewhere
    server=8.8.8.8       # Forward DNS requests to Google DNS
    domain-needed        # Don't forward short names
    bogus-priv           # Never forward addresses in the non-routed address spaces.
    dhcp-range=192.168.4.50,192.168.4.150,12h # Assign IP addresses between 192.168.4.50 and 192.168.4.150 with a 12 hour lease time

# IP forwarding
IP forwarding enables the Orange Pi Zero to act as a wireless router.

Edit /etc/sysctl.conf

    sudo nano /etc/sysctl.conf
and remove the comment (`#` character) from lines

    #net.ipv4.ip_forward=1
    #net.ipv6.conf.all.forwarding=1

Enable NAT using iptables:

    sudo apt-get install iptables
    sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
    sudo iptables -A FORWARD -i wlan0 -j ACCEPT
    sudo apt-get install iptables-persistent

*Tip: if you modify the IP table rules in the future, use `sudo dpkg-reconfigure iptables-persistent` to save the changes.*


# Install nginx
The NGINX web server is used to provide secure WebSocket services to the configurator.

    sudo apt-get install -y nginx-light openssl ssl-cert
    sudo make-ssl-cert generate-default-snakeoil --force-overwrite
    sudo log2ram write
log2ram is important as otherwise the nginx directory in `/var/log/` is not retained and nginx fails on the next reboot!

Create file /etc/nginx/sites-available/configurator

    sudo nano /etc/nginx/sites-available/configurator
and add

    map $http_upgrade $connection_upgrade {
        default upgrade;
        '' close;
    }

    server {
        listen 80 default_server;
        server_name _;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl;
        server_name configurator;
        ssl on;
        include snippets/snakeoil.conf;

        root /var/www/html;
        index index.configurator.html index.html index.htm index.nginx-debian.html;
        location / {
            try_files $uri $uri/ =404;
        }

        location /ws {
            proxy_pass http://localhost:9706;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
        }
    }

    server {
        listen 9707 ssl;
        ssl on;
        include snippets/snakeoil.conf;

        location / {
            proxy_pass http://localhost:9706;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
        }
    }

Use the new configuration by running

    sudo rm /etc/nginx/sites-enabled/default
    sudo ln -s /etc/nginx/sites-available/configurator /etc/nginx/sites-enabled/configurator

Copy the file stored in `configuator/orangepizero/var/www/html/index.configurator.html` fo the project to `/var/www/html/index.configurator.html`

    sudo cp ~/rc-headless-transmitter/configuator/orangepizero/var/www/html/index.configurator.html /var/www/html/index.configurator.html
This file gets shown when you browse to `https://192.168.4.1/` and allows users to allow a security exception of the self-signed certificate used in the configurator.


# Install node-js
The configurator bridge software is written in JavaScript and requires NodeJS as runtime.

To install, run
    curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
    sudo apt-get install nodejs


# Run the UART-websocket bridge
We are using `pm2` to start our application during the boot process.

Install and run

    sudo npm install -g pm2
    pm2 startup
Execute the command as instructed by `pm2 startup`.

Install the dependencies for the bridge and start it:

    cd ~/rc-headless-transmitter/configurator/nodejs-uart-websocket-bridge/
    npm install
    pm2 start --name="bridge" npm -- start /dev/ttyS1
    pm2 save


# Final setup
Reboot the Orange Pi Zero:

    sudo reboot

Verify that the bridge software is running:

    pm2 ls

Connect the Wi-Fi of your computer or Smartphone to the SSID `LANE Boys RC`. Use the password you configured in `/etc/hostapd.configurator.conf` earlier.

Open Chrome or Firefox and browse to [https://192.168.4.1](https://192.168.4.1). The browser should show a security error message since we are using a self-signed cerficiate. Add a permanent exception to allow this certificate. You should now see a web page with a success message, showing the LANE Boys RC logo.

Change the Wi-Fi connection back to your normal Internet connection and browse to [https://laneboysrc.github.io/rc-headless-transmitter](https://laneboysrc.github.io/rc-headless-transmitter). Once loaded, you can use the "Install to home screen" feature in your browsers menu to create a desktop icon on your Smartphone for easy future access.

With the web-app still open in the web browser, connect Wi-Fi to the *configurator* bridge (SSID `LANE Boys RC`), then press the `Connect` button. You should briefly see `Connecting to the bridge ...` followed by `Scanning for transmitters ...`. Turn on your *headless transmitter* and it should appear as `Unconfigured Tx` in the list.

Congratulations, you've made it! **Have fun with RC!**


---


## Optional software and configuration

Above instructions are sufficient for a fully functional configurator bridge. Here are a few more optional items you can do to improve the installation.


### Power button
In order to prevent corruption of the micro-SD card when cutting the power, it is advise to propery shut down the Orange Pi Zero before removing the supply.

To be able to do so, the project comes with a small script that monitors a simple tact switch on GPIO6 of the Orange Pi Zero. Holding the button for more than 2 seconds invokes a clean shutdown of the Orange Pi Zero.

Please refer to [HARDWARE.md](HARDWARE.md) how to connect the push-button.

    cd ~/rc-headless-transmitter/configurator/orangepizero/shutdown-on-button-press/
    npm install
    pm2 start --name="power-button" npm start
    pm2 save


### Freeze the fs
To protect the SD card from accidental writes it is possible to mount the file system read-only. All temporary files will be written to a RAM disk and discarded when the Orange Pi Zero is powered off.

    sudo apt-get install overlayroot
    sudo sh -c "echo 'overlayroot="tmpfs"' >> /etc/overlayroot.local.conf"
    sudo reboot

In order to make changes to the file system again, for example to update the Armbian operating system or install a new version of the RC Headless Transmitter software, run:

    sudo overlayroot-chroot nano /etc/overlayroot.local.conf

and comment out the `overlayroot="tmpfs"` line; then reboot.
After performing your changes you can remove the comment from `/etc/overlayroot.local.conf` and reboot to re-instate the read-only file system.


### openocd to flash the nRF51822 and STM32F103C8T6
If you don't have a SWD programmer to flash the nRF51822 or the STM32F103, you can use the Orange Pi Zero in conjuction with the `openocd`.

Refer to [openocd/README.md](openocd/README.md) on how to install, configure and use `openocd`.


### Conserve power
For our usage we don't need the graphics card and USB capabilities of the Orange Pi Zero, so we can disable them to save power:

    sudo h3consumption -g off -u off


### Configure the red LED to show disk access

Create file /etc/init.d/red-led

    sudo nano /etc/init.d/red-led

and add

    #!/bin/sh
    if [ true != "$INIT_D_SCRIPT_SOURCED" ] ; then
        set "$0" "$@"; INIT_D_SCRIPT_SOURCED=true . /lib/init/init-d-script
    fi
    ### BEGIN INIT INFO
    # Provides:          red-led
    # Required-Start:    $udev
    # Required-Stop:
    # Default-Start:     2 3 4 5
    # Default-Stop:
    # Short-Description: Configure the red LED to show SD card access
    ### END INIT INFO

    DESC="Red LED shows disk access"
    DAEMON=/bin/sh

    do_start() {
        /bin/sh -c 'echo mmc0 > /sys/class/leds/red_led/trigger'
    }

Create the required symlinks by running

    sudo chmod +x /etc/init.d/red-led
    sudo update-rc.d red-led defaults
