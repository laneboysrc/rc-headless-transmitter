#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <libopencm3/stm32/rcc.h>
#include <libopencm3/stm32/gpio.h>
#include <libopencm3/usb/usbd.h>
#include <libopencm3/stm32/f1/nvic.h>

#include <configurator.h>
#include <led.h>
#include <ring_buffer.h>
#include <serial_number.h>
#include <systick.h>
#include <webusb.h>

enum {
    USB_INTERFACE_WEBUSB,
    USB_NUMBER_OF_INTERFACES
};

#define VENDOR_INTERFACE_CLASS 0xff

#define USB_STRING_LANGUAGE 0
#define USB_STRING_MANUFACTURER 1
#define USB_STRING_PRODUCT 2
#define USB_STRING_SERIAL_NUMBER 3

#define USB_CSCP_NoDeviceClass (0x00)
#define USB_CONFIG_ATTR_BUSPOWERED 0x80
#define USB_CONFIG_POWER_MA(mA) ((mA)/2)

#define USB_EP_WEBUSB_IN 0x01
#define USB_EP_WEBUSB_OUT 0x82

#define USB_TX_BUFFER_SIZE 256


bool usb_configured = false;

static usbd_device *webusb_device;
uint8_t usbd_control_buffer[64];

static uint8_t usb_tx_buffer[USB_TX_BUFFER_SIZE];
static RING_BUFFER_T usb_tx_ring_buffer;

static uint8_t ep_buffer[64];
static uint16_t ep_length = 0;


static const struct usb_device_descriptor device_descriptor = {
    .bLength = USB_DT_DEVICE_SIZE,
    .bDescriptorType = USB_DT_DEVICE,

    .bcdUSB = 0x0210,
    .bDeviceClass = USB_CSCP_NoDeviceClass,
    .bDeviceSubClass = 0,
    .bDeviceProtocol = 0,

    .bMaxPacketSize0 = sizeof(usbd_control_buffer),
    .idVendor = 0x6666,
    .idProduct = 0xeaf1,
    .bcdDevice = 0x0101,

    .iManufacturer = USB_STRING_MANUFACTURER,
    .iProduct = USB_STRING_PRODUCT,
    .iSerialNumber = USB_STRING_SERIAL_NUMBER,

    .bNumConfigurations = 1
};

static const struct usb_endpoint_descriptor webusb_endpoints[] = {
    {
        .bLength = USB_DT_ENDPOINT_SIZE,
        .bDescriptorType = USB_DT_ENDPOINT,
        .bEndpointAddress = 0x01,
        .bmAttributes = USB_ENDPOINT_ATTR_BULK,
        .wMaxPacketSize = 64,
        .bInterval = 1,
    },
    {
        .bLength = USB_DT_ENDPOINT_SIZE,
        .bDescriptorType = USB_DT_ENDPOINT,
        .bEndpointAddress = 0x82,
        .bmAttributes = USB_ENDPOINT_ATTR_BULK,
        .wMaxPacketSize = 64,
        .bInterval = 1,
    }
};

static const struct usb_iface_assoc_descriptor webusb_interface_association[] = {
    {
        .bLength = USB_DT_INTERFACE_ASSOCIATION_SIZE,
        .bDescriptorType = USB_DT_INTERFACE_ASSOCIATION,
        .bFirstInterface = USB_INTERFACE_WEBUSB,
        .bInterfaceCount = 1,
        .bFunctionClass = VENDOR_INTERFACE_CLASS,
        .bFunctionSubClass = 0,
        .bFunctionProtocol = 0,
        .iFunction = 0,
    }
};

static const struct usb_interface_descriptor webusb_interfaces[] = {
    {
        .bLength = USB_DT_INTERFACE_SIZE,
        .bDescriptorType = USB_DT_INTERFACE,
        .bInterfaceNumber = USB_INTERFACE_WEBUSB,
        .bAlternateSetting = 0,
        .bNumEndpoints = 2,
        .bInterfaceClass = VENDOR_INTERFACE_CLASS,
        .bInterfaceSubClass = 0,
        .bInterfaceProtocol = 0,
        .iInterface = 0,

        .endpoint = webusb_endpoints,
    }
};

static const struct usb_interface interfaces[] = {
    {
        .num_altsetting = 1,
        .iface_assoc = webusb_interface_association,
        .altsetting = webusb_interfaces
    }
};

static const struct usb_config_descriptor configuration_descriptor = {
    .bLength = USB_DT_CONFIGURATION_SIZE,
    .bDescriptorType = USB_DT_CONFIGURATION,
    .bNumInterfaces = USB_NUMBER_OF_INTERFACES,
    .bConfigurationValue = 1,
    .iConfiguration = 0,
    .bmAttributes = USB_CONFIG_ATTR_BUSPOWERED,
    .bMaxPower = USB_CONFIG_POWER_MA(100),

    .interface = interfaces
};

static char serial_number[9];

static const char *usb_strings[] = {
    "LANE Boys RC",
    "Transmitter",
    serial_number
};


// ****************************************************************************
static enum usbd_request_return_codes webusb_control_request(usbd_device *usbd_dev, struct usb_setup_data *req, uint8_t **buf, uint16_t *len, void (**complete)(usbd_device *usbd_dev, struct usb_setup_data *req))
{
    (void) usbd_dev;
    (void) buf;
    (void) len;
    (void) complete;

    printf("webusb_control_request() bmRequestType=%02x bRequest=%d\n", req->bmRequestType, req->bRequest);
    // LED_pulse();

    switch (req->bRequest) {
        // return USBD_REQ_HANDLED;
        // return USBD_REQ_NOTSUPP;

        // For testing only
        case 72:
            printf("    len=%d buf=\"%s\"\n", *len, *buf);
            return USBD_REQ_HANDLED;

        default:
            return USBD_REQ_NEXT_CALLBACK;
    }
}


// ****************************************************************************
static void webusb_receive_callback(usbd_device *usbd_dev, uint8_t ep)
{
    char buf[64+1];
    uint16_t len;

    (void) ep;

    len = usbd_ep_read_packet(usbd_dev, 0x01, buf, 64);
    CONFIGURATOR_event(TRANSPORT_USB, CONFIGURATOR_EVENT_RX, (uint8_t *)buf, len);
}


// ****************************************************************************
void WEBUSB_putc(char c)
{
    RING_BUFFER_write(&usb_tx_ring_buffer, (uint8_t *)&c, 1);
}


// ****************************************************************************
static void webusb_set_config_callback(usbd_device *usbd_dev, uint16_t wValue)
{
    printf("webusb_set_config_callback() config=%d\n", wValue);
    // LED_pulse();

    usbd_ep_setup(usbd_dev, 0x01, USB_ENDPOINT_ATTR_BULK, 64, webusb_receive_callback);
    usbd_ep_setup(usbd_dev, 0x82, USB_ENDPOINT_ATTR_BULK, 64, NULL);
    usbd_register_control_callback(usbd_dev, 0, 0, webusb_control_request);

    RING_BUFFER_init(&usb_tx_ring_buffer, usb_tx_buffer, USB_TX_BUFFER_SIZE);
    ep_length = 0;

    usb_configured = true;
}


// ****************************************************************************
static void webusb_reset_callback(void)
{
    printf("webusb_reset_callback()\n");
    // LED_pulse();

    usb_configured = false;
}


// ****************************************************************************
void WEBUSB_poll(void)
{

    if (usb_configured) {
        static uint8_t dummy_hop_index = 0;
        configurator_packet_t *p;

        if (ep_length == 0  &&  ! RING_BUFFER_is_empty(&usb_tx_ring_buffer)) {
            ep_length = RING_BUFFER_read(&usb_tx_ring_buffer, ep_buffer, 64);
        }

        if (ep_length) {
            uint16_t result;

            result = usbd_ep_write_packet(webusb_device, 0x82, ep_buffer, ep_length);
            if (result) {
                // LED_pulse();
                ep_length = 0;
            }
        }

        p = CONFIGURATOR_send_request(TRANSPORT_USB, dummy_hop_index, 1);
        if (p != NULL  &&  p->payload_size > 0) {
            RING_BUFFER_write(&usb_tx_ring_buffer, p->payload, p->payload_size);
        }
        ++dummy_hop_index;
    }

    usbd_poll(webusb_device);
}


// ****************************************************************************
void WEBUSB_init(void)
{
    RING_BUFFER_init(&usb_tx_ring_buffer, usb_tx_buffer, USB_TX_BUFFER_SIZE);

    SERIAL_NUMBER_get(serial_number);

    webusb_device = usbd_init(&st_usbfs_v1_usb_driver, &device_descriptor, &configuration_descriptor, usb_strings, 3, usbd_control_buffer, sizeof(usbd_control_buffer));
    usbd_register_reset_callback(webusb_device, webusb_reset_callback);
    usbd_register_set_config_callback(webusb_device, webusb_set_config_callback);
}