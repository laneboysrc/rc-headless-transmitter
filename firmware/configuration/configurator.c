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

static const uint8_t configurator_address[ADDRESS_SIZE] = {0x4c, 0x42, 0x72, 0x63, 0x78};


// ****************************************************************************
static void make_free_to_connect_packet(void)
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
    puts("CONF: FTC\n");
}


// ****************************************************************************
configurator_packet_t *CONFIGURATOR_send_request(uint8_t hop_index)
{
    // If we are not connected we send configurator packets only on the first
    // hop channel (= every 100 ms)
    if (!connected) {
        if (hop_index != 0) {
            return NULL;
        }
        make_free_to_connect_packet();
        return &packet;
    }

    return NULL;
}


// ****************************************************************************
bool CONFIGURATOR_event(uint8_t nrf_status)
{
    puts("CONF: ");
    if (nrf_status & NRF24_TX_DS) {
        puts("TX_DS ");
    }
    if (nrf_status & NRF24_RX_RD) {
        puts("RX_RD ");
        NRF24_flush_rx_fifo();
    }
    if (nrf_status & NRF24_MAX_RT) {
        puts("MAX_RT ");
    }
    puts("\n");

    return true;
}


// ****************************************************************************
void CONFIGURATOR_init(void)
{

}