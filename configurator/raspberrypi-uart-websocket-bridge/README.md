# Raspberry Pi based configurator

    sudo apt-get install nginx openssl ssl-cert nodejs


    sudo cp ngnix-site-websocket /etc/nginx/sites-available/websocket
    sudo ln -s /etc/nginx/sites-available/websocket /etc/nginx/sites-enabled/websocket
    sudo service nginx restart

- Enable SSL for /etc/nginx/sites-available/default

- Edit /boot/cmdline.txt and remove console=serial0

    sudo systemctl stop serial=getty@ttyAM0.service
    sudo systemctl disable serial=getty@ttyAM0.service

**Note: Raspberry 3 uses `ttyS0` instead of `ttyAM0`**

## Access point configuration:
https://www.maketecheasier.com/set-up-raspberry-pi-as-wireless-access-point/
https://learn.adafruit.com/setting-up-a-raspberry-pi-as-a-wifi-access-point/

    sudo apt-get install hostapd isc-dhcp-server