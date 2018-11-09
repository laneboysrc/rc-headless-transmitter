#include <stdint.h>
#include <stdio.h>
#include <string.h>

#include <libopencm3/stm32/flash.h>
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
#include <webusb.h>

#include <protocol_hk310.h>
#include <protocol_laneboysrc4ch.h>
#include <protocol_laneboysrc8ch.h>

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
    {
        .init_function = PROTOCOL_LANEBOYSRC8CH_init,
        .enable_binding_function = PROTOCOL_LANEBOYSRC8CH_enable_binding,
        .disable_binding_function = PROTOCOL_LANEBOYSRC8CH_disable_binding,
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
static void clock_setup_in_hse_8mhz_out_48mhz(void)
{
    // Enable internal high-speed oscillator
    rcc_osc_on(RCC_HSI);
    rcc_wait_for_osc_ready(RCC_HSI);

    // Select HSI as SYSCLK source for now
    rcc_set_sysclk_source(RCC_CFGR_SW_SYSCLKSEL_HSICLK);

    // Enable external high-speed oscillator, running at 8MHz
    rcc_osc_on(RCC_HSE);
    rcc_wait_for_osc_ready(RCC_HSE);
    rcc_set_sysclk_source(RCC_CFGR_SW_SYSCLKSEL_HSECLK);

    // Set prescalers for AHB, ADC, ABP1, ABP2 and USB
    rcc_set_hpre(RCC_CFGR_HPRE_SYSCLK_NODIV);    /* Set. 48MHz Max. 72MHz */
    rcc_set_adcpre(RCC_CFGR_ADCPRE_PCLK2_DIV4);  /* Set. 12MHz Max. 14MHz */
    rcc_set_ppre1(RCC_CFGR_PPRE1_HCLK_DIV2);     /* Set. 24MHz Max. 36MHz */
    rcc_set_ppre2(RCC_CFGR_PPRE2_HCLK_DIV2);     /* Set. 24MHz Max. 72MHz */
    rcc_set_usbpre(RCC_CFGR_USBPRE_PLL_CLK_NODIV);  /* Set 48MHz Max. 48MHz */

    // Sysclk runs with 48 MHz, so we need 1 waitstate.
    flash_set_ws(FLASH_ACR_LATENCY_1WS);

    // Set the PLL multiplication factor to 6.
    // 8MHz (external) * 6 (multiplier) = 48MHz
    rcc_set_pll_multiplication_factor(RCC_CFGR_PLLMUL_PLL_CLK_MUL6);

    // Select HSE as PLL source
    rcc_set_pll_source(RCC_CFGR_PLLSRC_HSE_CLK);

    // External frequency undivided before entering PLL (only valid/needed for HSE)
    rcc_set_pllxtpre(RCC_CFGR_PLLXTPRE_HSE_CLK);

    // Enable PLL oscillator and wait for it to stabilize
    rcc_osc_on(RCC_PLL);
    rcc_wait_for_osc_ready(RCC_PLL);

    // Select PLL as SYSCLK source
    rcc_set_sysclk_source(RCC_CFGR_SW_SYSCLKSEL_PLLCLK);

    // Set the peripheral clock frequencies used
    rcc_ahb_frequency = 48000000;
    rcc_apb1_frequency = 24000000;
    rcc_apb2_frequency = 24000000;
}


// ****************************************************************************
static void clock_init(void)
{
    // Enable the Clock Security System
    rcc_css_enable();

    // NOTE: the transmitter will not boot when the crystal is not working as
    // there is no timeout waiting for the HSE in rcc_clock_setup_in_hse_8mhz_out_24mhz().
    // rcc_clock_setup_in_hse_8mhz_out_24mhz();
    // rcc_clock_setup_in_hsi_out_48mhz();
    clock_setup_in_hse_8mhz_out_48mhz();

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
    WEBUSB_init();

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

        WEBUSB_poll();

        // Put the CPU to sleep until an interrupt triggers. This reduces
        // power consumption drastically.
        // Since the systick runs at 1 millisecond period, the main loop sleeps
        // for at most 1 ms.
        __WFI();
    }

    return 0;
}
