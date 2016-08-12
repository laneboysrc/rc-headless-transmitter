#pragma once

#include <stdint.h>

void init_rf(void);
void service_rf_protocol(void);
void rf_send_packet(uint8_t *packet, uint8_t packet_length);
