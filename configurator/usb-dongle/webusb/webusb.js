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

const SLIP_MAX_MESSAGE_SIZE = 128;
const SLIP_END = 192;
const SLIP_ESC = 219;
const SLIP_ESC_END = 220;
const SLIP_ESC_ESC = 221;

const SLIP_STATE_IDLE = 0;
const SLIP_STATE_ESC = 1;
const SLIP_STATE_OVERFLOW = 2;
const SLIP_STATE_MESSAGE_RECEIVED = 3;

function slip_encode(data) {
    let encoded = new Uint8Array(SLIP_MAX_MESSAGE_SIZE);
    let encoded_length = 0;

    function _encode(data, callback)
    {
        if (!callback  ||  data.length == 0) {
            return;
        }

        let length = data.length;
        let index = 0;

        callback(SLIP_END);

        while (length) {
            switch (data[index]) {
                case SLIP_END:
                    callback(SLIP_ESC);
                    callback(SLIP_ESC_END);
                    break;

                case SLIP_ESC:
                    callback(SLIP_ESC);
                    callback(SLIP_ESC_ESC);
                    break;

                default:
                    callback(data[index]);
            }

            --length;
            ++index;
        }

        callback(SLIP_END);
    }

    function _callback(data) {
        encoded[encoded_length] = data;
        encoded_length += 1;
        if (encoded_length > SLIP_MAX_MESSAGE_SIZE) {
            throw "SLIP_MAX_MESSAGE_SIZE exceeded";
        }
    }

    _encode(data, _callback);
    return encoded.slice(0, encoded_length);
}


let slip_state = SLIP_STATE_IDLE;
let slip_message_size = 0;
let slip_buffer = new Uint8Array(SLIP_MAX_MESSAGE_SIZE);

function slip_decode(new_input)
{
    // If we are getting called after we received already a complete message,
    // re-initialize for receiving a new message
    if (slip_state == SLIP_STATE_MESSAGE_RECEIVED) {
        slip_state = SLIP_STATE_IDLE;
        slip_message_size = 0;
    }

    // If the SLIP message is too long wait until it finishes, then start
    // capturing the next message. This means long messages are simply ignored.
    if (slip_state == SLIP_STATE_OVERFLOW) {
        if (new_input == SLIP_END) {
            slip_state = SLIP_STATE_IDLE;
            slip_message_size = 0;
        }
        return undefined;
    }

    switch (new_input) {
        case SLIP_END:
            // We return True only if we received a message
            if (slip_message_size) {
                slip_state = SLIP_STATE_MESSAGE_RECEIVED;
                return slip_buffer.slice(0, slip_message_size);
            }
            return undefined;

        case SLIP_ESC:
            slip_state = SLIP_STATE_ESC;
            break;

        default:
            if (slip_state == SLIP_STATE_ESC) {
                slip_state = SLIP_STATE_IDLE;
                switch (new_input) {
                    case SLIP_ESC_ESC:
                        new_input = SLIP_ESC;
                        break;

                    case SLIP_ESC_END:
                        new_input = SLIP_END;
                        break;

                    // Protocol violation; handle it gracefully by ignoring ESC
                    default:
                        break;
                }
            }

            if (slip_message_size < SLIP_MAX_MESSAGE_SIZE) {
                slip_buffer[slip_message_size] = new_input;
                ++slip_message_size;
            }
            else {
                slip_state = SLIP_STATE_OVERFLOW;
            }
            break;
    }

    return undefined;
}
