'use strict';

let webusb_device;
let statusDisplay;

const VENDOR_ID = 0x6666;
const TEST_INTERFACE = 0;
const TEST_EP_OUT = 1;
const TEST_EP_IN = 2;
const EP_SIZE = 64;

document.addEventListener('DOMContentLoaded', async () => {
    const connectButton = document.querySelector("#connect");
    const sendButton = document.querySelector("#send");
    statusDisplay = document.querySelector('#status');

    connectButton.addEventListener('click', connectButtonHandler);
    sendButton.addEventListener('click', webusb_send_data);

    navigator.usb.addEventListener('connect', webusb_device_connected);
    navigator.usb.addEventListener('disconnect', webusb_device_disconnected);

    let devices = await navigator.usb.getDevices();
    if (devices.length > 0) {
        let device = devices[0];
        console.log("Automatically connecting to device with serial number " + device.serialNumber);
        webusb_connect(device);
    }
});

async function connectButtonHandler() {
    let device;

    const filters = [{ 'vendorId': VENDOR_ID }];

    try {
        device = await navigator.usb.requestDevice({ 'filters': filters });
    }
    catch (e) {
        console.log("requestDevice() failed: " + e);
        return;
    }

    webusb_connect(device);
}


async function webusb_connect(device) {
    try {
        await device.open();
        if (device.configuration === null) {
            await device.selectConfiguration(1);
        }

        await device.claimInterface(TEST_INTERFACE);
    }
    catch (e) {
        console.error('Failed to open the device', e);
        return;
    }

    console.log('Connected to device with serial number ' + device.serialNumber);

    webusb_device = device;
    // webusb_test_control_transfer();
    // webusb_send_data();
    webusb_receive_data();
}

async function webusb_test_control_transfer() {
    const setup = {
        "requestType": "vendor",
        "recipient": "device",
        "request": 72,
        "value": 0,
        "index": 0
    };
    const encoder = new TextEncoder();
    const data = encoder.encode('Hello world!\n');

    let result = await webusb_device.controlTransferOut(setup, data);
    if (result.status == "ok") {
        console.log("controlTransferOut OK " + result.bytesWritten);
    }
    else {
        console.log("controlTransferOut FAIL " + result.staus);
    }
}

async function webusb_disconnect() {
    if (webusb_device) {
        try {
            await webusb_device.close();
        }
        finally {
            webusb_device = undefined;
        }
    }
}

async function webusb_send_data() {
    if (!webusb_device) {
      console.log('USB device not connected');
      return;
    }

    let encoder = new TextEncoder();
    let data = encoder.encode("Hello world EP1 This is a long string here. It has many characters. It even spans multiple USB packets!");

    try {
        let result = await webusb_device.transferOut(TEST_EP_OUT, data);
        if (result.status != 'ok') {
            console.error('transferOut() failed:', result.status);
        }
    }
    catch (e) {
        console.error('transferOut() exception:', e);
        return;
    }
}

async function webusb_receive_data() {
    for (;;) {
        try {
            let result = await webusb_device.transferIn(TEST_EP_IN, EP_SIZE);
            if (result.status == 'ok') {
                const decoder = new TextDecoder('utf-8');
                const value = decoder.decode(result.data);
                console.log("Received: " + value);
                statusDisplay.textContent = "Received: " + value;
            }
            else {
                console.log('transferIn() failed:', result.status);
            }
        }
        catch (e) {
            if (e.code == e.NETWORK_ERR) {
              console.log('Device disconnected, shutting down webusb_receive_data');
            }
            else {
              console.error('transferIn() exception:', e);
            }
            return;
        }
    }
}

function webusb_device_connected(connection_event) {
    const device = connection_event.device;
    console.log('USB device connected:', device);
    if (!webusb_device) {
        if (device && device.vendorId == VENDOR_ID) {
            webusb_connect(device);
        }
    }
}

function webusb_device_disconnected(connection_event) {
    console.log('USB device disconnected:', connection_event);
    const disconnected_device = connection_event.device;
    if (webusb_device &&  disconnected_device == webusb_device) {
        webusb_device = undefined;
        webusb_disconnect();
    }
}

