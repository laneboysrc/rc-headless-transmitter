#include <stdint.h>

#include <libopencm3/stm32/gpio.h>
#include <led.h>
#include <systick.h>


static uint8_t led_active;


// ****************************************************************************
// LED activity indicator
//
// Every time an activity occurs the LED flashes for a brief moment. In idle
// state the LED is on to indicate that the device is powered.
//
// The LED flashes one period before re-triggering is allowed.
//
// Note that the LED is active low.
static void led_pulse_done(void)
{
    if (gpio_get(GPIOC, GPIO13)) {
        gpio_clear(GPIOC, GPIO13);
        SYSTICK_set_callback(led_pulse_done, 40);
    }
    else {
        led_active = 0;
    }
}


// ****************************************************************************
void LED_pulse(void)
{
    if (led_active) {
        return;
    }

    led_active = 1;
    gpio_set(GPIOC, GPIO13);
    SYSTICK_set_callback(led_pulse_done, 40);
}


// ****************************************************************************
void LED_init(void)
{
    // LED off (until the first LED_pulse call)
    gpio_set_mode(GPIOC, GPIO_MODE_OUTPUT_2_MHZ, GPIO_CNF_OUTPUT_PUSHPULL, GPIO13);
    gpio_set(GPIOC, GPIO13);
}