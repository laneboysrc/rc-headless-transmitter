#include <stdbool.h>
#include <stdio.h>
#include <stdint.h>
#include <string.h>

#include <sdk_common.h>
#include <nrf_esb.h>
#include <app_uart.h>
#include <app_simple_timer.h>

#include <rf_protocol.h>


#define CONFIGURATOR_ADDRESS_SIZE 5
#define CONFIGURATOR_NUMBER_OF_HOP_CHANNELS 20
#define CONFIGURATOR_CHANNEL 79

#define CONNECTION_TIMEOUT_MS 600

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


extern volatile uint32_t milliseconds;


static const uint8_t configurator_address[] = {0x4c, 0x42, 0x72, 0x63, 0x78};
static bool connected = false;

static uint8_t uuid[8];
static bool uuid_received = false;

static uint8_t session_address[CONFIGURATOR_ADDRESS_SIZE];
static uint8_t session_hop_channels[CONFIGURATOR_NUMBER_OF_HOP_CHANNELS];
static uint8_t session_hop_index;

static uint32_t last_successful_transmission_ms;


typedef enum {
    APP_NOT_CONNECTED = 0,
    APP_GOT_UUID,
    APP_CONNECT,
    APP_CONNECTED
} app_state_t;


// ****************************************************************************
static void set_address_and_channel(const uint8_t * address, uint8_t channel)
{
    bool idle;

    if (address == NULL  &&  channel > 125) {
        // No inputs given, so we have nothing to do
        return;
    }

    idle = nrf_esb_is_idle();

    if (!idle) {
        nrf_esb_stop_rx();
    }

    if (address != NULL) {
        nrf_esb_set_base_address_0(address + 1);
        nrf_esb_set_prefixes(address, 1);
    }

    if (channel <= 125) {
        nrf_esb_set_rf_channel(CONFIGURATOR_CHANNEL);
    }

    if (!idle) {
        nrf_esb_start_rx();
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

    printf("Session hop channels: ");
    for (i = 0; i < CONFIGURATOR_NUMBER_OF_HOP_CHANNELS; i++) {
        printf("%d ", session_hop_channels[i]);
    }
    printf("\n");
}


// ****************************************************************************
static void send_request_to_connect()
{
    nrf_esb_payload_t tx;
    uint8_t lfsr_offset;
    uint8_t lfsr_seed;
    uint8_t offset = 0;

    const uint8_t dummy_address[] = {0x12, 0x23, 0x34, 0x45, 0x56};

    // FIXME: generate random session_address
    memcpy(session_address, dummy_address, CONFIGURATOR_ADDRESS_SIZE);
    // FIXME: generate random offset 0..255
    lfsr_offset = 0;
    // FIXME: generate random seed 1..127
    lfsr_seed = 1;


    tx.data[offset] = CFG_REQUEST_TO_CONNECT;
    offset += sizeof(uint8_t);

    memcpy(&tx.data[offset], uuid, sizeof(uuid));
    offset += sizeof(uuid);

    memcpy(&tx.data[offset], session_address, CONFIGURATOR_ADDRESS_SIZE);
    offset += CONFIGURATOR_ADDRESS_SIZE;

    *(uint16_t *)(tx.data+offset) = 1234;
    offset += sizeof(uint16_t);

    tx.data[offset] = lfsr_offset;
    offset += sizeof(uint8_t);

    tx.data[offset] = lfsr_seed;
    offset += sizeof(uint8_t);

    tx.length = offset;
    tx.pipe = 0;


    // Listen to the address corresponding to the lower 5 bytes of the UUID
    set_address_and_channel(uuid, CONFIGURATOR_CHANNEL);

    nrf_esb_write_payload(&tx);

    // FIXME: *after* the packet was sent, we need to start hopping
    calculate_hop_sequence(lfsr_offset, lfsr_seed);
    session_hop_index = 0;
}


// ****************************************************************************
static void send_disconnect()
{
    nrf_esb_payload_t tx = {
        .pipe = 0,
        .data = {
            CFG_DISCONNECT
        },
        .length = 1
    };

    nrf_esb_write_payload(&tx);
}


// ****************************************************************************
static void parse_command_not_connected(const uint8_t * rx_packet, uint8_t length)
{
    if (rx_packet[0] == TX_FREE_TO_CONNECT) {
        if (length == 1) {
            printf("TX_FREE_TO_CONNECT (ack)\n");
            return;
        }

        printf("TX_FREE_TO_CONNECT!\n");

        if (length != 27) {
            printf("  ERROR: Packet length is not 27\n");
            return;
        }

        memcpy(uuid, &rx_packet[1], sizeof(uuid));
        uuid_received = true;
        return;
    }

    printf("NOT_CONNECTED: Unhandled packet 0x%x, length %d\n", rx_packet[0], length);
}


// ****************************************************************************
static void parse_command_connected(const uint8_t * rx_packet, uint8_t length)
{
    // if (set_session_address) {
        if (rx_packet[0] == 0x30) {
            printf("setting session address\n");
            set_address_and_channel(session_address, CONFIGURATOR_CHANNEL);
        }
        // set_session_address = false;
        // return;
    // }

    printf("CONNECTED: Unhandled packet 0x%x, length %d\n", rx_packet[0], length);
}


// ****************************************************************************
static void rf_event_handler(nrf_esb_evt_t const *event)
{
    nrf_esb_payload_t payload;

    switch (event->evt_id) {
        case NRF_ESB_EVENT_TX_SUCCESS:
            printf("%lu TX SUCCESS\n", milliseconds);

            // FIXME: why do we need to flush here?
            nrf_esb_flush_tx();
            break;

        case NRF_ESB_EVENT_TX_FAILED:
            printf("%lu TX FAILED\n", milliseconds);
            nrf_esb_flush_tx();
            break;

        case NRF_ESB_EVENT_RX_RECEIVED:
            last_successful_transmission_ms = milliseconds;
            if (nrf_esb_read_rx_payload(&payload) == NRF_SUCCESS) {
                // int i;

                // printf("%lu RX (%d) ", milliseconds, payload.length);
                // for  (i = 0; i < payload.length; i++) {
                //     printf("%02X ", payload.data[i]);
                // }
                // printf("\n");

                if (connected) {
                    parse_command_connected(payload.data, payload.length);
                }
                else {
                    parse_command_not_connected(payload.data, payload.length);
                }
            }
            break;
    }
}


// ****************************************************************************
#define BUFFER_SIZE 80
static void read_UART() {
    uint8_t msg[BUFFER_SIZE];
    int count = 0;

    memset(msg, 0, BUFFER_SIZE);

    while (app_uart_get(&msg[count]) == NRF_SUCCESS) {
        ++count;
        if (count >= (BUFFER_SIZE - 1)) {
            break;
        }
    }

    if (count) {
        printf("UART RX: %s\n", msg);
    }
}


// ****************************************************************************
void timer_handler(void * p_context)
{
    printf("%lu TIMER 15 ms later\n", milliseconds);
}


// ****************************************************************************
void RF_service(void)
{
    static app_state_t state = APP_NOT_CONNECTED;
    static uint32_t timer;

    read_UART();

    if (connected) {
        if (milliseconds > (last_successful_transmission_ms + CONNECTION_TIMEOUT_MS)) {
            set_address_and_channel(configurator_address, CONFIGURATOR_CHANNEL);
            connected = false;
            uuid_received = false;
            state = APP_NOT_CONNECTED;
            printf("!!!!! DISCONNECTED DUE TO TIMEOUT\n");
        }
    }

    switch (state) {
        case APP_NOT_CONNECTED:
            if (uuid_received) {
                printf("%lu APP got UUID\n", milliseconds);

                app_simple_timer_start(APP_SIMPLE_TIMER_MODE_SINGLE_SHOT, timer_handler, 15000, NULL);

                state = APP_GOT_UUID;
                timer = milliseconds;
            }
            break;

        case APP_GOT_UUID:
            if (milliseconds > timer + 5000) {
                printf("APP Connecting\n");
                send_request_to_connect();
                state = APP_CONNECTED;
                timer = milliseconds;
                connected = true;
            }
            break;

        case APP_CONNECTED:
            if (milliseconds > timer + 5000) {
                printf("APP Disconnecting\n");
                send_disconnect();

                // FIXME: we should only do that after the disconnect packet
                // was sent!
                set_address_and_channel(configurator_address, CONFIGURATOR_CHANNEL);

                uuid_received = false;
                state = APP_NOT_CONNECTED;
                connected = false;
            }
            break;

        default:
            uuid_received = false;
            state = APP_NOT_CONNECTED;
            break;
    }
}


// ****************************************************************************
uint32_t RF_init(void)
{
    uint32_t err_code;

    app_simple_timer_init();

    nrf_esb_config_t nrf_esb_config         = NRF_ESB_DEFAULT_CONFIG;
    nrf_esb_config.protocol                 = NRF_ESB_PROTOCOL_ESB_DPL;
    nrf_esb_config.bitrate                  = NRF_ESB_BITRATE_2MBPS;
    nrf_esb_config.mode                     = NRF_ESB_MODE_PRX;
    nrf_esb_config.event_handler            = rf_event_handler;
    nrf_esb_config.selective_auto_ack       = false;

    err_code = nrf_esb_init(&nrf_esb_config);
    VERIFY_SUCCESS(err_code);

    set_address_and_channel(configurator_address, CONFIGURATOR_CHANNEL);

    // err_code = nrf_esb_set_base_address_0(&configurator_address[1]);
    // VERIFY_SUCCESS(err_code);

    // err_code = nrf_esb_set_prefixes(configurator_address, 1);
    // VERIFY_SUCCESS(err_code);

    // err_code = nrf_esb_set_rf_channel(CONFIGURATOR_CHANNEL);
    // VERIFY_SUCCESS(err_code);

    err_code = nrf_esb_start_rx();
    VERIFY_SUCCESS(err_code);



    return NRF_SUCCESS;
}