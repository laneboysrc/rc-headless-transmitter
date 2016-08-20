#include <stdbool.h>
#include <stdio.h>
#include <stdint.h>
#include <string.h>

#include <sdk_common.h>
#include <nrf_drv_rng.h>
#include <nrf_esb.h>
#include <app_uart.h>
#include <app_simple_timer.h>

#include <rf_protocol.h>


extern volatile uint32_t milliseconds;


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


typedef enum {
    APP_NOT_CONNECTED = 0,
    APP_GOT_UUID,
    APP_CONNECT,
    APP_CONNECTED
} app_state_t;


static const uint8_t configurator_address[] = {0x4c, 0x42, 0x72, 0x63, 0x78};
static bool connected = false;

static uint8_t uuid[8];
static bool uuid_received = false;

static uint8_t session_address[CONFIGURATOR_ADDRESS_SIZE];
static uint8_t session_hop_channels[CONFIGURATOR_NUMBER_OF_HOP_CHANNELS];
static uint8_t session_hop_index;

static uint32_t last_successful_transmission_ms;


static bool wait_for_disconnected = false;
static bool mode_auto = true;


// ****************************************************************************
void rand(uint8_t * buffer, uint8_t length) {
    uint8_t bytes_available;

    do {
        __WFE();
        nrf_drv_rng_bytes_available(&bytes_available);
    } while (length > bytes_available);

    nrf_drv_rng_rand(buffer, length);
}


// ****************************************************************************
static void set_address_and_channel(const uint8_t * address, uint8_t channel)
{
    bool idle;
    uint32_t err_code;

    if (address == NULL  &&  channel > 125) {
        // No inputs given, so we have nothing to do
            printf("ERROR No inputs given\n");
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
            printf("ERROR nrf_esb_set_base_address_0: %lu\n", err_code);
        }
        err_code = nrf_esb_set_prefixes(address, 1);
        if (err_code != NRF_SUCCESS) {
            printf("ERROR nrf_esb_set_prefixes: %lu\n", err_code);
        }
    }

    if (channel <= 125) {
        err_code = nrf_esb_set_rf_channel(channel);
        if (err_code != NRF_SUCCESS) {
            printf("ERROR nrf_esb_set_rf_channel: %lu\n", err_code);
        }
    }

    if (!idle) {
        nrf_esb_flush_tx();
        nrf_esb_flush_rx();

        err_code = nrf_esb_start_rx();
        if (err_code != NRF_SUCCESS) {
            printf("ERROR nrf_esb_start_rx: %lu\n", err_code);
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

    printf("Session hop channels: ");
    for (i = 0; i < CONFIGURATOR_NUMBER_OF_HOP_CHANNELS; i++) {
        printf("%d ", session_hop_channels[i]);
    }
    printf("\n");
}


// ****************************************************************************
void timer_handler(void * context)
{
    if (connected) {
        session_hop_index = (session_hop_index + 1) % CONFIGURATOR_NUMBER_OF_HOP_CHANNELS;
        set_address_and_channel(session_address, session_hop_channels[session_hop_index]);
        app_simple_timer_start(APP_SIMPLE_TIMER_MODE_SINGLE_SHOT, timer_handler, 5000, NULL);
        printf("%lu HOP TIMER\n", milliseconds);
    }
}


// ****************************************************************************
static void send_request_to_connect()
{
    nrf_esb_payload_t tx;
    static uint8_t lfsr_offset = 0;
    static uint8_t lfsr_seed = 1;
    uint8_t offset = 0;
    uint8_t i;

    // Generate random session_address
    rand(session_address, CONFIGURATOR_ADDRESS_SIZE);

    printf("Session address: ");
    for (i = 0; i < CONFIGURATOR_ADDRESS_SIZE; i++) {
        if (i) {
            printf(":");
        }
        printf("%02x", session_address[i]);
    }
    printf("\n");

    // Generate random offset 0..255
    rand(&lfsr_offset, 1);

    // Generate seed offset 1..127
    do {
        rand(&lfsr_seed, 1);
        lfsr_seed %= 127;
    } while (lfsr_seed < 1);


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

    calculate_hop_sequence(lfsr_offset, lfsr_seed);
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
    wait_for_disconnected = true;
}


// ****************************************************************************
static void send_read_test_request()
{
    nrf_esb_payload_t tx = {
        .pipe = 0,
        .data = {
            CFG_READ,
            12, 0,
            16
        },
        .length = 4
    };

    nrf_esb_write_payload(&tx);
}


// ****************************************************************************
static void send_write_test_request()
{
    nrf_esb_payload_t tx = {
        .pipe = 0,
        .data = {
            CFG_WRITE,
            12, 0,
            'X', 'Y', 'Z'
        },
        .length = 6
    };

    nrf_esb_write_payload(&tx);
}

// ****************************************************************************
static void configurator_connected()
{
    connected = true;
    session_hop_index = 0;
    set_address_and_channel(session_address, session_hop_channels[session_hop_index]);
}


// ****************************************************************************
static void configurator_disconnected()
{
    wait_for_disconnected = false;
    connected = false;
    set_address_and_channel(configurator_address, CONFIGURATOR_CHANNEL);
}


// ****************************************************************************
static void parse_command_not_connected(const uint8_t * rx_packet, uint8_t length)
{
    if (rx_packet[0] == TX_FREE_TO_CONNECT) {
        if (length == 1) {
            configurator_connected();

            printf("%lu TX_FREE_TO_CONNECT (ack)\n", milliseconds);
            return;
        }

        // printf("TX_FREE_TO_CONNECT\n");

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
    if (wait_for_disconnected) {
        configurator_disconnected();
        printf("%lu Disconnected\n", milliseconds);
        return;
    }

    if (rx_packet[0] == TX_INFO) {
        // printf("%lu TX_INFO\n", milliseconds);
        return;
    }

    if (rx_packet[0] == TX_REQUESTED_DATA) {
        uint16_t offset;
        uint8_t count;

        if (length < 4) {
            printf("%lu TX_REQUESTED_DATA length is less than 4\n", milliseconds);
            return;
        }

        offset = (rx_packet[2] << 8) + rx_packet[1];
        count = length - 3;

        printf("%lu TX_REQUESTED_DATA o=%u, c=%d \"%s\"\n", milliseconds, offset, count, &rx_packet[3]);
        return;
    }

    if (rx_packet[0] == TX_WRITE_SUCCESSFUL) {
        uint16_t offset;
        uint8_t count;

        if (length != 4) {
            printf("%lu TX_WRITE_SUCCESSFUL length is not 4\n", milliseconds);
            return;
        }

        offset = (rx_packet[2] << 8) + rx_packet[1];
        count = rx_packet[3];

        printf("%lu TX_WRITE_SUCCESSFUL o=%u, c=%d\n", milliseconds, offset, count);
        return;
    }

    printf("CONNECTED: Unhandled packet 0x%x, length %d\n", rx_packet[0], length);
}


// ****************************************************************************
static void rf_event_handler(nrf_esb_evt_t const *event)
{
    nrf_esb_payload_t payload;

    switch (event->evt_id) {
        case NRF_ESB_EVENT_TX_SUCCESS:
            printf("%lu TX SUCCESS\n", milliseconds);
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
                    session_hop_index = (session_hop_index + 1) % CONFIGURATOR_NUMBER_OF_HOP_CHANNELS;
                    set_address_and_channel(session_address, session_hop_channels[session_hop_index]);

                    app_simple_timer_start(APP_SIMPLE_TIMER_MODE_SINGLE_SHOT, timer_handler, 7500, NULL);

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

        if (msg[0] == 'c'  &&  !connected) {
            mode_auto = false;
            send_request_to_connect();
        }
        else if (msg[0] == 'd'  &&  connected) {
            mode_auto = false;
            send_disconnect();
        }
        else if (msg[0] == 'a') {
            mode_auto = true;
        }
        else if (msg[0] == 'r'  &&  connected) {
            send_read_test_request();
        }
        else if (msg[0] == 'w'  &&  connected) {
            send_write_test_request();
        }
    }
}



// ****************************************************************************
void RF_service(void)
{
    static app_state_t state = APP_NOT_CONNECTED;
    static uint32_t timer;

    read_UART();

    if (connected) {
        if (milliseconds > (last_successful_transmission_ms + CONNECTION_TIMEOUT_MS)) {
            uuid_received = false;
            state = APP_NOT_CONNECTED;
            printf("%lu !!!!! DISCONNECTED DUE TO TIMEOUT\n", milliseconds);

            configurator_disconnected();
        }
    }

    if (!mode_auto) {
        state = APP_NOT_CONNECTED;
        return;
    }

    switch (state) {
        case APP_NOT_CONNECTED:
            if (uuid_received) {
                printf("%lu APP got UUID\n", milliseconds);
                state = APP_GOT_UUID;
                timer = milliseconds;
            }
            break;

        case APP_GOT_UUID:
            if (milliseconds > timer + 1000) {
                if (!connected) {

                printf("%lu APP Connecting\n", milliseconds);
                send_request_to_connect();
                }
                state = APP_CONNECTED;
                timer = milliseconds;
            }
            break;

        case APP_CONNECTED:
            if (milliseconds > timer + 5000) {
                if (connected) {

                printf("%lu APP Disconnecting\n", milliseconds);
                send_disconnect();
                }


                uuid_received = false;
                state = APP_NOT_CONNECTED;
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
    nrf_esb_config_t nrf_esb_config = NRF_ESB_DEFAULT_CONFIG;

    nrf_esb_config.protocol                 = NRF_ESB_PROTOCOL_ESB_DPL;
    nrf_esb_config.bitrate                  = NRF_ESB_BITRATE_2MBPS;
    nrf_esb_config.mode                     = NRF_ESB_MODE_PRX;
    nrf_esb_config.event_handler            = rf_event_handler;
    nrf_esb_config.selective_auto_ack       = false;


    app_simple_timer_init();


    err_code = nrf_drv_rng_init(NULL);
    VERIFY_SUCCESS(err_code);


    err_code = nrf_esb_init(&nrf_esb_config);
    VERIFY_SUCCESS(err_code);

    set_address_and_channel(configurator_address, CONFIGURATOR_CHANNEL);

    err_code = nrf_esb_start_rx();
    VERIFY_SUCCESS(err_code);

    return NRF_SUCCESS;
}