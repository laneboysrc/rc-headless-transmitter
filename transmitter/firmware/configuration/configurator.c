#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

#include <config.h>
#include <configurator.h>
#include <inputs.h>
#include <music.h>
#include <systick.h>

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


static const uint8_t configurator_address[] = {0x4c, 0x42, 0x72, 0x63, 0x78};

static bool connected = false;
static configurator_transport_t connected_transport = TRANSPORT_NONE;
static configurator_packet_t packet;

static bool send_response = false;
static configurator_packet_t response_packet;

static uint32_t last_successful_transmission_ms;

static uint8_t session_address[CONFIGURATOR_ADDRESS_SIZE];
static uint8_t session_hop_channels[CONFIGURATOR_NUMBER_OF_HOP_CHANNELS];
static uint8_t session_hop_index;

static bool configuration_changed = false;

// ****************************************************************************
static configurator_packet_t * make_free_to_connect_packet(void)
{
    uint8_t offset;
    uint16_t battery_voltage;

    battery_voltage = INPUTS_get_battery_voltage();

    memcpy(packet.address, configurator_address, sizeof(configurator_address));
    packet.channel = CONFIGURATOR_CHANNEL;

    offset = 0;
    packet.payload[offset] = TX_FREE_TO_CONNECT;
    offset += 1;
    memcpy(&packet.payload[offset], &config.tx.uuid, sizeof(config.tx.uuid));
    offset += sizeof(config.tx.uuid);
    memcpy(&packet.payload[offset], &config.tx.name, sizeof(config.tx.name));
    offset += sizeof(config.tx.name);
    memcpy(&packet.payload[offset], &battery_voltage, 2);
    offset += 2;

    packet.payload_size = offset;

    packet.send_without_ack = true;
    packet.send_another_packet = true;

    return &packet;
}


// ****************************************************************************
static configurator_packet_t * make_connect_response_packet(void)
{
    memcpy(packet.address, config.tx.uuid, CONFIGURATOR_ADDRESS_SIZE);
    packet.channel = CONFIGURATOR_CHANNEL;
    packet.payload[0] = TX_FREE_TO_CONNECT;
    packet.payload_size = 1;
    packet.send_without_ack = false;
    packet.send_another_packet = false;

    return &packet;
}


// ****************************************************************************
static configurator_packet_t * make_info_packet(void)
{
    static uint8_t frame_count = 0;
    uint8_t i;
    uint8_t start_adc_channel;

    memcpy(packet.address, session_address, CONFIGURATOR_ADDRESS_SIZE);
    packet.channel = session_hop_channels[session_hop_index];
    packet.payload[0] = TX_INFO;

    // FIXME: send all items that are in use by the transmitter
    switch (frame_count) {
        case 0:
        default:
            frame_count = 1;
            start_adc_channel = 1;
            break;

        case 1:
            frame_count = 0;
            start_adc_channel = 5;
            break;
    }

    for (i = 0; i < 4; i++) {
        uint16_t label = ADC0_RAW + start_adc_channel + i;
        int32_t value = INPUTS_get_raw_adc_value(start_adc_channel + i);
        uint8_t offset = 1 + (i * 6);

        packet.payload[offset + 0] = label >> 0;
        packet.payload[offset + 1] = label >> 8;

        packet.payload[offset + 2] = value >> 0;
        packet.payload[offset + 3] = value >> 8;
        packet.payload[offset + 4] = value >> 16;
        packet.payload[offset + 5] = value >> 24;
    }

    packet.payload_size = 25;

    packet.send_without_ack = false;
    packet.send_another_packet = false;

    return &packet;
}


// ****************************************************************************
static configurator_packet_t * make_response_packet(void)
{
    send_response = false;

    memcpy(response_packet.address, session_address, CONFIGURATOR_ADDRESS_SIZE);
    response_packet.channel = session_hop_channels[session_hop_index];
    response_packet.send_without_ack = false;
    response_packet.send_another_packet = false;

    return &response_packet;
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

            // FIXME: test only
            // session_hop_channels[i] = 79;

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
static void parse_command_not_connected(const uint8_t * rx_packet, uint8_t length) {
    if (rx_packet[0] == CFG_REQUEST_TO_CONNECT) {
        uint8_t offset;
        uint8_t seed;
        int i;

        if (length != 18) {
            printf("CFG_REQUEST_TO_CONNECT packet length is not 18\n");
            return;
        }

        if (memcmp(&rx_packet[1], config.tx.uuid, sizeof(config.tx.uuid)) != 0) {
            printf("CFG_REQUEST_TO_CONNECT UUID mismatch\n");
            return;
        }

        // if (memcmp(&rx_packet[1+8+5], &config.tx.passphrase, sizeof(config.tx.passphrase)) != 0) {
        //     printf("CFG_REQUEST_TO_CONNECT passphrase mismatch\n");
        //     return;
        // }

        offset = rx_packet[1+8+5+2];
        seed = rx_packet[1+8+5+2+1];
        if (seed < 1  ||  seed > 127) {
            printf("CFG_REQUEST_TO_CONNECT invalid seed\n");
            return;
        }

        printf("CFG_REQUEST_TO_CONNECT\n");

        memcpy(session_address, &rx_packet[1+8], sizeof(session_address));
        printf("Session address: ");
        for (i = 0; i < CONFIGURATOR_ADDRESS_SIZE; i++) {
            if (i) {
                printf(":");
            }
            printf("%02x", session_address[i]);
        }
        printf("\n");

        calculate_hop_sequence(offset, seed);
        session_hop_index = 0;

        connected = true;
        MUSIC_play(&song_connecting);
        configuration_changed = false;
        return;
    }

    printf("NOT_CONNECTED: Unhandled packet 0x%x, length %d\n", rx_packet[0], length);
}


// ****************************************************************************
static void handle_CFG_READ(const uint8_t * rx_packet, uint8_t length) {
    uint16_t offset;
    uint8_t count;

    if (length != 4) {
        printf("CFG_READ packet length is not 4\n");
        return;
    }

    offset = (rx_packet[2] << 8) + rx_packet[1];
    count = rx_packet[3];

    if (count < 1  ||  count > 29) {
        printf("CFG_READ count must be between 1 and 29\n");
        return;
    }

    if ((offset + count) > sizeof(config)) {
        printf("CFG_READ request out of config area\n");
        return;
    }

    response_packet.payload[0] = TX_REQUESTED_DATA;
    response_packet.payload[1] = rx_packet[1];
    response_packet.payload[2] = rx_packet[2];
    memcpy(&response_packet.payload[3], (uint8_t *)&config + offset, count);

    response_packet.payload_size = 3 + count;
    send_response = true;

    printf("CFG_READ o=%u, c=%u\n", offset, count);
}


// ****************************************************************************
static void handle_CFG_WRITE(const uint8_t * rx_packet, uint8_t length) {
    uint16_t offset;
    uint8_t count;

    if (length < 4) {
        printf("CFG_WRITE packet length is less than 4\n");
        return;
    }

    offset = (rx_packet[2] << 8) + rx_packet[1];
    count = length - 3;

    if ((offset + count) > sizeof(config)) {
        printf("CFG_WRITE request out of config area\n");
        return;
    }

    memcpy((uint8_t *)&config + offset, &rx_packet[3], count);

    response_packet.payload[0] = TX_WRITE_SUCCESSFUL;
    response_packet.payload[1] = rx_packet[1];
    response_packet.payload[2] = rx_packet[2];
    response_packet.payload[3] = count;
    response_packet.payload_size = 4;
    send_response = true;

    configuration_changed = true;

    printf("CFG_WRITE o=%u, c=%u\n", offset, count);
}


// ****************************************************************************
static void handle_CFG_COPY(const uint8_t * rx_packet, uint8_t length) {
    uint16_t src;
    uint16_t dst;
    uint16_t count;
    int i;
    uint8_t *c = (uint8_t *)&config ;

    if (length != 7) {
        printf("CFG_COPY packet length is not 4\n");
        return;
    }

    src = (rx_packet[2] << 8) + rx_packet[1];
    dst = (rx_packet[4] << 8) + rx_packet[3];
    count = (rx_packet[6] << 8) + rx_packet[5];

    if ((src + count) > sizeof(config)) {
        printf("CFG_COPY Request source offset out of config area\n");
        return;
    }

    if ((dst + count) > sizeof(config)) {
        printf("CFG_COPY Request destination offset out of config area\n");
        return;
    }

    if (src > dst) {
        for (i = 0; i < count; i++) {
            c[dst + i] = c[src + i];
        }
    }
    else if (src < dst) {
        for (i = count - 1; i >= 0; i--) {
            c[dst + i] = c[src + i];
        }
    }

    response_packet.payload[0] = TX_COPY_SUCCESSFUL;
    memcpy(&response_packet.payload[1], &rx_packet[1], 6);
    response_packet.payload_size = 7;
    send_response = true;
    printf("CFG_COPY src=%u dst=%u c=%u\n", src, dst, count);
}


// ****************************************************************************
static void parse_command_connected(const uint8_t * rx_packet, uint8_t length) {
    if (rx_packet[0] == CFG_DISCONNECT) {
        if (length != 1) {
            printf("CFG_DISCONNECT packet length is not 1\n");
            return;
        }

        MUSIC_play(&song_disconnecting);
        connected = false;
        connected_transport = TRANSPORT_NONE;
        printf("CFG_DISCONNECT\n");

        if (configuration_changed) {
            configuration_changed = false;
            CONFIG_save();
        }
        return;
    }

    if (rx_packet[0] == CFG_READ) {
        handle_CFG_READ(rx_packet, length);
        return;
    }

    if (rx_packet[0] == CFG_WRITE) {
        handle_CFG_WRITE(rx_packet, length);
        return;
    }

    if (rx_packet[0] == CFG_COPY) {
        handle_CFG_COPY(rx_packet, length);
        return;
    }

    printf("CONNECTED: Unhandled packet 0x%x, length %d\n", rx_packet[0], length);
}


// ****************************************************************************
configurator_packet_t * CONFIGURATOR_send_request(configurator_transport_t transport, uint8_t hop_index, uint8_t transmission_index)
{
    // If we are not connected we send configurator packets only on the first
    // hop channel (= every 100 ms)
    if (!connected) {
        if (hop_index != 0) {
            return NULL;
        }

        switch (transmission_index) {
            case 1:
                return make_free_to_connect_packet();

            case 2:
            default:
                return make_connect_response_packet();
        }
    }
    else {
        configurator_packet_t *p;

        if (connected_transport != transport) {
            return NULL;
        }

        if (send_response) {
            p = make_response_packet();
        }
        else {
            p = make_info_packet();
        }
        session_hop_index = (session_hop_index + 1) % CONFIGURATOR_NUMBER_OF_HOP_CHANNELS;
        return p;
    }
}


// ****************************************************************************
void CONFIGURATOR_event(configurator_transport_t transport, uint8_t event, const uint8_t * rx_packet, uint8_t length)
{
    (void) transport;

    switch (event) {
        case CONFIGURATOR_EVENT_TX_SUCCESS:
            // printf("TX SUCCESS\n");
            last_successful_transmission_ms = milliseconds;
            break;

        case CONFIGURATOR_EVENT_TIMEOUT:
            // printf("TIMEOUT \n");
            if (connected) {
                printf("TIMEOUT \n");
                if (milliseconds > last_successful_transmission_ms + CONNECTION_TIMEOUT_MS) {
                    MUSIC_play(&song_disconnecting);
                    connected = false;
                    connected_transport = TRANSPORT_NONE;
                    printf("%lu !!!!! DISCONNECTED DUE TO TIMEOUT\n", milliseconds);
                }
            }
            break;

        case CONFIGURATOR_EVENT_RX:
            // printf("RX %d\n", length);
            printf("%lu ", milliseconds);
            if (connected) {
                if (transport == connected_transport) {
                    parse_command_connected(rx_packet, length);
                }
            }
            else {
                parse_command_not_connected(rx_packet, length);
                if (connected) {
                    connected_transport = transport;
                }
            }
            break;

        default:
            break;
    }
}


// ****************************************************************************
bool CONFIGURATOR_is_connected(configurator_transport_t transport)
{
    if (transport == TRANSPORT_ANY) {
        return connected;
    }

    if (connected && (connected_transport == transport)) {
        return true;
    }

    return false;
}


// ****************************************************************************
void CONFIGURATOR_init(void)
{

}