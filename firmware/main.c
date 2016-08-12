#include <stdint.h>
#include <stdio.h>

#include <libopencm3/stm32/gpio.h>
#include <libopencm3/stm32/rcc.h>
#include <libopencm3/stm32/timer.h>
#include <libopencmsis/core_cm3.h>

#include <battery.h>
#include <config.h>
#include <configurator.h>
#include <inputs.h>
#include <led.h>
#include <mixer.h>
#include <music.h>
#include <nrf24l01p.h>
#include <persistent_storage.h>
#include <protocol_hk310.h>
#include <sound.h>
#include <spi.h>
#include <systick.h>
#include <uart.h>
#include <watchdog.h>


// ****************************************************************************
void nmi_handler(void) {
    // The NMI is triggered by the Clock Security System. We clear the CSS
    // interrupt and switch back to the internal RC oscillator

    rcc_css_int_clear();
    rcc_clock_setup_in_hsi_out_24mhz();
    SOUND_play(220, 1000, NULL);
}


// ****************************************************************************
static void clock_init(void)
{
    // Enable divide-by-0 and unaligned fault handling
    // FIXME: does not work
    SCB->CCR |= SCB_CCR_DIV_0_TRP | SCB_CCR_UNALIGN_TRP;

    // Enable the Clock Security System
    rcc_css_enable();

    // NOTE: the transmitter will not boot when the crystal is not working as
    // there is no timeout waiting for the HSE in rcc_clock_setup_in_hse_8mhz_out_24mhz().
    rcc_clock_setup_in_hse_8mhz_out_24mhz();

    // Enable clocks for GPIO port A (for GPIO_USART1_TX) and C (LED)
    // IMPORTANT: you can not 'or' them into one call due to bit-mangling
    rcc_periph_clock_enable(RCC_GPIOA);
    rcc_periph_clock_enable(RCC_GPIOB);
    rcc_periph_clock_enable(RCC_GPIOC);
    rcc_periph_clock_enable(RCC_AFIO);
}


// ****************************************************************************
static void disable_binding(void)
{
    MUSIC_play(&song_deactivate);
    PROTOCOL_HK310_disable_binding();
}


// ****************************************************************************
int main(void)
{
    uint32_t last_ms = 0;
    uint32_t seconds = 0;

    clock_init();
    LED_init();
    SYSTICK_init();
    UART_init();
    SPI_init();
    SOUND_init();
    NRF24_init();
    WATCHDOG_start();

    PERSISTENT_STORAGE_init();
    CONFIG_init();

    INPUTS_init();
    MIXER_init();
    CONFIGURATOR_init();
    PROTOCOL_HK310_init();

    printf("\n\n\n**********\nTransmitter initialized\n");

#if 1
    CONFIG_dump_javascript_information();
#endif

    LED_on();
    SOUND_play(C5, 100, NULL);
    // MUSIC_play(&song_connecting);


    PROTOCOL_HK310_enable_binding();
    if (config.tx.bind_timeout_ms) {
        SYSTICK_set_callback(disable_binding, config.tx.bind_timeout_ms);
    }


    while (1) {
        WATCHDOG_reset();

        if ((milliseconds - last_ms) > 1000) {
            BATTERY_check_level();

            if ((seconds % 5) == 0) {
                if (config.version != CONFIG_VERSION) {
                    MUSIC_play(&song_config_invalid);
                }
            }

            last_ms = milliseconds;
            ++seconds;
        }

        // INPUTS_dump_adc();
        PERSISTENT_STORAGE_background_flash_write();

        // Put the CPU to sleep until an interrupt triggers. This reduces
        // power consumption drastically.
        // Since the systick runs at 1 millisecond period, the main loop sleeps
        // for at most 1 ms.
        __WFI();
    }

    return 0;
}
