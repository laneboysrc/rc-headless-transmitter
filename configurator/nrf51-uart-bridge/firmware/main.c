#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

#include <nrf.h>
#include <nrf_gpio.h>
#include <nrf_drv_config.h>
#include <nrf_drv_rtc.h>
#include <nrf_drv_clock.h>
#include <app_uart.h>

#include "board.h"
#include "globals.h"
#include "rf_protocol.h"


// ****************************************************************************
#define UART_TX_BUFFER_SIZE 128
#define UART_RX_BUFFER_SIZE 16


// ****************************************************************************
GLOBAL_FLAGS_T global_flags;
volatile uint32_t milliseconds;

static volatile uint8_t systick_count;


// ****************************************************************************
// ****************************************************************************
// ****************************************************************************
// Callbacks required by the NRF SDK

// ****************************************************************************
static void uart_callback(app_uart_evt_t *p_event)
{
    if (p_event->evt_type == APP_UART_TX_EMPTY) {
        // led_off(LED_4);
    }
}


// ****************************************************************************
static void rtc_callback(nrf_drv_rtc_int_type_t int_type)
{
    if (int_type == NRF_DRV_RTC_INT_TICK) {
        ++systick_count;
        milliseconds += SYSTICK_IN_MS;
    }
}


// END of callbacks required by the NRF SDK
// ****************************************************************************
// ****************************************************************************
// ****************************************************************************


// ****************************************************************************
static void init_hardware(void)
{

}


// ****************************************************************************
// Start the internal LFCLK XTAL oscillator
static void init_lfclk(void)
{
    nrf_drv_clock_init();
    nrf_drv_clock_lfclk_request(NULL);
}


// ****************************************************************************
// Setup the RTC to provide a TICK
static void init_rtc(void)
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
static void service_systick(void)
{
    static uint32_t prescaler_for_seconds;

    global_flags.systick = 0;
    global_flags.fourty_milliseconds_tick = 0;
    global_flags.third_second_tick = 0;
    global_flags.half_second_tick = 0;
    global_flags.seconds_tick = 0;

    if (!systick_count) {
        return;
    }

    --systick_count;
    global_flags.systick = 1;

    ++prescaler_for_seconds;
    if ((prescaler_for_seconds & 0x03) == 0) {
        global_flags.fourty_milliseconds_tick = 1;
    }

    if (prescaler_for_seconds == (333 / SYSTICK_IN_MS)) {
        global_flags.third_second_tick = 1;
    }
    else if (prescaler_for_seconds == (500 / SYSTICK_IN_MS)) {
        global_flags.half_second_tick = 1;
    }
    else if (prescaler_for_seconds == (666 / SYSTICK_IN_MS)) {
        global_flags.third_second_tick = 1;
    }
    else if (prescaler_for_seconds >= (1000 / SYSTICK_IN_MS)) {
        prescaler_for_seconds = 0;
        global_flags.seconds_tick = 1;
        global_flags.third_second_tick = 1;
        global_flags.half_second_tick = 1;
    }
}


// ****************************************************************************
static void init_uart(void)
{
    static uint8_t tx_buffer[UART_TX_BUFFER_SIZE];
    static uint8_t rx_buffer[UART_RX_BUFFER_SIZE];

    static const app_uart_comm_params_t uart_params = {
        .rx_pin_no = RX_PIN_NUMBER,
        .tx_pin_no = TX_PIN_NUMBER,
        // .rts_pin_no = RTS_PIN_NUMBER,
        // .cts_pin_no = CTS_PIN_NUMBER,
        .flow_control = APP_UART_FLOW_CONTROL_DISABLED,
        .use_parity = false,
        .baud_rate = UART_BAUDRATE_BAUDRATE_Baud230400
    };

    // Can not be const as it would conflict with the function prototype
    static app_uart_buffers_t uart_buffers = {
        .tx_buf = tx_buffer,
        .rx_buf = rx_buffer,
        .tx_buf_size = sizeof(tx_buffer),
        .rx_buf_size = sizeof(rx_buffer)
    };

    app_uart_init(&uart_params, &uart_buffers, uart_callback, APP_IRQ_PRIORITY_LOW);
}


// ****************************************************************************
int main(void)
{
    // setvbuf(stdout, NULL, _IONBF, 0);
    init_hardware();
    init_lfclk();
    init_rtc();
    init_uart();
    printf("\n");

    while (milliseconds < 100);

    printf("\n===\n");

    init_rf();

    printf("Resuming normal operation.\n");

    while (1) {
        service_systick();
        service_rf_protocol();

        // Put the CPU in a low-power state until an event occurs
        __SEV();
        __WFE();
        __WFE();
    }
}


