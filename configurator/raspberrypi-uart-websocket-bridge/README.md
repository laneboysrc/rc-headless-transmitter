# Raspberry Pi based configurator


## TLS Web servero
    sudo apt-get install nginx openssl ssl-cert nodejs

    sudo make-ssl-cert generate-default-snakeoil --force-overwrite

    sudo cp ngnix-site-websocket /etc/nginx/sites-zavailable/websocket
    sudo ln -s /etc/nginx/sites-available/websocket /etc/nginx/sites-enabled/websocket
    sudo service nginx restart

- Enable SSL for /etc/nginx/sites-available/default



## Serial port

- Edit /boot/cmdline.txt and remove console=serial0

    sudo systemctl stop serial=getty@ttyAM0.service
    sudo systemctl disable serial=getty@ttyAM0.service

**Note: Raspberry 3 uses `ttyS0` instead of `ttyAM0`**

## Access point configuration:
https://www.maketecheasier.com/set-up-raspberry-pi-as-wireless-access-point/
https://learn.adafruit.com/setting-up-a-raspberry-pi-as-a-wifi-access-point/

    sudo apt-get install hostapd isc-dhcp-server
    sudo apt-get install daemontools daemontools-run

### /etc/default/hostapd
    DAEMON_CONF="/etc/hostapd/hostapd.conf"

### /etc/hostapd/hostapd.conf
    #interface=wlan0
    #logger_syslog=-1
    #logger_syslog_level=2
    #logger_stdout=-1
    #logger_stdout_level=2
    #ctrl_interface_group=0
    #ssid="LANE Boys RC"
    #hw_mode=g
    #channel=11
    #beacon_int=100
    #dtim_period=2
    #max_num_sta=99
    #rts_threshold=2347
    #fragm_threshold=2346
    #macaddr_acl=0
    #auth_algs=3
    #ignore_broadcast_ssid=0
    #wmm_enabled=1
    #wpa=3
    #wpa_passphrase=12345678

    interface=wlan0
    channel=11
    ssid="LANE Boys RC"
    wpa_passphrase=12345678
    wmm_enabled=1
    wpa=1
    wpa_key_mgmt=WPA-PSK
    wpa_pairwise=TKIP
    rsn_pairwise=CCMP
    auth_algs=1
    macaddr_acl=0

### /etc/dhcp/dhcpd.conf
    authoritative;
    ddns-update-style none;
    default-lease-time 600;
    max-lease-time 7200;
    log-facility local7;
    subnet 192.168.4.0 netmask 255.255.255.0 {
        range 192.168.4.1 192.168.4.99;
        option domain-name-servers 192.168.4.1;
        option routers 192.168.4.1;
        interface wlan0;
    }

### Auto-start the configurator using deamontools

    cd /etc/service
    ln -s /home/pi/rc-head-ess/transmitter/configurator/raspberrypi-uart-websocket-bridge .


