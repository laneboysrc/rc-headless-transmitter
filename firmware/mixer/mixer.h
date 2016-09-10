#pragma once

#include <stdint.h>

#include <curves.h>
#include <inputs.h>


#define MAX_MIXER_UNITS 100

// This structure defines the values that a mixer source can have.
// The mixer can use logical inputs as well as output channels as source.
// As such this list is the combination of input_label_t from <mixer.h> and
// channel_label_t from <channels.h>.
//
// The fist entry must be 0 (SRC_NONE), which signals that a mixer_unit is
// unused.
//
// In order to be able to map the mixer_label_t values to either input_label_t
// or channel_label_t, FIRST_INPUT_LABEL, LAST_INPUT_LABEL, FIRST_CHANNEL_LABEL
// and LAST_CHANNEL_LABEL are defined that allows a 1:1 mapping using
// FIRST_xxx_LABEL as offset. Note that input_label_t NONE maps to SRC_NONE, so
// SRC_NONE is the value we need to set FIRST_INPUT_LABEL to.
//
// To ensure uniqueness of names, all items are prefixed with "IN_" for
// input_label_t and "CH_" for channel_label_t items.
//
// IMPORTANT:
// ==========
// If you modify this list, update live_t in configurator.h to match!
//
typedef enum {
    SRC_NONE = 0,

    // values from input_label_t
    IN_NONE,
    IN_ST,
    IN_TH,
    IN_THR,
    IN_RUD,
    IN_AIL,
    IN_ELE,
    IN_AUX,
    IN_ST_DR,
    IN_RUD_DR,
    IN_AIL_DR,
    IN_ELE_DR,
    IN_TH_DR,
    IN_THR_DR,
    IN_TH_HOLD,
    IN_GEAR,
    IN_FLAPS,
    IN_TRAINER,
    IN_SIDE_L,
    IN_SIDE_R,
    IN_POT1,
    IN_POT2,
    IN_POT3,
    IN_POT4,
    IN_POT5,
    IN_POT6,
    IN_POT7,
    IN_POT8,
    IN_POT9,
    IN_SW1,
    IN_SW2,
    IN_SW3,
    IN_SW4,
    IN_SW5,
    IN_SW6,
    IN_SW7,
    IN_SW8,
    IN_SW9,

    // values from channel_label_t
    CH_CH1,
    CH_CH2,
    CH_CH3,
    CH_CH4,
    CH_CH5,
    CH_CH6,
    CH_CH7,
    CH_CH8,
    CH_VIRTUAL1,
    CH_VIRTUAL2,
    CH_VIRTUAL3,
    CH_VIRTUAL4,
    CH_VIRTUAL5,
    CH_VIRTUAL6,
    CH_VIRTUAL7,
    CH_VIRTUAL8,
    CH_VIRTUAL9,
    CH_VIRTUAL10,
    CH_HIDDEN1,
    CH_HIDDEN2,
    CH_HIDDEN3,
    CH_HIDDEN4,
    CH_HIDDEN5,
    CH_HIDDEN6,
    CH_HIDDEN7,
    CH_HIDDEN8,
    CH_HIDDEN9,
    CH_HIDDEN10,
    CH_HIDDEN11,
    CH_HIDDEN12,
    CH_HIDDEN13,
    CH_HIDDEN14,
    CH_HIDDEN15,
    CH_HIDDEN16,
    CH_HIDDEN17,
    CH_HIDDEN18,
    CH_HIDDEN19,
    CH_HIDDEN20,
    CH_HIDDEN21,
    CH_HIDDEN22,
    CH_HIDDEN23,
    CH_HIDDEN24,
    CH_HIDDEN25,
    CH_HIDDEN26,
    CH_HIDDEN27,
    CH_HIDDEN28,
    CH_HIDDEN29,
    CH_HIDDEN30,
    CH_HIDDEN31,
    CH_HIDDEN32,
    CH_HIDDEN33,
    CH_HIDDEN34,
    CH_HIDDEN35,
    CH_HIDDEN36,
    CH_HIDDEN37,
    CH_HIDDEN38,
    CH_HIDDEN39,
    CH_HIDDEN40,
    CH_HIDDEN41,
    CH_HIDDEN42,
    CH_HIDDEN43,
    CH_HIDDEN44,
    CH_HIDDEN45,
    CH_HIDDEN46,
    CH_HIDDEN47,
    CH_HIDDEN48,
    CH_HIDDEN49,
    CH_HIDDEN50,

    // channel_label_t values that correspond to rf_channels
    //   (= channels after applying limts)
    RF_CH1,
    RF_CH2,
    RF_CH3,
    RF_CH4,
    RF_CH5,
    RF_CH6,
    RF_CH7,
    RF_CH8,

    // Battery voltage in Millivolts
    BATTERY_MV,

} src_label_t;
#define FIRST_INPUT_LABEL IN_NONE
#define LAST_INPUT_LABEL IN_SW9
#define FIRST_CHANNEL_LABEL CH_CH1
#define LAST_CHANNEL_LABEL CH_HIDDEN50
#define FIRST_RF_CHANNEL_LABEL RF_CH1
#define LAST_RF_CHANNEL_LABEL RF_CH8

typedef enum {
    OP_REPLACE = 0,
    OP_ADD,
    OP_MULTIPLY,
    OP_MIN,
    OP_MAX
} operation_type_t;

typedef enum {
    EQUAL,
    NON_EQUAL,
    GREATER,
    GREATER_OR_EQUAL,
    SMALLER,
    SMALLER_OR_EQUAL
} comparison_t;

typedef struct {
    input_label_t sw;
    comparison_t cmp;
    uint8_t value;
} mixer_switch_t;

typedef struct  {
    curve_t curve;
    src_label_t src;
    channel_label_t dst;
    mixer_switch_t sw;
    operation_type_t op;
    int8_t scalar;          // Unit: percent
    int8_t offset;          // Unit: percent
    uint8_t invert_source;
    uint8_t apply_trim;
    uint8_t tag;            // For use by the configurator internally
} mixer_unit_t;


void MIXER_init(void);
void MIXER_evaluate(void);
