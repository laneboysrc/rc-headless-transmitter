#include <stdlib.h>
#include <stdint.h>

#include <libopencm3/stm32/rcc.h>
#include <libopencm3/stm32/gpio.h>
#include <libopencm3/usb/usbd.h>
#include <libopencm3/stm32/f1/nvic.h>

#include <serial_number.h>
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

static usbd_device *webusb_device;

uint8_t usbd_control_buffer[128];


static const struct usb_device_descriptor device_descriptor = {
    .bLength = USB_DT_DEVICE_SIZE,
    .bDescriptorType = USB_DT_DEVICE,

    .bcdUSB = 0x0210,
    .bDeviceClass = USB_CSCP_NoDeviceClass,
    .bDeviceSubClass = 0,
    .bDeviceProtocol = 0,

    .bMaxPacketSize0 = 64,
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
        .bInterval = 5,
    },
    {
        .bLength = USB_DT_ENDPOINT_SIZE,
        .bDescriptorType = USB_DT_ENDPOINT,
        .bEndpointAddress = 0x82,
        .bmAttributes = USB_ENDPOINT_ATTR_BULK,
        .wMaxPacketSize = 64,
        .bInterval = 5,
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
    .wTotalLength = 0,
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
    "Configurator USB dongle",
    serial_number
};


// ****************************************************************************
static int webusb_control_request(usbd_device *usbd_dev, struct usb_setup_data *req, uint8_t **buf, uint16_t *len, void (**complete)(usbd_device *usbd_dev, struct usb_setup_data *req))
{
    (void) usbd_dev;
    (void) buf;
    (void) len;
    (void) complete;

    switch (req->bRequest) {

        default:
            return USBD_REQ_NOTSUPP;
    }
}


// ****************************************************************************
static void webusb_receive_callback(usbd_device *usbd_dev, uint8_t ep)
{
    char buf[64];
    int len ;

    (void) ep;

    len = usbd_ep_read_packet(usbd_dev, 0x01, buf, 64);

    if (len) {
        usbd_ep_write_packet(usbd_dev, 0x82, buf, len);
        buf[len] = 0;
    }
}


// ****************************************************************************
static void webusb_set_config(usbd_device *usbd_dev, uint16_t wValue)
{
    (void) wValue;

    usbd_ep_setup(usbd_dev, 0x01, USB_ENDPOINT_ATTR_BULK, 64, webusb_receive_callback);
    usbd_ep_setup(usbd_dev, 0x82, USB_ENDPOINT_ATTR_BULK, 64, NULL);
    usbd_register_control_callback(usbd_dev, USB_REQ_TYPE_CLASS | USB_REQ_TYPE_INTERFACE, USB_REQ_TYPE_TYPE | USB_REQ_TYPE_RECIPIENT, webusb_control_request);
}


// ****************************************************************************
void WEBUSB_poll(void)
{
    usbd_poll(webusb_device);
    // nvic_clear_pending_irq(NVIC_USB_LP_CAN_RX0_IRQ);
}


// ****************************************************************************
void WEBUSB_init(void)
{
    // volatile uint32_t i;

    // gpio_set(GPIOC, GPIO11);
    // gpio_set_mode(GPIOC, GPIO_MODE_OUTPUT_2_MHZ, GPIO_CNF_OUTPUT_PUSHPULL, GPIO11);

    SERIAL_NUMBER_get(serial_number);

    webusb_device = usbd_init(&st_usbfs_v1_usb_driver, &device_descriptor, &configuration_descriptor, usb_strings, 3, usbd_control_buffer, sizeof(usbd_control_buffer));
    usbd_register_set_config_callback(webusb_device, webusb_set_config);

    // for (i = 0; i < 0x800000; i++) {
    //     __asm__("nop");
    // }

    // gpio_clear(GPIOC, GPIO11);

    // nvic_enable_irq(NVIC_USB_LP_CAN_RX0_IRQ);
}