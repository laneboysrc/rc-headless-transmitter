#pragma once

#include <stdint.h>

#define HARD_LIMIT_L -18000
#define HARD_LIMIT_H 18000

typedef struct {
    int32_t ep_l;
    int32_t ep_h;
    int32_t subtrim;
    int32_t limit_l;
    int32_t limit_h;
    int32_t failsafe;
    uint8_t speed;              // limit servo speed to "degrees per 100 ms", 0 = no limit
    uint8_t invert;
} limits_t;

void LIMITS_apply(void);