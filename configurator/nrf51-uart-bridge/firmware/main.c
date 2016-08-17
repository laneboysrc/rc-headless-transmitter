#include <stdint.h>
#include <stdbool.h>

#include <sdk_common.h>
#include <app_util_platform.h>
#include <nrf_log.h>
#include <nrf_drv_rtc.h>

#include <rf_protocol.h>

#define SYSTICK_IN_MS 10

volatile uint32_t milliseconds;


// ****************************************************************************
static void CLOCKS_init( void )
{
    // Start 16 MHz crystal oscillator
    NRF_CLOCK->EVENTS_HFCLKSTARTED = 0;
    NRF_CLOCK->TASKS_HFCLKSTART    = 1;
    while (NRF_CLOCK->EVENTS_HFCLKSTARTED == 0);

    // Start low frequency crystal oscillator for app_timer (used by the RTC)
    NRF_CLOCK->LFCLKSRC            = (CLOCK_LFCLKSRC_SRC_Xtal << CLOCK_LFCLKSRC_SRC_Pos);
    NRF_CLOCK->EVENTS_LFCLKSTARTED = 0;
    NRF_CLOCK->TASKS_LFCLKSTART    = 1;
    while (NRF_CLOCK->EVENTS_LFCLKSTARTED == 0);
}


// ****************************************************************************
static void rtc_callback(nrf_drv_rtc_int_type_t int_type)
{
    if (int_type == NRF_DRV_RTC_INT_TICK) {
        milliseconds += SYSTICK_IN_MS;
    }
}


// ****************************************************************************
// Setup the RTC to provide a TICK
static void RTC_init(void)
{
    static const nrf_drv_rtc_t rtc = NRF_DRV_RTC_INSTANCE(0);

    static const nrf_drv_rtc_config_t rtc_config = {
        .prescaler = (uint16_t)(RTC_INPUT_FREQ / RTC0_CONFIG_FREQUENCY)-1,
        .interrupt_priority = APP_IRQ_PRIORITY_HIGH,
        .tick_latency = RTC_US_TO_TICKS(NRF_MAXIMUM_LATENCY_US, RTC0_CONFIG_FREQUENCY),
        .reliable = false
    };

    //Initialize RTC instance
    nrf_drv_rtc_init(&rtc, &rtc_config, rtc_callback);

    //Enable tick event & interrupt
    nrf_drv_rtc_tick_enable(&rtc, true);

    //Power on RTC instance
    nrf_drv_rtc_enable(&rtc);
}


// ****************************************************************************
int main(void)
{
    CLOCKS_init();
    RTC_init();
    NRF_LOG_INIT();
    RF_init();

    NRF_LOG("nRF51 UART bridge running.\n");

    while (true) {
        RF_service();
        __WFE();
    }
}