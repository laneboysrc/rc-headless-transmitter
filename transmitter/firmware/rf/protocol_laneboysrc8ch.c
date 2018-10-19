
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>

#include <channels.h>
#include <config.h>
#include <configurator.h>
#include <nrf24l01p.h>
#include <protocol_hk310.h>
#include <protocol_laneboysrc8ch.h>
#include <systick.h>

/* ****************************************************************************

LANE Boys RC 8-channel protocol using nRF24L01+

nRF24 configuration
-------------------
- Enhanced Shockburst with DPL (dynamic payload length)
- 5 byte address size
- 2 byte CRC
- Uni-directional data transfer (transmitter sends no-ack packets)
- Transmitter sends a packet train consisting of three packets every 5 ms: two stick (or failsafe) packets, one bind packet


Stick and Failsafe packets:
---------------------------
- 250 KBps
- Cycles through 20 hop channels at each packet train (= changes channel every 5 ms, repeats after 100 ms)
- Failsafe packets are sent every 17th packet train
- 13 bytes of data, unsigned 12 bits per channel, corresponding to 476..1500..2523 us (500 ns resolution)

    id l1 l2 l3 l4 l5 l6 l7 l8 h1 h3 h5 h7

id                Packet ID: 0x57 for stick packet, 0xac for failsafe packet
l[1-8]            Lower 8 bits of the 12 bit channel data for CH1..CH8
h1..h7            Higher 4 bits of the 12 bit channel data.
                  CH1 = (h1 & 0x0f) << 8 + l1
                  CH2 = (h1 & 0xf0) << 4 + l2
                  CH3 = (h3 & 0x0f) << 8 + l3
                  CH4 = (h3 & 0xf0) << 4 + l4
                  ...

Bind packets:
-------------
- Fixed channel 81 for bind packets
- 2 MBps (to keep air-time to a minimum)
- 27 bytes of data

    ac 57 a1 a2 a3 a4 a5 ha hb hc hd he hf hg hh hi hj hk hl hm hn ho hp hq hr hs ht

ac 57           Packet ID for bind packet
a[1-5]          5 address bytes (unique for each model)
h[a-t]          20 hop channels

*/

#define FRAME_TIME_MS 5        // One frame every 5 ms

#define PACKET_SIZE 13
#define FAILSAFE_PRESCALER_COUNT 17

#define BIND_CHANNEL 81
#define BIND_PACKET_SIZE 27


typedef enum {
    SEND_STICK1 = 0,
    SEND_STICK2,
    SEND_BIND_INFO,
    SEND_CONFIGURATOR,
    RECEIVE_CONFIGURATOR,
    FRAME_DONE
} frame_state_t;

typedef enum {
    CONFIGURATOR_NOTHING_TO_DO = 0,
    CONFIGURATOR_SEND_ANOTHER_PACKET,
    CONFIGURATOR_RECEIVE,
} configurator_action_t;


static frame_state_t frame_state;
static uint8_t stick_packet[PACKET_SIZE];
static uint8_t bind_packet[BIND_PACKET_SIZE];
static uint8_t hop_index = 0;
static bool bind_enabled = false;

static const uint8_t bind_address[ADDRESS_SIZE] = {0x12, 0x23, 0x23, 0x45, 0x78};

// This counter determines how often failsafe packets are sent in relation to
// stick packets. The failsafe packets are sent every FAILSAFE_PRESCALER_COUNT.
// Ideally FAILSAFE_PRESCALER_COUNT should be a prime number so that the
// failsafe packet is sent on all hop channels over time.
static uint8_t failsafe_counter = 0;

static const protocol_hk310_t *cfg = &config.model.rf.protocol_hk310;


// ****************************************************************************
static uint16_t channel_to_stickdata(int32_t ch)
{
    // ch goes from -10000 to +10000. We need to convert that to 0..4095.
    ch = ch + CHANNEL_100_PERCENT;
    ch = (ch << 12) / (2 * CHANNEL_100_PERCENT);

    // Clamping to ensure sanity ...
    if (ch < 0) {
        ch = 0;
    }
    if (ch >= (1 << 12)) {
        ch = (1 << 12) - 1;
    }

    return (uint16_t)ch;
}


// ****************************************************************************
// Bind packets:
//
// ac 57 a1 a2 a3 a4 a5 ha hb hc hd he hf hg hh hi hj hk hl hm hn ho hp hq hr hs ht
static void build_bind_packets(void)
{
    // Put the constants in place: bind packet identifier
    bind_packet[0] = 0xac;
    bind_packet[1] = 0x57;

    // Put the address in bind_packet[2..6]
    for (int i = 0; i < 5; i++) {
        bind_packet[2+i] = cfg->address[i];
    }

    // Put the hop channels in bind_packet[7..26]
    for (int i = 0; i < 20; i++) {
        bind_packet[7+i] =cfg->hop_channels[i];
    }
}


// ****************************************************************************
static void setup_stick_packet(void)
{
    NRF24_set_bitrate(250);
    NRF24_set_power(NRF24_POWER_0dBm);
    NRF24_write_register(NRF24_RF_CH, cfg->hop_channels[hop_index]);
    NRF24_write_multi_byte_register(NRF24_TX_ADDR, cfg->address, ADDRESS_SIZE);
}


// ****************************************************************************
static void send_stick_packet(void)
{
    NRF24_write_payload_noack(stick_packet, PACKET_SIZE);
}


// ****************************************************************************
static void send_bind_packet(void)
{
    NRF24_set_bitrate(2);
    NRF24_set_power(NRF24_POWER_n18dBm);
    NRF24_write_register(NRF24_RF_CH, BIND_CHANNEL);
    NRF24_write_multi_byte_register(NRF24_TX_ADDR, bind_address, ADDRESS_SIZE);

    NRF24_write_payload_noack(bind_packet, BIND_PACKET_SIZE);
}


// ****************************************************************************
static configurator_action_t send_configurator_packet(uint8_t current_hop_index, uint8_t transmission_index)
{
    const configurator_packet_t *p;

    p = CONFIGURATOR_send_request(current_hop_index, transmission_index);
    if (p == NULL  ||  p->payload_size == 0) {
        return CONFIGURATOR_NOTHING_TO_DO;
    }

    NRF24_set_bitrate(2);
    NRF24_set_power(NRF24_POWER_n18dBm);
    NRF24_write_register(NRF24_RF_CH, p->channel);
    NRF24_write_multi_byte_register(NRF24_TX_ADDR, p->address, sizeof(p->address));
    NRF24_write_multi_byte_register(NRF24_RX_ADDR_P0, p->address, sizeof(p->address));

    if (p->send_without_ack) {
        NRF24_write_payload_noack(p->payload, p->payload_size);
    }
    else {
        NRF24_write_payload(p->payload, p->payload_size);
    }

    return p->send_another_packet ? CONFIGURATOR_SEND_ANOTHER_PACKET : CONFIGURATOR_RECEIVE;
}


// ****************************************************************************
static void receive_configurator_packet(uint8_t status)
{
    if (status & NRF24_TX_DS) {
        CONFIGURATOR_event(CONFIGURATOR_EVENT_TX_SUCCESS, NULL, 0);
    }

    if (status & NRF24_MAX_RT) {
        CONFIGURATOR_event(CONFIGURATOR_EVENT_TIMEOUT, NULL, 0);
        NRF24_flush_tx_fifo();
    }

    if (status & NRF24_RX_RD) {
        do {
            uint8_t count;
            count = NRF24_read_register(NRF24_R_RX_PL_WID);

            if (count > 0  &&  count <= 32) {
                uint8_t rx[32];

                NRF24_read_payload(rx, count);
                CONFIGURATOR_event(CONFIGURATOR_EVENT_RX, rx, count);
            }
            else {
                NRF24_flush_rx_fifo();
                break;
            }
        } while (! (NRF24_read_register(NRF24_FIFO_STATUS) & NRF24_RX_EMPTY));
    }
}


// ****************************************************************************
static void nrf_transmit_done_callback(void)
{
    uint8_t status;
    static uint8_t packet_number;

    // Load and clear all status flags
    status = NRF24_get_status();
    NRF24_write_register(NRF24_STATUS, NRF24_TX_DS | NRF24_MAX_RT | NRF24_RX_RD);

    switch (frame_state) {
        case SEND_STICK1:
            setup_stick_packet();
            send_stick_packet();
            packet_number = 1;
            frame_state = SEND_STICK2;
            break;

        case SEND_STICK2:
            send_stick_packet();
            frame_state = bind_enabled ? SEND_BIND_INFO : SEND_CONFIGURATOR;
            break;

        case SEND_BIND_INFO:
            send_bind_packet();
            frame_state = SEND_CONFIGURATOR;
            break;

        case SEND_CONFIGURATOR:
            switch (send_configurator_packet(hop_index, packet_number)) {
                case CONFIGURATOR_SEND_ANOTHER_PACKET:
                    break;

                case CONFIGURATOR_RECEIVE:
                    frame_state = RECEIVE_CONFIGURATOR;
                    break;

                case CONFIGURATOR_NOTHING_TO_DO:
                default:
                    frame_state = FRAME_DONE;
                    break;
            }
            ++packet_number;
            break;

        case RECEIVE_CONFIGURATOR:
            receive_configurator_packet(status);
            frame_state = FRAME_DONE;
            break;

        case FRAME_DONE:
        default:
            break;
    }
}


// ****************************************************************************
static void lbrc8ch_protocol_frame_callback(void)
{
    uint16_t stick_data;

    hop_index = (hop_index + 1) % NUMBER_OF_HOP_CHANNELS;

    failsafe_counter = (failsafe_counter + 1) % FAILSAFE_PRESCALER_COUNT;
    if (failsafe_counter) {
        stick_packet[0] = 0x57;

        stick_data = channel_to_stickdata(rf_channels[0]);
        stick_packet[1] = stick_data;
        stick_packet[9] = stick_data >> 8;

        stick_data = channel_to_stickdata(rf_channels[1]);
        stick_packet[2] = stick_data;
        stick_packet[9] |= (stick_data >> 4) & 0xf0;

        stick_data = channel_to_stickdata(rf_channels[2]);
        stick_packet[3] = stick_data;
        stick_packet[10] = stick_data >> 8;

        stick_data = channel_to_stickdata(rf_channels[3]);
        stick_packet[4] = stick_data;
        stick_packet[10] |= (stick_data >> 4) & 0xf0;

        stick_data = channel_to_stickdata(rf_channels[4]);
        stick_packet[5] = stick_data;
        stick_packet[11] = stick_data >> 8;

        stick_data = channel_to_stickdata(rf_channels[5]);
        stick_packet[6] = stick_data;
        stick_packet[11] |= (stick_data >> 4) & 0xf0;

        stick_data = channel_to_stickdata(rf_channels[6]);
        stick_packet[7] = stick_data;
        stick_packet[12] = stick_data >> 8;

        stick_data = channel_to_stickdata(rf_channels[7]);
        stick_packet[8] = stick_data;
        stick_packet[12] |= (stick_data >> 4) & 0xf0;
    }
    else {
        stick_packet[0] = 0xac;

        stick_data = channel_to_stickdata(failsafe[0]);
        stick_packet[1] = stick_data;
        stick_packet[9] = stick_data >> 8;

        stick_data = channel_to_stickdata(failsafe[1]);
        stick_packet[2] = stick_data;
        stick_packet[9] |= (stick_data >> 4) & 0xf0;

        stick_data = channel_to_stickdata(failsafe[2]);
        stick_packet[3] = stick_data;
        stick_packet[10] = stick_data >> 8;

        stick_data = channel_to_stickdata(failsafe[3]);
        stick_packet[4] = stick_data;
        stick_packet[10] |= (stick_data >> 4) & 0xf0;

        stick_data = channel_to_stickdata(failsafe[4]);
        stick_packet[5] = stick_data;
        stick_packet[11] = stick_data >> 8;

        stick_data = channel_to_stickdata(failsafe[5]);
        stick_packet[6] = stick_data;
        stick_packet[11] |= (stick_data >> 4) & 0xf0;

        stick_data = channel_to_stickdata(failsafe[6]);
        stick_packet[7] = stick_data;
        stick_packet[12] = stick_data >> 8;

        stick_data = channel_to_stickdata(failsafe[7]);
        stick_packet[8] = stick_data;
        stick_packet[12] |= (stick_data >> 4) & 0xf0;
    }

    frame_state = SEND_STICK1;
    nrf_transmit_done_callback();
}


// ****************************************************************************
void PROTOCOL_LANEBOYSRC8CH_init(void)
{
    build_bind_packets();

    NRF24_enable_interrupt(nrf_transmit_done_callback);

    // nRF24 initialization
    NRF24_write_register(NRF24_SETUP_AW, NRF24_ADDRESS_WIDTH_5_BYTES);

    // TX mode, 2-byte CRC, power-up, Enable TX, RX and MAX_RT interrupts
    //
    // IMPORTANT: reverse logic: setting one of the "mask interrupt" pins
    // disables the IRQ output, while having the bit cleared enables IRQ output!
    //
    // See nRF24L01+ specification v1.0, section "Register map table", page 57
    NRF24_write_register(NRF24_CONFIG, NRF24_EN_CRC | NRF24_CRCO | NRF24_PWR_UP);

    // Enable dynamic payload length and dynamic ACK
    NRF24_write_register(NRF24_FEATURE, NRF24_EN_DYN_ACK | NRF24_EN_ACK_PAY | NRF24_EN_DPL);

    // Enable Auto-ack on pipe 0
    NRF24_write_register(NRF24_EN_AA, 0x01);

    // No Auto-retransmit (ARC = 0); ARD is 500us (required for 32 byte payload at 2 Mbps)
    NRF24_write_register(NRF24_SETUP_RETR, 0x10);
    // Enable pipe 0 receiver
    NRF24_write_register(NRF24_EN_RXADDR, 0x01);
    // Enable dynamic ACK payload on pipe 0
    NRF24_write_register(NRF24_DYNPD, 0x01);

    SYSTICK_set_rf_callback(lbrc8ch_protocol_frame_callback, FRAME_TIME_MS);
}


// ****************************************************************************
void PROTOCOL_LANEBOYSRC8CH_enable_binding(void)
{
    bind_enabled = true;
}


// ****************************************************************************
void PROTOCOL_LANEBOYSRC8CH_disable_binding(void)
{
    bind_enabled = false;
}
