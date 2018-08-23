#include <stdint.h>
#include <stdio.h>
#include <string.h>

#include <libopencm3/stm32/gpio.h>
#include <libopencm3/stm32/rcc.h>
#include <libopencm3/stm32/timer.h>
#include <libopencmsis/core_cm3.h>

#include <systick.h>
#include <uart.h>
#include <watchdog.h>
#include <webusb.h>


static volatile uint8_t blink_flag;

// ****************************************************************************
static void clock_init(void)
{
    rcc_clock_setup_in_hsi_out_48mhz();

    // Enable clocks for GPIO ports
    // IMPORTANT: you can not 'or' them into one call due to bit-mangling
    rcc_periph_clock_enable(RCC_GPIOA);
    rcc_periph_clock_enable(RCC_GPIOB);
    rcc_periph_clock_enable(RCC_GPIOC);
    rcc_periph_clock_enable(RCC_AFIO);
}


// ****************************************************************************
static void led_blink(void)
{
    blink_flag = 1;
    SYSTICK_set_callback(led_blink, 500);
}


// ****************************************************************************
int main(void)
{
    clock_init();
    SYSTICK_init();
    UART_init();
    WEBUSB_init();
    WATCHDOG_start();
    printf("\n\n\n**********\nUSB dongle initialized\n");

    SYSTICK_set_callback(led_blink, 500);
    gpio_set_mode(GPIOC, GPIO_MODE_OUTPUT_2_MHZ, GPIO_CNF_OUTPUT_PUSHPULL, GPIO13);
    gpio_set(GPIOC, GPIO13);

    while (1) {
        WATCHDOG_reset();

        if (blink_flag) {
            blink_flag = 0;
            gpio_toggle(GPIOC, GPIO13);
            // printf("Tick %ld\n", milliseconds);
        }

        WEBUSB_poll();
    }

    return 0;
}
