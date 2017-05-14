#pragma once

#include <stdint.h>

// A "channel" has a value range from -10000..0..10000, corresponding to
// -100%..0..100%. This range is the same used in Deviation. It provides
// good resolution and it is human readable.
//
// This range applies to the normalized input channels as well as to the
// output channels.
//
// The normalized input channels are clamped to -10000..0..10000, while
// the output channels can go up to -18000..0..18000 (-180%..0%..180%),
// corresponding to receiver pulses of 600us..1500us..2400us
#define CHANNEL_100_PERCENT 10000
#define CHANNEL_CENTER 0
#define CHANNEL_N100_PERCENT -10000

#define CHANNEL_TO_PERCENT(x) ((x) / 100)
#define PERCENT_TO_CHANNEL(x) ((x) * 100)

// Channels sent to the receiver
#define NUMBER_OF_RF_CHANNELS 8
// Virtual Channels allow users to build complex mixer chains
#define NUMBER_OF_VIRTUAL_CHANNELS 10
// Hidden Virtual Channels enable the UI to build complex mixer chains that
// are hidden from the user (for high-level mixers such as Elevons, 4-wheel
// steering ...)
#define NUMBER_OF_HIDDEN_VIRTUAL_CHANNELS 50
#define NUMBER_OF_CHANNELS (NUMBER_OF_RF_CHANNELS + NUMBER_OF_VIRTUAL_CHANNELS + NUMBER_OF_HIDDEN_VIRTUAL_CHANNELS)


// Tags to access the output channels
// IMPORTANT:
// ==========
// If you modify this list, update src_label_t in mixer.h to match!
typedef enum {
    // The following items must be in sequence:

    // NUMBER_OF_RF_CHANNELS channels (CH1..CHxxx),
    CH1 = 0,
    CH2,
    CH3,
    CH4,
    CH5,
    CH6,
    CH7,
    CH8,

    // NUMBER_OF_VIRTUAL_CHANNELS virtual channels (VIRTUAL1..VIRTUALxxx),
    VIRTUAL1,
    VIRTUAL2,
    VIRTUAL3,
    VIRTUAL4,
    VIRTUAL5,
    VIRTUAL6,
    VIRTUAL7,
    VIRTUAL8,
    VIRTUAL9,
    VIRTUAL10,

    // NUMBER_OF_HIDDEN_VIRTUAL_CHANNELS hidden channels to be used by the
    // complex mixer UI (HIDDEN1..HIDDENxxx)
    HIDDEN1,
    HIDDEN2,
    HIDDEN3,
    HIDDEN4,
    HIDDEN5,
    HIDDEN6,
    HIDDEN7,
    HIDDEN8,
    HIDDEN9,
    HIDDEN10,
    HIDDEN11,
    HIDDEN12,
    HIDDEN13,
    HIDDEN14,
    HIDDEN15,
    HIDDEN16,
    HIDDEN17,
    HIDDEN18,
    HIDDEN19,
    HIDDEN20,
    HIDDEN21,
    HIDDEN22,
    HIDDEN23,
    HIDDEN24,
    HIDDEN25,
    HIDDEN26,
    HIDDEN27,
    HIDDEN28,
    HIDDEN29,
    HIDDEN30,
    HIDDEN31,
    HIDDEN32,
    HIDDEN33,
    HIDDEN34,
    HIDDEN35,
    HIDDEN36,
    HIDDEN37,
    HIDDEN38,
    HIDDEN39,
    HIDDEN40,
    HIDDEN41,
    HIDDEN42,
    HIDDEN43,
    HIDDEN44,
    HIDDEN45,
    HIDDEN46,
    HIDDEN47,
    HIDDEN48,
    HIDDEN49,
    HIDDEN50,
} channel_label_t;


// Channel output destinations for the mixer
extern int32_t channels[NUMBER_OF_CHANNELS];

// Channel outputs and failsafe values passed to the radio module
extern int32_t rf_channels[NUMBER_OF_RF_CHANNELS];
extern int32_t failsafe[NUMBER_OF_RF_CHANNELS];
