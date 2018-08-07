#include <stdint.h>
#include <stdio.h>
#include <string.h>

#include <libopencm3/stm32/gpio.h>
#include <libopencm3/stm32/rcc.h>
#include <libopencm3/stm32/timer.h>
#include <libopencmsis/core_cm3.h>

#include <battery.h>
#include <config.h>
#include <configurator.h>
#include <inputs.h>
#include <led.h>
#include <meter.h>
#include <mixer.h>
#include <music.h>
#include <nrf24l01p.h>
#include <persistent_storage.h>
#include <sound.h>
#include <spi.h>
#include <systick.h>
#include <uart.h>
#include <watchdog.h>

#include <protocol_hk310.h>
#include <protocol_laneboysrc4ch.h>

typedef struct {
    void (*init_function)(void);
    void (*enable_binding_function)(void);
    void (*disable_binding_function)(void);
} rf_protocol_handlers_t;

static rf_protocol_handlers_t current_rf_protocol;

static const rf_protocol_handlers_t rf_protocol_handlers[] = {
    {
        .init_function = PROTOCOL_HK310_init,
        .enable_binding_function = PROTOCOL_HK310_enable_binding,
        .disable_binding_function = PROTOCOL_HK310_disable_binding,
    },
    {
        .init_function = PROTOCOL_LANEBOYSRC4CH_init,
        .enable_binding_function = PROTOCOL_LANEBOYSRC4CH_enable_binding,
        .disable_binding_function = PROTOCOL_LANEBOYSRC4CH_disable_binding,
    },
};


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
    if (current_rf_protocol.disable_binding_function) {
        current_rf_protocol.disable_binding_function();
        MUSIC_play(&song_deactivate);
    }
}


// ****************************************************************************
int main(void)
{
    uint32_t last_battery_check_ms = 0;
    uint32_t last_invalid_config_ms = 0;

    clock_init();
    LED_init();
    SYSTICK_init();
    UART_init();
    SPI_init();
    SOUND_init();
    METER_init();
    NRF24_init();
    WATCHDOG_start();

    PERSISTENT_STORAGE_init();
    CONFIG_init();

    INPUTS_init();
    MIXER_init();
    CONFIGURATOR_init();

    memcpy(&current_rf_protocol, &rf_protocol_handlers[config.model.rf_protocol_type], sizeof(rf_protocol_handlers_t));
    current_rf_protocol.init_function();

    if (current_rf_protocol.enable_binding_function) {
        current_rf_protocol.enable_binding_function();
    }

    if (config.tx.bind_timeout_ms) {
        SYSTICK_set_callback(disable_binding, config.tx.bind_timeout_ms);
    }

    printf("\n\n\n**********\nTransmitter initialized\n");

    LED_on();
    SOUND_play(C5, 100, NULL);

    while (1) {
        WATCHDOG_reset();

        // Check the battery level and update the meter every 100 ms
        if ((milliseconds - last_battery_check_ms) > 100) {
            BATTERY_check_level();
        }

        // If the configuration version is invalid play an error sound every
        // 5 seconds
        if ((milliseconds - last_invalid_config_ms) > 5000) {
            if (config.version != CONFIG_VERSION) {
                MUSIC_play(&song_config_invalid);
            }
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
