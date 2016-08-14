#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

#include <config.h>
#include <configurator.h>
#include <inputs.h>
#include <nrf24l01p.h>
#include <protocol_hk310.h>


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

#define CONFIGURATOR_CHANNEL 79

static bool connected = false;
static configurator_packet_t packet;

static const uint8_t configurator_address[] = {0x4c, 0x42, 0x72, 0x63, 0x78};


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
    memcpy(packet.address, config.tx.uuid, 5);
    packet.channel = CONFIGURATOR_CHANNEL;
    packet.payload[0] = TX_FREE_TO_CONNECT;
    packet.payload_size = 1;
    packet.send_without_ack = false;
    packet.send_another_packet = false;

    return &packet;
}


// ****************************************************************************
configurator_packet_t * CONFIGURATOR_send_request(uint8_t hop_index, uint8_t transmission_index)
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

    return NULL;
}



// ****************************************************************************
void CONFIGURATOR_event(uint8_t event, uint8_t *rx_packet, uint8_t length)
{
    (void) rx_packet;

    switch (event) {
        case CONFIGURATOR_EVENT_TX_SUCCESS:
            printf("TX SUCCESS\n");
            break;

        case CONFIGURATOR_EVENT_TIMEOUT:
            printf("TIMEOUT \n");
            break;

        case CONFIGURATOR_EVENT_RX:
            printf("RX %d\n", length);
            break;

        default:
            break;
    }
}


// ****************************************************************************
void CONFIGURATOR_init(void)
{

}