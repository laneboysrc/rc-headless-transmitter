#pragma once

// ****************************************************************************
#define SYSTICK_IN_MS 10

#define PIPE_NUMBER 0

// ****************************************************************************
typedef struct {
    unsigned int systick : 1;                   // Set for one mainloop every 10 ms
    unsigned int fourty_milliseconds_tick : 1;  // Set for one mainloop every 40 ms
    unsigned int third_second_tick : 1;         // Set for one mainloop every 333 ms
    unsigned int half_second_tick : 1;          // Set for one mainloop every 500 ms
    unsigned int seconds_tick : 1;              // Set for one mainloop every second
} GLOBAL_FLAGS_T;


// ****************************************************************************
extern GLOBAL_FLAGS_T global_flags;
extern volatile uint32_t milliseconds;
