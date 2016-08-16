#include <stdint.h>
#include <stdbool.h>

#include <sdk_common.h>
#include <app_util_platform.h>
#include <nrf_log.h>
#include <nrf_esb.h>
#include <nrf_drv_rtc.h>

#define SYSTICK_IN_MS 10

#define CHANNEL 79
static const uint8_t address[] = {0x4c, 0x42, 0x72, 0x63, 0x78};

volatile uint32_t milliseconds;

static nrf_esb_payload_t tx = {
    .pipe = 0,
    .data = {
        0x31,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x12, 0x23, 0x34, 0x45, 0x56,
        0xd2, 0x04,
        0x00, 0x01
    },
    .length = 18
};


static void send_packet(const uint8_t * packet)
{
    nrf_esb_write_payload(&tx);
}

static void parse_packet(const uint8_t * packet, uint8_t packet_length)
{
    static uint32_t prescaler = 0;

    if (packet[0] == 0x30  &&  packet_length == 27) {
        NRF_LOG_PRINTF("FREE_TO_CONNECT received!\n");


        memcpy(&tx.data[1], &packet[1], 8);
        memcpy(&tx.data[1+8], &packet[1], 5);

        // nrf_esb_disable();
        nrf_esb_stop_rx();
        nrf_esb_set_base_address_0(&packet[2]);
        nrf_esb_set_prefixes(&packet[1], 1);
        nrf_esb_start_rx();

        prescaler = 0;
    }

    if (packet[0] == 0x30  &&  packet_length == 1) {
        NRF_LOG_PRINTF("FREE_TO_CONNECT POLL received!\n");
        if (prescaler == 50) {
            send_packet(packet);
        }
        ++prescaler;
    }
}

static void rf_event_handler(nrf_esb_evt_t const *event)
{
    nrf_esb_payload_t rx_payload;

    switch (event->evt_id) {
        case NRF_ESB_EVENT_TX_SUCCESS:
            NRF_LOG_PRINTF("%lu TX SUCCESS\n", milliseconds);
            nrf_esb_flush_tx();
            break;

        case NRF_ESB_EVENT_TX_FAILED:
            NRF_LOG_PRINTF("%lu TX FAILED\n", milliseconds);
            nrf_esb_flush_tx();
            break;

        case NRF_ESB_EVENT_RX_RECEIVED:
            if (nrf_esb_read_rx_payload(&rx_payload) == NRF_SUCCESS) {
                int i;

                NRF_LOG_PRINTF("%lu RX (%d) ", milliseconds, rx_payload.length);
                for  (i = 0; i < rx_payload.length; i++) {
                    NRF_LOG_PRINTF("%02X ", rx_payload.data[i]);
                }
                NRF_LOG_PRINTF("\n");

                parse_packet(rx_payload.data, rx_payload.length);
            }
            break;
    }
}


static void CLOCKS_init( void )
{
    /* Start 16 MHz crystal oscillator */
    NRF_CLOCK->EVENTS_HFCLKSTARTED = 0;
    NRF_CLOCK->TASKS_HFCLKSTART    = 1;

    /* Wait for the external oscillator to start up */
    while (NRF_CLOCK->EVENTS_HFCLKSTARTED == 0);

    /* Start low frequency crystal oscillator for app_timer(used by bsp)*/
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


static uint32_t RF_init( void )
{
    uint32_t err_code;

    nrf_esb_config_t nrf_esb_config         = NRF_ESB_DEFAULT_CONFIG;
    nrf_esb_config.protocol                 = NRF_ESB_PROTOCOL_ESB_DPL;
    nrf_esb_config.bitrate                  = NRF_ESB_BITRATE_2MBPS;
    nrf_esb_config.mode                     = NRF_ESB_MODE_PRX;
    nrf_esb_config.event_handler            = rf_event_handler;
    nrf_esb_config.selective_auto_ack       = false;

    err_code = nrf_esb_init(&nrf_esb_config);
    VERIFY_SUCCESS(err_code);

    err_code = nrf_esb_set_base_address_0(&address[1]);
    VERIFY_SUCCESS(err_code);

    err_code = nrf_esb_set_prefixes(address, 1);
    VERIFY_SUCCESS(err_code);

    err_code = nrf_esb_set_rf_channel(CHANNEL);
    VERIFY_SUCCESS(err_code);

    err_code = nrf_esb_start_rx();
    VERIFY_SUCCESS(err_code);

    return NRF_SUCCESS;
}



int main(void)
{
    CLOCKS_init();
    RTC_init();
    NRF_LOG_INIT();
    RF_init();

    NRF_LOG("Enhanced ShockBurst Receiver Example running.\n");

    while (true) {
        __WFE();
    }
}