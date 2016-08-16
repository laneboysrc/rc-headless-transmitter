#pragma once

#include <stdbool.h>
#include <stdint.h>


typedef struct {
    uint8_t address[5];
    uint8_t channel;
    uint8_t payload_size;
    uint8_t payload[32];
    bool send_without_ack;
    bool send_another_packet;
} configurator_packet_t;

#define CONFIGURATOR_EVENT_TX_SUCCESS 0
#define CONFIGURATOR_EVENT_TIMEOUT 1
#define CONFIGURATOR_EVENT_RX 2

void CONFIGURATOR_init(void);
configurator_packet_t * CONFIGURATOR_send_request(uint8_t hop_index, uint8_t transmission_index);
void CONFIGURATOR_event(uint8_t nrf_status, const uint8_t * packet, uint8_t packet_length);
