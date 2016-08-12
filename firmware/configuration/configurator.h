#pragma once

#include <stdbool.h>
#include <stdint.h>


typedef struct {
    uint8_t address[5];
    uint8_t channel;
    uint8_t payload_size;
    uint8_t payload[32];
} configurator_packet_t;


void CONFIGURATOR_init(void);
configurator_packet_t *CONFIGURATOR_send_request(uint8_t hop_index);
bool CONFIGURATOR_event(uint8_t nrf_status);
