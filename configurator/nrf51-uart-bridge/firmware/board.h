// Board definition for WaveShare BLE400 development board
#pragma once


//*****************************************************************************
#define NRF_CLOCK_LFCLKSRC      NRF_CLOCK_LFCLKSRC_XTAL_20_PPM


//*****************************************************************************
#define RX_PIN_NUMBER 22
#define TX_PIN_NUMBER 21
#define HWFC false


//*****************************************************************************
//                                        GND: Display pin 8
//                                        Vcc: Display pin 6
#define DISPLAY_CLK_PIN_NUMBER 0            // Display pin 5
#define DISPLAY_DIN_PIN_NUMBER 30           // Display pin 4
#define DISPLAY_CS_PIN_NUMBER 24            // Display pin 2
#define DISPLAY_RST_PIN_NUMBER 23           // Display pin 1
#define DISPLAY_DC_PIN_NUMBER 25            // Display pin 3
#define DISPLAY_BL_PIN_NUMBER 1             // Display pin 7


//*****************************************************************************
#define KEYBOARD_COL1_PIN_NUMBER 18
#define KEYBOARD_COL2_PIN_NUMBER 14
#define KEYBOARD_COL3_PIN_NUMBER 13

#define KEYBOARD_ROW1_PIN_NUMBER 16
#define KEYBOARD_ROW2_PIN_NUMBER 11
#define KEYBOARD_ROW3_PIN_NUMBER 12
#define KEYBOARD_ROW4_PIN_NUMBER 9      // Requires hardware rework on Rev1
#define KEYBOARD_ROW5_PIN_NUMBER 10     // Requires hardware rework on Rev1
#define KEYBOARD_ROW6_PIN_NUMBER 17


//*****************************************************************************
// Throttle potentiometer
#define THROTTLE_PIN_NUMBER 3
#define THROTTLE_ADC_INPUT NRF_ADC_CONFIG_INPUT_4


//*****************************************************************************
// EEPROM 24C16 for persistent storage of setttings and library
#define EEPROM_SDA_PIN_NUMBER 28
#define EEPROM_SCL_PIN_NUMBER 29


//*****************************************************************************
// Battery level sensing
#define BATTERY_VOLTAGE_PIN_NUMBER 2
#define BATTERY_VOLTAGE_ADC_INPUT NRF_ADC_CONFIG_INPUT_3

