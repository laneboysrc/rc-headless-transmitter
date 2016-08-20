#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>

#include <sdk_common.h>
#include <nrf_drv_rtc.h>
#include <nrf_drv_uart.h>
#include <app_uart.h>

#include <rf_protocol.h>


volatile uint32_t milliseconds;


// ****************************************************************************
static void rtc_callback(nrf_drv_rtc_int_type_t int_type)
{
    // Since we only enable the tick callback we don't have to test int_type
    milliseconds += 1000 / RTC0_CONFIG_FREQUENCY;
}


// ****************************************************************************
static void uart_error_handler(app_uart_evt_t * p_app_uart_event)
{
    // Nothing to do
}


// ****************************************************************************
static void CLOCKS_init( void )
{
    // Start the 16 MHz crystal oscillator
    NRF_CLOCK->EVENTS_HFCLKSTARTED = 0;
    NRF_CLOCK->TASKS_HFCLKSTART = 1;
    while (! NRF_CLOCK->EVENTS_HFCLKSTARTED);

    // Start low frequency crystal oscillator (used by the RTC)
    NRF_CLOCK->LFCLKSRC = (CLOCK_LFCLKSRC_SRC_Xtal << CLOCK_LFCLKSRC_SRC_Pos);
    NRF_CLOCK->EVENTS_LFCLKSTARTED = 0;
    NRF_CLOCK->TASKS_LFCLKSTART = 1;
    while (! NRF_CLOCK->EVENTS_LFCLKSTARTED);
}


// ****************************************************************************
static void UART_init(void)
{
    uint32_t err_code;
    const app_uart_comm_params_t comm_params = {
        .rx_pin_no = UART0_CONFIG_PSEL_RXD,
        .tx_pin_no = UART0_CONFIG_PSEL_TXD,
        .rts_pin_no = UART0_CONFIG_PSEL_RTS,
        .cts_pin_no = UART0_CONFIG_PSEL_CTS,
        .flow_control = UART0_CONFIG_HWFC,
        .use_parity = UART0_CONFIG_PARITY,
        .baud_rate = UART0_CONFIG_BAUDRATE
    };

    APP_UART_FIFO_INIT(&comm_params, UART0_CONFIG_RX_BUFFER_SIZE,
        UART0_CONFIG_TX_BUFFER_SIZE, uart_error_handler, APP_IRQ_PRIORITY_LOW,
        err_code);

    (void) err_code;
}


// ****************************************************************************
// Setup the RTC to provide a TICK
static void RTC_init(void)
{
    static const nrf_drv_rtc_t rtc = NRF_DRV_RTC_INSTANCE(0);

    // Initialize and start RTC0, using the defaults from nrf_drv_config.h
    nrf_drv_rtc_init(&rtc, NULL, rtc_callback);
    nrf_drv_rtc_tick_enable(&rtc, true);
    nrf_drv_rtc_enable(&rtc);
}


// ****************************************************************************
int main(void)
{
    CLOCKS_init();
    RTC_init();
    UART_init();
    RF_init();
    printf("\n\n\nnRF51 UART bridge running\n");

    while (true) {
        RF_service();

        __WFE();
    }
}