#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

#include <libopencm3/stm32/gpio.h>
#include <libopencm3/stm32/rcc.h>
#include <libopencmsis/core_cm3.h>

#include <systick.h>


// ****************************************************************************
#define MAX_SYSTICK_CALLBACKS 5


typedef struct {
    systick_callback callback;
    uint32_t trigger_ms;
} systick_callback_t;


volatile uint32_t milliseconds;

static systick_callback_t callbacks[MAX_SYSTICK_CALLBACKS];


// ****************************************************************************
static systick_callback_t *find_callback(systick_callback cb)
{
    for (size_t i = 0; i < MAX_SYSTICK_CALLBACKS; i++) {
        if (callbacks[i].callback == cb) {
            return &callbacks[i];
        }
    }

    return NULL;
}


// ****************************************************************************
static systick_callback_t *get_emtpy_callback_slot(void)
{
    return find_callback(NULL);
}


// ****************************************************************************
void SYSTICK_init(void)
{
    uint32_t reload_value;

    // 24 MHz / 8 => 3000000 counts per second
    systick_set_clocksource(STK_CSR_CLKSOURCE_AHB_DIV8);

    // SysTick interrupt every 1 ms
    reload_value = (rcc_ahb_frequency / 8 / 1000) - 1;
    systick_set_reload(reload_value);

    nvic_set_priority(NVIC_SYSTICK_IRQ, 0x0);
    systick_interrupt_enable();
    systick_counter_enable();
}


// ****************************************************************************
void SYSTICK_set_callback(systick_callback cb, uint32_t duration_ms)
{
    systick_callback_t *slot;

    if (duration_ms == 0) {
        duration_ms = 1;
    }

    slot = find_callback(cb);
    if (slot == NULL) {
        slot = get_emtpy_callback_slot();
        if (slot == NULL) {
            printf("ALERT: MAX_SYSTICK_CALLBACKS needs to be increased!\n");
            return;
        }
    }

    cm_disable_interrupts();
    slot->callback = cb;
    slot->trigger_ms = milliseconds + duration_ms;
    cm_enable_interrupts();
}


// ****************************************************************************
void SYSTICK_clear_callback(systick_callback cb)
{
    systick_callback_t *slot;

    slot = find_callback(cb);
    if (slot) {
        cm_disable_interrupts();
        slot->callback = NULL;
        cm_enable_interrupts();
    }
}


// ****************************************************************************
void sys_tick_handler(void)
{
    ++milliseconds;

    for (size_t i = 0; i < MAX_SYSTICK_CALLBACKS; i++) {
        if (callbacks[i].callback != NULL  &&
            callbacks[i].trigger_ms == milliseconds ) {

            systick_callback cb = callbacks[i].callback;
            callbacks[i].callback = NULL;
            (*cb)();
        }
    }
}