#pragma once

#include <stdbool.h>
#include <stdint.h>


typedef struct {
    uint8_t address[5];
    uint8_t channel;
    uint8_t payload_size;
    uint8_t payload[32];
    bool send_without_ack;
    bool send_another_packet;
} configurator_packet_t;

#define CONFIGURATOR_EVENT_TX_SUCCESS 0
#define CONFIGURATOR_EVENT_TIMEOUT 1
#define CONFIGURATOR_EVENT_RX 2


typedef enum {
    TRANSPORT_NONE,
    TRANSPORT_RF,
    TRANSPORT_USB,
    TRANSPORT_UART,
    TRANSPORT_ANY
} configurator_transport_t;


// This structure defines the values that can be sent with TX_INFO packets to
// the configurator.
// To ensure uniqueness of names, all items are prefixed with "SRC_" for
// src_label_t items.
typedef enum {
    // values from input_label_t
    SRC_IN_NONE,
    SRC_IN_ST,
    SRC_IN_TH,
    SRC_IN_THR,
    SRC_IN_RUD,
    SRC_IN_AIL,
    SRC_IN_ELE,
    SRC_IN_AUX,
    SRC_IN_ST_DR,
    SRC_IN_RUD_DR,
    SRC_IN_AIL_DR,
    SRC_IN_ELE_DR,
    SRC_IN_TH_DR,
    SRC_IN_THR_DR,
    SRC_IN_TH_HOLD,
    SRC_IN_GEAR,
    SRC_IN_FLAPS,
    SRC_IN_TRAINER,
    SRC_IN_SIDE_L,
    SRC_IN_SIDE_R,
    SRC_IN_POT1,
    SRC_IN_POT2,
    SRC_IN_POT3,
    SRC_IN_POT4,
    SRC_IN_POT5,
    SRC_IN_POT6,
    SRC_IN_POT7,
    SRC_IN_POT8,
    SRC_IN_POT9,
    SRC_IN_SW1,
    SRC_IN_SW2,
    SRC_IN_SW3,
    SRC_IN_SW4,
    SRC_IN_SW5,
    SRC_IN_SW6,
    SRC_IN_SW7,
    SRC_IN_SW8,
    SRC_IN_SW9,

    // values from channel_label_t
    SRC_CH_CH1,
    SRC_CH_CH2,
    SRC_CH_CH3,
    SRC_CH_CH4,
    SRC_CH_CH5,
    SRC_CH_CH6,
    SRC_CH_CH7,
    SRC_CH_CH8,
    SRC_CH_VIRTUAL1,
    SRC_CH_VIRTUAL2,
    SRC_CH_VIRTUAL3,
    SRC_CH_VIRTUAL4,
    SRC_CH_VIRTUAL5,
    SRC_CH_VIRTUAL6,
    SRC_CH_VIRTUAL7,
    SRC_CH_VIRTUAL8,
    SRC_CH_VIRTUAL9,
    SRC_CH_VIRTUAL10,
    SRC_CH_HIDDEN1,
    SRC_CH_HIDDEN2,
    SRC_CH_HIDDEN3,
    SRC_CH_HIDDEN4,
    SRC_CH_HIDDEN5,
    SRC_CH_HIDDEN6,
    SRC_CH_HIDDEN7,
    SRC_CH_HIDDEN8,
    SRC_CH_HIDDEN9,
    SRC_CH_HIDDEN10,
    SRC_CH_HIDDEN11,
    SRC_CH_HIDDEN12,
    SRC_CH_HIDDEN13,
    SRC_CH_HIDDEN14,
    SRC_CH_HIDDEN15,
    SRC_CH_HIDDEN16,
    SRC_CH_HIDDEN17,
    SRC_CH_HIDDEN18,
    SRC_CH_HIDDEN19,
    SRC_CH_HIDDEN20,
    SRC_CH_HIDDEN21,
    SRC_CH_HIDDEN22,
    SRC_CH_HIDDEN23,
    SRC_CH_HIDDEN24,
    SRC_CH_HIDDEN25,
    SRC_CH_HIDDEN26,
    SRC_CH_HIDDEN27,
    SRC_CH_HIDDEN28,
    SRC_CH_HIDDEN29,
    SRC_CH_HIDDEN30,
    SRC_CH_HIDDEN31,
    SRC_CH_HIDDEN32,
    SRC_CH_HIDDEN33,
    SRC_CH_HIDDEN34,
    SRC_CH_HIDDEN35,
    SRC_CH_HIDDEN36,
    SRC_CH_HIDDEN37,
    SRC_CH_HIDDEN38,
    SRC_CH_HIDDEN39,
    SRC_CH_HIDDEN40,
    SRC_CH_HIDDEN41,
    SRC_CH_HIDDEN42,
    SRC_CH_HIDDEN43,
    SRC_CH_HIDDEN44,
    SRC_CH_HIDDEN45,
    SRC_CH_HIDDEN46,
    SRC_CH_HIDDEN47,
    SRC_CH_HIDDEN48,
    SRC_CH_HIDDEN49,
    SRC_CH_HIDDEN50,

    // channel_label_t values that correspond to rf_channels
    //   (= channels after applying limts)
    SRC_RF_CH1,
    SRC_RF_CH2,
    SRC_RF_CH3,
    SRC_RF_CH4,
    SRC_RF_CH5,
    SRC_RF_CH6,
    SRC_RF_CH7,
    SRC_RF_CH8,

    // Battery voltage in Millivolts
    SRC_BATTERY_MV,

    // Raw ADC values. Which values are actually available depends on the
    // hardware
    ADC0_RAW,
    ADC1_RAW,
    ADC2_RAW,
    ADC3_RAW,
    ADC4_RAW,
    ADC5_RAW,
    ADC6_RAW,
    ADC7_RAW,
    ADC8_RAW,
    ADC9_RAW,
    ADC10_RAW,
    ADC11_RAW,
    ADC12_RAW,
    ADC13_RAW,
    ADC14_RAW,
    ADC15_RAW,
    ADC16_RAW,
    ADC17_RAW,
    ADC18_RAW,
    ADC19_RAW,
    ADC20_RAW,
    ADC21_RAW,
    ADC22_RAW,
    ADC23_RAW,
    ADC24_RAW,
    ADC25_RAW,
    ADC26_RAW,
    ADC27_RAW,
    ADC28_RAW,
    ADC29_RAW,
    ADC30_RAW,
    ADC31_RAW,
} live_t;
#define FIRST_ADC_RAW ADC0_RAW
#define LAST_ADC_RAW ADC31_RAW


void CONFIGURATOR_init(void);
configurator_packet_t *CONFIGURATOR_send_request(configurator_transport_t transport, uint8_t hop_index, uint8_t transmission_index);
void CONFIGURATOR_event(configurator_transport_t transport, uint8_t nrf_status, const uint8_t * packet, uint8_t packet_length);
bool CONFIGURATOR_is_connected(configurator_transport_t transport);
