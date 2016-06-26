#pragma once


#include <stdint.h>


#define MAX_LABELS 5
#define MAX_TRANSMITTER_INPUTS 32
#define MAX_LOGICAL_INPUTS 32
#define MAX_POSITION_COUNT 12       // Number of supportd switch positions

#define ADC_VALUE_MIN 0
#define ADC_VALUE_HALF 0x800
#define ADC_VALUE_MAX 0xfff


typedef uint8_t port_t;


// Definition for a table element used to convert an adc channel number to the
// index in the various adc arrays corresponding to the sequence in
// adc_channel_selection
typedef struct {
    uint8_t adc_channel;
    uint8_t index;
} adc_channel_to_index_t;


// This structure describes the inputs on the transmitter PCB. It describes
// which ananlog inputs there are, and which digital inputs there are.
//
// Note that it does not describe whether those inputs are used or not, and to
// which functions they are connected. That is described in input_map.
typedef enum {
    PCB_INPUT_NOT_USED = 0,
    ANALOG_DIGITAL,
    DIGITAL
} pcb_input_type_t;

typedef struct {
    uint32_t gpioport;          // GPIO port, e.g. GPIOA
    uint16_t gpio;              // GPIO number, e.g. GPIO3
    uint8_t adc_channel;        // ADC channel
    pcb_input_type_t type;
} pcb_input_t;



// Here we define the low-level properties of each input as it is utilized in
// the transmitter hardware. An array of elements with this structure allows
// us to configure the inputs in correspondance to how they are wired up to the
// sticks, pots and switches in the transmitter.
//
// Note that it does not describe what the inputs *do*, only their low-level
// properties
typedef enum {
    TRANSMITTER_INPUT_NOT_USED = 0,
    ANALOG_WITH_CENTER,                 // CHANNEL_N100_PERCENT .. 0 .. CHANNEL_100_PERCENT
    ANALOG_NO_CENTER,                   // CHANNEL_N100_PERCENT .. CHANNEL_100_PERCENT
    ANALOG_NO_CENTER_POSITIVE_ONLY,     // 0 .. CHANNEL_100_PERCENT
    SWITCH_ON_OFF,                      // On / Off latching switch input
    SWITCH_ON_OPEN_OFF,                 // GND / Open / VCC latching switch input
    MOMENTARY_ON_OFF                    // On / Off momentary push-button input
} transmitter_input_type_t;

typedef struct {
    pcb_input_t pcb_input;
    transmitter_input_type_t type;
    uint16_t calibration[3];             // Left/Center/Right HW endpoint calibration values
} transmitter_input_t;


// Finally we have the logical inputs, i.e. Steering, Throttle, Rudder, Elevator ...
// but also trims, dual-rate switches or pots, etc

typedef enum {
    LOGICAL_INPUT_NOT_USED = 0,
    ANALOG,
    SWITCH,
    BCD_SWITCH,
    MOMENTARY,
    TRIM
} input_type_t;

typedef enum {
    SUB_TYPE_NOT_APPLICABLE = 0,
    UP_DOWN_BUTTONS,
    INCREMENT_AND_LOOP,
    DECREMENT_AND_LOOP,
    SAW_TOOTH,
    DOUBLE_CLICK_DECREMENT
} input_sub_type_t;

// FIXME: add battery input
typedef enum {
    NONE = 0,
    ST,
    TH,
    THR,
    RUD,
    AIL,
    ELE,

    CH1,
    CH2,
    CH3,
    CH4,
    CH5,
    CH6,
    CH7,
    CH8
} label_t;

typedef struct {
    input_type_t type;
    input_sub_type_t sub_type;
    uint8_t position_count;
    port_t transmitter_inputs[MAX_POSITION_COUNT];
    label_t labels[MAX_LABELS];
} logical_input_t;



void INPUTS_init(void);
int32_t INPUTS_get_value(label_t input);
uint8_t INPUTS_get_switch_value(label_t input);
int32_t INPUTS_get_trim(label_t input);
void INPUTS_filter_and_normalize(void);
void INPUTS_dump_adc(void);
uint32_t INPUTS_get_battery_voltage(void);
void INPUTS_configure(void);


// Include PCB specific configuration.
// THIS MUST BE AT THE END SINCE IT RELIES ON EARLIER DECLARED TYPES
#include <inputs_stm32f103c8t6.h>

