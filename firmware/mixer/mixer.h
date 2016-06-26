#pragma once

#include <stdint.h>

#include <curves.h>
#include <inputs.h>


#define MAX_MIXER_UNITS 100

typedef enum {
    OP_REPLACE = 0,
    OP_ADD,
    OP_MULTIPLY,
    OP_MIN,
    OP_MAX
} operation_type_t;

typedef struct  {
    curve_t curve;
    label_t src;
    label_t dst;
    uint8_t sw;
    int8_t scalar;
    int8_t offset;
    uint8_t tag;
    operation_type_t op;
    unsigned invert_source : 1;
    unsigned apply_trim : 1;
} mixer_unit_t;


void MIXER_init(void);
void MIXER_evaluate(void);
