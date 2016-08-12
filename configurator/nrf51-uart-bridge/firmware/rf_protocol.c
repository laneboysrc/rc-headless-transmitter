#include <stdint.h>
#include <stdio.h>
#include <string.h>

#include <nrf.h>
#include <nrf_esb.h>
#include <nrf_timer.h>

#include "board.h"
#include "globals.h"


#define ADDRESS_LENGTH 5

static const uint8_t configurator_channel = 79;
static const uint8_t configurator_address[ADDRESS_LENGTH] = {0x4c, 0x42, 0x72, 0x63, 0x78};

static uint32_t last_successful_rf_ms = 0;
static nrf_esb_payload_t rx_payload;


// ****************************************************************************
static void rf_event_handler(nrf_esb_evt_t const * p_event)
{
    switch (p_event->evt_id)
    {
        case NRF_ESB_EVENT_TX_SUCCESS:
            printf("TX SUCCESS EVENT\n");
            break;

        case NRF_ESB_EVENT_TX_FAILED:
            printf("%08lu nrf_esb_tx_failed()\n", milliseconds);
            break;

        case NRF_ESB_EVENT_RX_RECEIVED:
            printf("RX RECEIVED EVENT\n");
            if (nrf_esb_read_rx_payload(&rx_payload) == NRF_SUCCESS) {
                last_successful_rf_ms = milliseconds;
                // Do something with payload
                printf("  Payload size: %d\n", rx_payload.length);
            }
            break;
    }
}

// ****************************************************************************
void init_rf(void)
{
    nrf_esb_config_t nrf_esb_config = NRF_ESB_DEFAULT_CONFIG;

    nrf_esb_config.protocol                 = NRF_ESB_PROTOCOL_ESB_DPL;
    nrf_esb_config.bitrate                  = NRF_ESB_BITRATE_2MBPS;
    nrf_esb_config.mode                     = NRF_ESB_MODE_PRX;
    nrf_esb_config.crc                      = NRF_ESB_CRC_16BIT;
    nrf_esb_config.event_handler            = rf_event_handler;
    nrf_esb_config.selective_auto_ack       = false;

    nrf_esb_init(&nrf_esb_config);
    nrf_esb_set_base_address_0(&configurator_address[1]);
    nrf_esb_set_prefixes(configurator_address, 1);
    nrf_esb_set_rf_channel(configurator_channel);

    nrf_esb_start_rx();
}


// ****************************************************************************
void service_rf_protocol(void)
{

}


// ****************************************************************************
void rf_send_packet(uint8_t *packet, uint8_t packet_length)
{
    nrf_esb_payload_t tx_payload;

    tx_payload.length = packet_length;
    tx_payload.pipe = 0;
    tx_payload.noack = 0;
    memcpy(tx_payload.data, packet, packet_length);

    nrf_esb_write_payload(&tx_payload);
}


