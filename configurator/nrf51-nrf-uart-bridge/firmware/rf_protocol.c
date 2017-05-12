#include <stdbool.h>
#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <stdarg.h>

#include <sdk_common.h>
#include <nrf_esb.h>
#include <app_uart.h>
#include <app_simple_timer.h>

#include <rf_protocol.h>
#include <slip.h>


extern volatile uint32_t milliseconds;


#define CONFIGURATOR_ADDRESS_SIZE 5
#define CONFIGURATOR_NUMBER_OF_HOP_CHANNELS 20
#define CONFIGURATOR_CHANNEL 79

#define CONNECTION_TIMEOUT_MS 600

#define MSG_DEBUG 0x00
#define TX_FREE_TO_CONNECT 0x30
#define CFG_REQUEST_TO_CONNECT 0x31
#define CFG_READ 0x72
#define CFG_WRITE 0x77
#define CFG_COPY 0x63
#define CFG_DISCONNECT 0x64
#define TX_INFO 0x49
#define TX_REQUESTED_DATA 0x52
#define TX_WRITE_SUCCESSFUL 0x57
#define TX_COPY_SUCCESSFUL 0x43

#define PACKET_FIFO_SIZE 10


typedef struct  {
    uint32_t begin;
    uint32_t end;
    uint8_t size;
    nrf_esb_payload_t *data;
} FIFO_T;


static const uint8_t configurator_address[] = {0x4c, 0x42, 0x72, 0x63, 0x78};
static bool connected = false;

static uint8_t session_address[CONFIGURATOR_ADDRESS_SIZE];
static uint8_t session_hop_channels[CONFIGURATOR_NUMBER_OF_HOP_CHANNELS];
static uint8_t session_hop_index;

static uint32_t last_successful_transmission_ms;

static bool waiting_for_disconnect = false;
static bool waiting_for_connection = false;

static slip_t slip;
static uint8_t slip_buffer[128];

nrf_esb_payload_t received_packet;
FIFO_T packet_fifo;
nrf_esb_payload_t packet_fifo_buffer[PACKET_FIFO_SIZE];

nrf_esb_payload_t helper_packets[3];
nrf_esb_payload_t *packet_queued;
nrf_esb_payload_t *packet_in_transit;
nrf_esb_payload_t *completed_packet;



// ****************************************************************************
void PACKET_FIFO_init(FIFO_T *ring, nrf_esb_payload_t *buf, uint8_t size)
{
    ring->data = buf;
    ring->size = size;
    ring->begin = 0;
    ring->end = 0;
}


// ****************************************************************************
uint8_t PACKET_FIFO_write(FIFO_T *ring, nrf_esb_payload_t *data)
{
    __disable_irq();
    if (((ring->end + 1) % ring->size) != ring->begin) {
        memcpy(&ring->data[ring->end], data, sizeof(nrf_esb_payload_t));
        ring->end = (ring->end + 1) % ring->size;
        __enable_irq();
        return 1;
    }

    __enable_irq();
    return 0;
}


// ****************************************************************************
uint8_t PACKET_FIFO_write_buffer(FIFO_T *ring, const uint8_t *buffer, uint8_t length)
{
    nrf_esb_payload_t data;

    data.length = length;
    memcpy(data.data, buffer, length);

    __disable_irq();
    if (((ring->end + 1) % ring->size) != ring->begin) {
        memcpy(&ring->data[ring->end], &data, sizeof(nrf_esb_payload_t));
        ring->end = (ring->end + 1) % ring->size;
        __enable_irq();
        return 1;
    }

    __enable_irq();
    return 0;
}


// ****************************************************************************
uint8_t PACKET_FIFO_read(FIFO_T *ring, nrf_esb_payload_t *data)
{
    if (data != NULL) {
        if (ring->begin != ring->end) {
            memcpy(data, &ring->data[ring->begin], sizeof(nrf_esb_payload_t));
            ring->begin = (ring->begin + 1) % ring->size;
            return 1;
        }
    }

    return 0;
}


// ****************************************************************************
bool PACKET_FIFO_is_empty(FIFO_T *ring)
{
    return (ring->begin == ring->end);
}


// ****************************************************************************
static void slip_reply(const uint8_t *data, uint8_t length)
{
    // While we are waiting for a connection, we are listening for special
    // TX_FREE_TO_CONNECT packets with size == 1. These are NRF protocol
    // specific and we don't want to send them up the chain.
    if (length == 1   &&  data[0] == TX_FREE_TO_CONNECT) {
        return;
    }

    SLIP_encode(data, length, putchar);
}


// ****************************************************************************
void debug_printf(const char * format, ...)
{
    va_list args;
    static char buffer[32];

    memset(buffer, 'x', sizeof(buffer));

    buffer[0] = MSG_DEBUG;
    va_start(args, format);
    vsnprintf(&buffer[1], 32-1, format, args);
    va_end(args);
    buffer[31] = '\0';
    slip_reply((uint8_t *)buffer, strlen(&buffer[1]) + 2);
}


// ****************************************************************************
static void set_address_and_channel(const uint8_t * address, uint8_t channel)
{
    bool idle;
    uint32_t err_code;

    if (address == NULL  &&  channel > 125) {
        // No inputs given, so we have nothing to do
        debug_printf("ERROR No inputs given\n");
        return;
    }

    idle = nrf_esb_is_idle();

    if (!idle) {
        do {
            err_code = nrf_esb_stop_rx();
        } while (err_code != NRF_SUCCESS);
    }

    if (address != NULL) {
        err_code = nrf_esb_set_base_address_0(address + 1);
        if (err_code != NRF_SUCCESS) {
            debug_printf("ERROR nrf_esb_set_base_address_0: %lu\n", err_code);
        }
        err_code = nrf_esb_set_prefixes(address, 1);
        if (err_code != NRF_SUCCESS) {
            debug_printf("ERROR nrf_esb_set_prefixes: %lu\n", err_code);
        }
    }

    if (channel <= 125) {
        err_code = nrf_esb_set_rf_channel(channel);
        if (err_code != NRF_SUCCESS) {
            debug_printf("ERROR nrf_esb_set_rf_channel: %lu\n", err_code);
        }
    }

    if (!idle) {
        nrf_esb_flush_tx();
        nrf_esb_flush_rx();

        err_code = nrf_esb_start_rx();
        if (err_code != NRF_SUCCESS) {
            debug_printf("ERROR nrf_esb_start_rx: %lu\n", err_code);
        }
    }
}


// ****************************************************************************
static void calculate_hop_sequence(uint8_t offset, uint8_t seed)
{
    int i;
    uint8_t lfsr = seed;

    for (i = 0; i < CONFIGURATOR_NUMBER_OF_HOP_CHANNELS; i++) {
        bool channel_already_used;
        uint8_t channel;

        do {
            int j;
            uint8_t lsb;

            lsb = lfsr & 1;
            lfsr >>= 1;
            if (lsb) {
                lfsr ^= 0x60;       // x^7 + x^6 + 1
            }
            channel = (lfsr + offset) % 127;

            session_hop_channels[i] = channel;

            channel_already_used = false;
            for (j = 0; j < i; j++) {
                if (channel == session_hop_channels[j]) {
                    channel_already_used = true;
                    break;
                }
            }
        } while (channel > 69  ||  channel_already_used);
        // Note: this loop runs worst-case 7 times
    }

    // debug_printf("Session hop channels: ");
    // for (i = 0; i < CONFIGURATOR_NUMBER_OF_HOP_CHANNELS; i++) {
    //     debug_printf("%d ", session_hop_channels[i]);
    // }
    // debug_printf("\n");
}


// ****************************************************************************
void set_session_address(const uint8_t address[CONFIGURATOR_ADDRESS_SIZE])
{
    // int i;

    memcpy(session_address, address, CONFIGURATOR_ADDRESS_SIZE);

    // debug_printf("Session address: ");
    // for (i = 0; i < CONFIGURATOR_ADDRESS_SIZE; i++) {
    //     if (i) {
    //         debug_printf(":");
    //     }
    //     debug_printf("%02x", session_address[i]);
    // }
    // debug_printf("\n");
}


// ****************************************************************************
void timer_handler(void * context)
{
    if (connected) {
        session_hop_index = (session_hop_index + 1) % CONFIGURATOR_NUMBER_OF_HOP_CHANNELS;
        set_address_and_channel(session_address, session_hop_channels[session_hop_index]);

        // For now only perform one hop, as it seems that we hit a case where
        // we get async with the transmitter and timeout completely
        // app_simple_timer_start(APP_SIMPLE_TIMER_MODE_SINGLE_SHOT, timer_handler, 5000, NULL);


        // debug_printf("%lu HOP TIMER\n", milliseconds);
    }
}


// ****************************************************************************
static void send_packet(const nrf_esb_payload_t *data)
{
    nrf_esb_payload_t tx = {
        .pipe = 0,
        .length = data->length
    };

    memcpy(tx.data, data->data, data->length);

    switch (tx.data[0]) {
        case CFG_DISCONNECT:
            waiting_for_disconnect = true;
            break;

        case CFG_REQUEST_TO_CONNECT:
            if (data->length == 18) {
                set_address_and_channel(&tx.data[1], CONFIGURATOR_CHANNEL);
                set_session_address(&tx.data[9]);
                calculate_hop_sequence(tx.data[16], tx.data[17]);

                last_successful_transmission_ms = milliseconds;
                waiting_for_connection = true;
            }
            else {
                debug_printf("CFG_REQUEST_TO_CONNECT length is not 18\n");
            }
            break;

        default:
            break;
    }

    nrf_esb_write_payload(&tx);
}


// ****************************************************************************
static void configurator_connected()
{
    waiting_for_connection = false;
    waiting_for_disconnect = false;
    connected = true;
    session_hop_index = 0;
    set_address_and_channel(session_address, session_hop_channels[session_hop_index]);
}


// ****************************************************************************
static void configurator_disconnected()
{
    waiting_for_connection = false;
    waiting_for_disconnect = false;
    connected = false;
    set_address_and_channel(configurator_address, CONFIGURATOR_CHANNEL);
}


// ****************************************************************************
static void parse_command_not_connected(const uint8_t * rx_packet, uint8_t length)
{
    if (rx_packet[0] == TX_FREE_TO_CONNECT) {
        if (length == 1) {
            configurator_connected();

            debug_printf("%lu TX_FREE_TO_CONNECT (ack)\n", milliseconds);
            return;
        }

        // debug_printf("TX_FREE_TO_CONNECT\n");

        if (length != 27) {
            debug_printf("TX_FREE_TO_CONNECT length is not 27\n");
            return;
        }

        return;
    }

    debug_printf("NOT_CONNECTED: Unhandled packet 0x%x, length %d\n", rx_packet[0], length);
}



// ****************************************************************************
static void parse_command_connected(const uint8_t * rx_packet, uint8_t length)
{
    if (waiting_for_disconnect) {
        configurator_disconnected();
        debug_printf("%lu Disconnected\n", milliseconds);
        return;
    }

    if (rx_packet[0] == TX_INFO) {
        // debug_printf("%lu TX_INFO\n", milliseconds);
        return;
    }

    if (rx_packet[0] == TX_REQUESTED_DATA) {
        // uint16_t offset;
        // uint8_t count;

        if (length < 4) {
            debug_printf("%lu TX_REQUESTED_DATA length is less than 4\n", milliseconds);
            return;
        }

        // offset = (rx_packet[2] << 8) + rx_packet[1];
        // count = length - 3;

        // debug_printf("%lu TX_REQUESTED_DATA o=%u, c=%d \"%s\"\n", milliseconds, offset, count, &rx_packet[3]);
        return;
    }

    if (rx_packet[0] == TX_WRITE_SUCCESSFUL) {
        // uint16_t offset;
        // uint8_t count;

        if (length != 4) {
            debug_printf("%lu TX_WRITE_SUCCESSFUL length is not 4\n", milliseconds);
            return;
        }

        // offset = (rx_packet[2] << 8) + rx_packet[1];
        // count = rx_packet[3];

        // debug_printf("%lu TX_WRITE_SUCCESSFUL o=%u, c=%d\n", milliseconds, offset, count);
        return;
    }

    if (rx_packet[0] == TX_COPY_SUCCESSFUL) {
        // uint16_t src;
        // uint16_t dst;
        // uint16_t count;

        if (length != 7) {
            debug_printf("%lu TX_COPY_SUCCESSFUL length is not 7\n", milliseconds);
            return;
        }

        // src = (rx_packet[2] << 8) + rx_packet[1];
        // dst = (rx_packet[4] << 8) + rx_packet[3];
        // count = (rx_packet[6] << 8) + rx_packet[5];

        // debug_printf("%lu TX_COPY_SUCCESSFUL src=%u, dst=%u, c=%d\n", milliseconds, src, dst, count);
        return;
    }

    debug_printf("CONNECTED: Unhandled packet 0x%x, length %d\n", rx_packet[0], length);
}


// ****************************************************************************
static void rf_event_handler(nrf_esb_evt_t const *event)
{

    switch (event->evt_id) {
        case NRF_ESB_EVENT_TX_SUCCESS:
            // debug_printf("%lu TX SUCCESS\n", milliseconds);
            break;

        case NRF_ESB_EVENT_TX_FAILED:
            // debug_printf("%lu TX FAILED\n", milliseconds);
            nrf_esb_flush_tx();
            break;

        case NRF_ESB_EVENT_RX_RECEIVED:
            last_successful_transmission_ms = milliseconds;

            // Read the packet, which is then processed in the mainloop
            nrf_esb_read_rx_payload(&received_packet);
            break;
    }
}


// ****************************************************************************
#define BUFFER_SIZE 80
static void read_UART() {
    uint8_t byte;

    while (app_uart_get(&byte) == NRF_SUCCESS) {
        if (SLIP_decode(&slip, byte)) {
            PACKET_FIFO_write_buffer(&packet_fifo, slip.buffer, slip.message_size);
            SLIP_init(&slip);
        }
    }
}


static void handle_received_packet(void)
{
    if (received_packet.length == 0) {
        return;
    }

    // int i;

    // printf("%lu RX (%d) ", milliseconds, received_packet.length);
    // for  (i = 0; i < received_packet.length; i++) {
    //     printf("%02X ", received_packet.data[i]);
    // }
    // printf("\n");

    slip_reply(received_packet.data, received_packet.length);

    if (connected) {
        session_hop_index = (session_hop_index + 1) % CONFIGURATOR_NUMBER_OF_HOP_CHANNELS;
        set_address_and_channel(session_address, session_hop_channels[session_hop_index]);

        app_simple_timer_start(APP_SIMPLE_TIMER_MODE_SINGLE_SHOT, timer_handler, 7500, NULL);

        parse_command_connected(received_packet.data, received_packet.length);
    }
    else {
        parse_command_not_connected(received_packet.data, received_packet.length);
    }

    completed_packet = packet_in_transit;
    packet_in_transit = packet_queued;

    if (connected  &&  completed_packet->length) {
        bool match = false;

        switch (completed_packet->data[0]) {
            case CFG_READ:
                if (received_packet.data[0] == TX_REQUESTED_DATA) {
                    match = true;
                }
                break;

            case CFG_WRITE:
                if (received_packet.data[0] == TX_WRITE_SUCCESSFUL) {
                    match = true;
                }
                break;

            case CFG_COPY:
                if (received_packet.data[0] == TX_COPY_SUCCESSFUL) {
                    match = true;
                }
                break;

            default:
                match = true;
                break;
        }

        packet_queued = completed_packet;
        if (match) {

            if (PACKET_FIFO_read(&packet_fifo, packet_queued)) {
                send_packet(packet_queued);
            }
            else {
                packet_queued->length = 0;
            }
        }
        else {
            // Resend failed packet
            send_packet(packet_queued);
        }
    }
    else {
        packet_queued = completed_packet;

        if (PACKET_FIFO_read(&packet_fifo, packet_queued)) {
            send_packet(packet_queued);
        }
        else {
            packet_queued->length = 0;
        }
    }

    received_packet.length = 0;
}


// ****************************************************************************
void RF_service(void)
{
    read_UART();
    handle_received_packet();

    if (connected) {
        if (milliseconds > (last_successful_transmission_ms + CONNECTION_TIMEOUT_MS)) {
            debug_printf("%lu !!!!! DISCONNECTED DUE TO TIMEOUT\n", milliseconds);

            configurator_disconnected();
        }
    }

    if (waiting_for_connection) {
        if (milliseconds > (last_successful_transmission_ms + CONNECTION_TIMEOUT_MS)) {
            debug_printf("%lu !!!!! DISCONNECTED DURING CONNECTION PHASE DUE TO TIMEOUT\n", milliseconds);
            configurator_disconnected();
        }
    }
}


// ****************************************************************************
uint32_t RF_init(void)
{
    uint32_t err_code;
    nrf_esb_config_t nrf_esb_config = NRF_ESB_DEFAULT_CONFIG;

    nrf_esb_config.protocol                 = NRF_ESB_PROTOCOL_ESB_DPL;
    nrf_esb_config.bitrate                  = NRF_ESB_BITRATE_2MBPS;
    nrf_esb_config.mode                     = NRF_ESB_MODE_PRX;
    nrf_esb_config.event_handler            = rf_event_handler;
    nrf_esb_config.selective_auto_ack       = false;


    PACKET_FIFO_init(&packet_fifo, packet_fifo_buffer, PACKET_FIFO_SIZE);


    helper_packets[0].length = 0;
    helper_packets[1].length = 0;
    helper_packets[2].length = 0;
    received_packet.length = 0;

    packet_queued = &helper_packets[0];
    packet_in_transit = &helper_packets[1];
    completed_packet = &helper_packets[2];


    slip.buffer = slip_buffer;
    slip.buffer_size = sizeof(slip_buffer);
    SLIP_init(&slip);


    app_simple_timer_init();


    err_code = nrf_esb_init(&nrf_esb_config);
    VERIFY_SUCCESS(err_code);

    set_address_and_channel(configurator_address, CONFIGURATOR_CHANNEL);

    err_code = nrf_esb_start_rx();
    VERIFY_SUCCESS(err_code);


    debug_printf("\n\n\nnRF51 UART bridge running\n");

    return NRF_SUCCESS;
}