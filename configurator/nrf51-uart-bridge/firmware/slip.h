#pragma once

#include <stdint.h>
#include <stdbool.h>


typedef enum {
    SLIP_IDLE = 0,
    SLIP_ESC,
    SLIP_OVERFLOW,
    SLIP_MESSAGE_RECEIVED
} slip_state_t;

typedef struct {
    uint8_t *buffer;
    uint8_t buffer_size;
    uint8_t message_size;
    slip_state_t state;
} slip_t;


void SLIP_init(slip_t *s);
bool SLIP_decode(slip_t *s, uint8_t new_input);
void SLIP_encode(const uint8_t *data, uint8_t length, int (* callback)(int));
