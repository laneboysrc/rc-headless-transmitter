#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>

#include <channels.h>
#include <config.h>
#include <configurator.h>
#include <nrf24l01p.h>
#include <protocol_hk310.h>
#include <systick.h>

/* ****************************************************************************

RF protocol compatible with the HobbyKing HK310 transmitter, HKR3000 and XR3100
receivers. Using Nordic NRF24L01P.

NRF24 RF configuration:
- 10 byte payload size
- 5 byte address size
- 2 byte CRC
- 20 hop channels
- One hop every 5 ms
- Transmitter sends three packets every 5 ms: two stick (or failsafe) packets,
  one bind packet
- Uni-directional data transfer (transmitter only transmits, receiver only
  receives; no acknowledgement or telemetry)


Stick data packet format:

0     1     2     3     4     5     6    7    8    9
ST-l  ST-h  TH-l  TH-h  CH3-l CH3-h ???  0x55 0x67 ???
                                         ^^^^
                                         Packet id

Failsafe data packet format:

0     1     2     3     4     5     6    7    8    9
ST-l  ST-h  TH-l  TH-h  CH3-l CH3-h ???  0xaa 0x5a ???   (failsafe on)
                                              0x5b       (failsafe off)
                                         ^^^^
                                         Packet id

Bytes 6 and 9 are ignored by the receiver
Note that we always send failsafe data, there is no way to turn failsafe off.

Stick values are sent as direct timer values for an 8051 timer with a 750 ns
clock. To calculate milliseconds of servo pulse duration, use the following
formula:

    servo_pules_in_us = (0xffff - stickdata) * 3 / 4;


Binding procedure:
The transmitter regularly sends data on the fixed channel 0x51 (81 decimal),
with address 12:23:23:45:78 (hex).
The transmitter cycles through four type of bind packets:

ff aa 55 a1 a2 a3 a4 a5 .. ..
cc cc 00 ha hb hc hd he hf hg
cc cc 01 hh hi hj hk hl hm hn
cc cc 02 ho hp hq hr hs ht ..

ff aa 55      Special marker for the first bind packet
a[1-5]        The 5 address bytes
cc cc         The 16 bit sum of bytes a1..a5
h[a-t]        20 channels for frequency hopping
..            Not used


The code also supports the LANE Boyx RC 4-channel adaptation of this protocol.
See "protcol_laneboysrc4ch.c" for details.


NOTE: We keep the CE pin of the nRF24L01P high at all times.
The nRF24L01P consumes 320uA in StandbyII mode (CE=1) and 26uA in StandbyI mode
(CE=0). The difference is not significant enough in our application to warrant
using an additional IO pin and routing an additional wire.

*/

// ****************************************************************************
#define FRAME_TIME_MS 5        // One frame every 5 ms

#define PACKET_SIZE 10
#define NUMBER_OF_BIND_PACKETS 4
#define BIND_CHANNEL 81
#define FAILSAFE_PRESCALER_COUNT 17

#define STICKDATA_PACKETID_3CH 0x55
#define FAILSAFE_PACKETID_3CH 0xaa
#define STICKDATA_PACKETID_4CH 0x56
#define FAILSAFE_PACKETID_4CH 0xab


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
static uint8_t failsafe_packet[PACKET_SIZE];
static uint8_t bind_packet[NUMBER_OF_BIND_PACKETS][PACKET_SIZE];
static uint8_t bind_packet_index = 0;
static uint8_t hop_index = 0;
static bool bind_enabled = false;

static const uint8_t bind_address[ADDRESS_SIZE] = {0x12, 0x23, 0x23, 0x45, 0x78};

// This counter determines how often failsafe packets are sent in relation to
// stick packets. The failsafe packets are sent every FAILSAFE_PRESCALER_COUNT.
// Ideally FAILSAFE_PRESCALER_COUNT should be a prime number so that the
// failsafe packet is sent on all hop channels over time.
static uint8_t failsafe_counter = 0;

static const protocol_hk310_t *cfg = &config.model.rf.protocol_hk310;

static bool fourChannelEnabled = false;

// ****************************************************************************
static void pulse_to_stickdata(unsigned int pulse_ns, uint8_t *packet_ptr)
{
    uint16_t stickdata;

    // Ensure that we are not overflowing the resulting uint16_t
    if (pulse_ns > 49151 * 1000) {
        pulse_ns = 49151 * 1000;
    }

    // Magic formula how the receiver converts stickdata into the generated
    // servo pulse duration.
    stickdata = 0xffff - (pulse_ns * 4 / (3 * 1000));

    packet_ptr[0] = stickdata & 0xff;
    packet_ptr[1] = stickdata >> 8;
}


// ****************************************************************************
static unsigned int channel_to_pulse_ns(int32_t ch)
{
    int32_t pulse_ns;

    pulse_ns = ch * 500 * 1000 / CHANNEL_100_PERCENT;
    pulse_ns += 1500 * 1000;

    if (pulse_ns < 0) {
        return 0;
    }

    return (unsigned int)pulse_ns;
}


// ****************************************************************************
// There are four bind packets:
//
// ff aa 55 a1 a2 a3 a4 a5 .. ..
// cc cc 00 ha hb hc hd he hf hg
// cc cc 01 hh hi hj hk hl hm hn
// cc cc 02 ho hp hq hr hs ht ..
static void build_bind_packets(void)
{
    uint16_t cc;

    // Put the constants in place: bind packet 0 identifier
    bind_packet[0][0] = 0xff;
    bind_packet[0][1] = fourChannelEnabled ? 0xab : 0xaa;
    bind_packet[0][2] = fourChannelEnabled ? 0x56 : 0x55;

    // Put the constants in place: bind packet 1..3 index
    bind_packet[1][2] = 0x00;
    bind_packet[2][2] = 0x01;
    bind_packet[3][2] = 0x02;

    // Build the checksum for bind packets 1..3. It is simply the 16-bit
    // sum of the five address bytes.
    cc = 0;
    for (int i = 0; i < 5; i++) {
        cc += (uint16_t)cfg->address[i];
    }

    bind_packet[1][0] = cc & 0xff;
    bind_packet[2][0] = cc & 0xff;
    bind_packet[3][0] = cc & 0xff;

    bind_packet[1][1] = cc >> 8;
    bind_packet[2][1] = cc >> 8;
    bind_packet[3][1] = cc >> 8;

    // Put the address in bind packet 0
    for (int i = 0; i < 5; i++) {
        bind_packet[0][3+i] = cfg->address[i];
    }

    // Put the hop channels in bind packets 1..3
    for (int i = 0; i < 7; i++) {
        bind_packet[1][3+i] =cfg->hop_channels[i];
    }

    for (int i = 0; i < 7; i++) {
        bind_packet[2][3+i] = cfg->hop_channels[7+i];
    }

    for (int i = 0; i < 6; i++) {
        bind_packet[3][3+i] = cfg->hop_channels[14+i];
    }
}


// ****************************************************************************
static void setup_stick_packet(void)
{
    // Disable Dynamic payload length
    // Note: this is required even though the nRF24 manual does not mention it!
    NRF24_write_register(NRF24_FEATURE, 0);

    // Disable Auto Acknoledgement on all pipes
    NRF24_write_register(NRF24_EN_AA, 0x00);

    NRF24_set_bitrate(250);
    NRF24_set_power(NRF24_POWER_0dBm);
    NRF24_write_register(NRF24_RF_CH, cfg->hop_channels[hop_index]);
    NRF24_write_multi_byte_register(NRF24_TX_ADDR, cfg->address, ADDRESS_SIZE);
}


// ****************************************************************************
static void send_stick_packet(void)
{
    // Send failsafe packets instead of stick pacekts every
    // FAILSAFE_PRESCALER_COUNT times.
    if (failsafe_counter == 0) {
        NRF24_write_payload(failsafe_packet, PACKET_SIZE);
    }
    else {
        NRF24_write_payload(stick_packet, PACKET_SIZE);
    }
}


// ****************************************************************************
static void send_bind_packet(void)
{
    NRF24_set_power(NRF24_POWER_n18dBm);
    NRF24_write_register(NRF24_RF_CH, BIND_CHANNEL);
    NRF24_write_multi_byte_register(NRF24_TX_ADDR, bind_address, ADDRESS_SIZE);
    NRF24_write_payload(bind_packet[bind_packet_index], PACKET_SIZE);

    bind_packet_index = (bind_packet_index + 1) % NUMBER_OF_BIND_PACKETS;
}


// ****************************************************************************
static configurator_action_t send_configurator_packet(uint8_t current_hop_index, uint8_t transmission_index)
{
    const configurator_packet_t *p;

    p = CONFIGURATOR_send_request(TRANSPORT_RF, current_hop_index, transmission_index);
    if (p == NULL  ||  p->payload_size == 0) {
        return CONFIGURATOR_NOTHING_TO_DO;
    }

    // Enable dynamic payload length and dynamic ACK
    NRF24_write_register(NRF24_FEATURE, NRF24_EN_DYN_ACK | NRF24_EN_ACK_PAY | NRF24_EN_DPL);

    // Enable Auto-ack on pipe 0
    NRF24_write_register(NRF24_EN_AA, 0x01);

    NRF24_set_bitrate(2);
    // NRF24_set_power(NRF24_POWER_0dBm);
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
        CONFIGURATOR_event(TRANSPORT_RF, CONFIGURATOR_EVENT_TX_SUCCESS, NULL, 0);
    }

    if (status & NRF24_MAX_RT) {
        CONFIGURATOR_event(TRANSPORT_RF, CONFIGURATOR_EVENT_TIMEOUT, NULL, 0);
        NRF24_flush_tx_fifo();
    }

    if (status & NRF24_RX_RD) {
        do {
            uint8_t count;
            count = NRF24_read_register(NRF24_R_RX_PL_WID);

            if (count > 0  &&  count <= 32) {
                uint8_t rx[32];

                NRF24_read_payload(rx, count);
                CONFIGURATOR_event(TRANSPORT_RF, CONFIGURATOR_EVENT_RX, rx, count);
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
static void hk310_protocol_frame_callback(void)
{
    pulse_to_stickdata(channel_to_pulse_ns(rf_channels[0]), &stick_packet[0]);
    pulse_to_stickdata(channel_to_pulse_ns(rf_channels[1]), &stick_packet[2]);
    pulse_to_stickdata(channel_to_pulse_ns(rf_channels[2]), &stick_packet[4]);

    pulse_to_stickdata(channel_to_pulse_ns(failsafe[0]), &failsafe_packet[0]);
    pulse_to_stickdata(channel_to_pulse_ns(failsafe[1]), &failsafe_packet[2]);
    pulse_to_stickdata(channel_to_pulse_ns(failsafe[2]), &failsafe_packet[4]);

    if (fourChannelEnabled) {
        uint8_t temp_stickdata[2];

        pulse_to_stickdata(channel_to_pulse_ns(rf_channels[3]), temp_stickdata);
        stick_packet[6] = temp_stickdata[0];
        stick_packet[9] = temp_stickdata[1];

        pulse_to_stickdata(channel_to_pulse_ns(failsafe[3]), temp_stickdata);
        failsafe_packet[6] = temp_stickdata[0];
        failsafe_packet[9] = temp_stickdata[1];
    }

    hop_index = (hop_index + 1) % NUMBER_OF_HOP_CHANNELS;
    failsafe_counter = (failsafe_counter + 1) % FAILSAFE_PRESCALER_COUNT;

    frame_state = SEND_STICK1;
    nrf_transmit_done_callback();
}


// ****************************************************************************
void PROTOCOL_HK310_enable_binding(void)
{
    bind_enabled = true;
}


// ****************************************************************************
void PROTOCOL_HK310_disable_binding(void)
{
    bind_enabled = false;
}


// ****************************************************************************
void PROTOCOL_HK310_init(void) {
    PROTOCOL_HK310_init_ex(3);
}

// ****************************************************************************
void PROTOCOL_HK310_init_ex(uint8_t number_of_channels)
{
    fourChannelEnabled = false;
    if (number_of_channels == 4) {
        fourChannelEnabled = true;
    }

    stick_packet[7] = fourChannelEnabled ? STICKDATA_PACKETID_4CH : STICKDATA_PACKETID_3CH;
    failsafe_packet[7] = fourChannelEnabled ? FAILSAFE_PACKETID_4CH : FAILSAFE_PACKETID_3CH;

    build_bind_packets();

    stick_packet[8] = 0x67;         // Unkown constant in stick data sent by HK310
    failsafe_packet[8] = 0x5a;      // Failsafe (always) on

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


    // The following commands set up the nRF24 for the configurator
    // protocol. We can do them once globally as they do not interfere with
    // the HK310 protocol.
    //
    // No Auto-retransmit (ARC = 0); ARD is 500us (required for 32 byte payload at 2 Mbps)
    NRF24_write_register(NRF24_SETUP_RETR, 0x10);
    // Enable pipe 0 receiver
    NRF24_write_register(NRF24_EN_RXADDR, 0x01);
    // Enable dynamic ACK payload on pipe 0
    NRF24_write_register(NRF24_DYNPD, 0x01);

    SYSTICK_set_rf_callback(hk310_protocol_frame_callback, FRAME_TIME_MS);
}


