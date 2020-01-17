EESchema Schematic File Version 4
EELAYER 30 0
EELAYER END
$Descr A3 16535 11693
encoding utf-8
Sheet 1 1
Title "STM32F1 NRF24L01 RC transmitter"
Date "2020-01-17"
Rev "3"
Comp "LANE Boys RC"
Comment1 ""
Comment2 ""
Comment3 ""
Comment4 ""
$EndDescr
$Comp
L stm32f1-nrf24l01-transmitter-rescue:NRF24L01P U3
U 1 1 57202BD1
P 14600 1950
F 0 "U3" H 14250 2400 60  0000 L CNN
F 1 "NRF24L01P" H 14900 1450 60  0000 C CNN
F 2 "Connector_PinHeader_2.54mm:PinHeader_2x04_P2.54mm_Vertical" H 14600 1950 60  0001 C CNN
F 3 "~" H 14600 1950 60  0000 C CNN
	1    14600 1950
	1    0    0    -1  
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:VDD #PWR07
U 1 1 57202CFF
P 7800 1800
F 0 "#PWR07" H 7800 1900 30  0001 C CNN
F 1 "VDD" H 7800 1910 30  0000 C CNN
F 2 "" H 7800 1800 60  0000 C CNN
F 3 "" H 7800 1800 60  0000 C CNN
	1    7800 1800
	1    0    0    -1  
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:VCC #PWR014
U 1 1 57202D18
P 8800 1800
F 0 "#PWR014" H 8800 1900 30  0001 C CNN
F 1 "VCC" H 8800 1900 30  0000 C CNN
F 2 "" H 8800 1800 60  0000 C CNN
F 3 "" H 8800 1800 60  0000 C CNN
	1    8800 1800
	1    0    0    -1  
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:GND-RESCUE-stm32f1-nrf24l01-transmitter #PWR08
U 1 1 57202D59
P 8050 5700
F 0 "#PWR08" H 8050 5700 30  0001 C CNN
F 1 "GND" H 8050 5630 30  0001 C CNN
F 2 "" H 8050 5700 60  0000 C CNN
F 3 "" H 8050 5700 60  0000 C CNN
	1    8050 5700
	1    0    0    -1  
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:GND-RESCUE-stm32f1-nrf24l01-transmitter #PWR010
U 1 1 57202D68
P 8250 5700
F 0 "#PWR010" H 8250 5700 30  0001 C CNN
F 1 "GND" H 8250 5630 30  0001 C CNN
F 2 "" H 8250 5700 60  0000 C CNN
F 3 "" H 8250 5700 60  0000 C CNN
	1    8250 5700
	1    0    0    -1  
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:GND-RESCUE-stm32f1-nrf24l01-transmitter #PWR012
U 1 1 57202D77
P 8450 5700
F 0 "#PWR012" H 8450 5700 30  0001 C CNN
F 1 "GND" H 8450 5630 30  0001 C CNN
F 2 "" H 8450 5700 60  0000 C CNN
F 3 "" H 8450 5700 60  0000 C CNN
	1    8450 5700
	1    0    0    -1  
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:C-RESCUE-stm32f1-nrf24l01-transmitter C4
U 1 1 57202EE1
P 15300 1450
F 0 "C4" H 15300 1550 40  0000 L CNN
F 1 "1u" H 15306 1365 40  0000 L CNN
F 2 "Capacitor_SMD:C_0805_2012Metric_Pad1.15x1.40mm_HandSolder" H 15338 1300 30  0001 C CNN
F 3 "~" H 15300 1450 60  0000 C CNN
	1    15300 1450
	1    0    0    -1  
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:GND-RESCUE-stm32f1-nrf24l01-transmitter #PWR028
U 1 1 57202EF0
P 15300 1750
F 0 "#PWR028" H 15300 1750 30  0001 C CNN
F 1 "GND" H 15300 1680 30  0001 C CNN
F 2 "" H 15300 1750 60  0000 C CNN
F 3 "" H 15300 1750 60  0000 C CNN
	1    15300 1750
	1    0    0    -1  
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:VCC #PWR026
U 1 1 57202F26
P 14600 1050
F 0 "#PWR026" H 14600 1150 30  0001 C CNN
F 1 "VCC" H 14600 1150 30  0000 C CNN
F 2 "" H 14600 1050 60  0000 C CNN
F 3 "" H 14600 1050 60  0000 C CNN
	1    14600 1050
	1    0    0    -1  
$EndComp
Text Label 9950 4100 2    60   ~ 0
CSN
Text Label 9950 4250 2    60   ~ 0
SCK
Text Label 9950 4400 2    60   ~ 0
MISO
Text Label 9950 4550 2    60   ~ 0
MOSI
Text Label 13450 1800 0    60   ~ 0
IRQ
Text Label 13450 1900 0    60   ~ 0
MISO
Text Label 13450 2000 0    60   ~ 0
MOSI
Text Label 13450 2100 0    60   ~ 0
SCK
Text Label 13450 2200 0    60   ~ 0
CSN
$Comp
L stm32f1-nrf24l01-transmitter-rescue:R-RESCUE-stm32f1-nrf24l01-transmitter R5
U 1 1 572032A2
P 14400 7200
F 0 "R5" V 14480 7200 40  0000 C CNN
F 1 "1k" V 14407 7201 40  0000 C CNN
F 2 "Resistor_SMD:R_0805_2012Metric_Pad1.15x1.40mm_HandSolder" V 14330 7200 30  0001 C CNN
F 3 "~" H 14400 7200 30  0000 C CNN
	1    14400 7200
	1    0    0    -1  
$EndComp
$Comp
L Connector_Generic:Conn_01x02 J25
U 1 1 572032B1
P 14600 6700
F 0 "J25" H 14600 6800 40  0000 C CNN
F 1 "LED" V 14700 6650 40  0000 C CNN
F 2 "Connector_JST:JST_EH_B2B-EH-A_1x02_P2.50mm_Vertical" H 14600 6700 60  0001 C CNN
F 3 "" H 14600 6700 60  0000 C CNN
	1    14600 6700
	1    0    0    1   
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:VCC #PWR025
U 1 1 572032C0
P 14400 6450
F 0 "#PWR025" H 14400 6550 30  0001 C CNN
F 1 "VCC" H 14400 6600 30  0000 C CNN
F 2 "" H 14400 6450 60  0000 C CNN
F 3 "" H 14400 6450 60  0000 C CNN
	1    14400 6450
	1    0    0    -1  
$EndComp
NoConn ~ 6950 4850
NoConn ~ 6950 5000
NoConn ~ 9500 5000
Text Label 13550 7450 0    60   ~ 0
LED
Text Label 6450 4700 0    60   ~ 0
LED
$Comp
L stm32f1-nrf24l01-transmitter-rescue:R-RESCUE-stm32f1-nrf24l01-transmitter R1
U 1 1 57203444
P 9350 9300
F 0 "R1" V 9430 9300 40  0000 C CNN
F 1 "22k" V 9357 9301 40  0000 C CNN
F 2 "Resistor_SMD:R_0805_2012Metric_Pad1.15x1.40mm_HandSolder" V 9280 9300 30  0001 C CNN
F 3 "~" H 9350 9300 30  0000 C CNN
	1    9350 9300
	1    0    0    -1  
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:R-RESCUE-stm32f1-nrf24l01-transmitter R2
U 1 1 57203451
P 9350 9900
F 0 "R2" V 9430 9900 40  0000 C CNN
F 1 "33k" V 9357 9901 40  0000 C CNN
F 2 "Resistor_SMD:R_0805_2012Metric_Pad1.15x1.40mm_HandSolder" V 9280 9900 30  0001 C CNN
F 3 "~" H 9350 9900 30  0000 C CNN
	1    9350 9900
	1    0    0    -1  
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:VDD #PWR015
U 1 1 57203459
P 9350 8950
F 0 "#PWR015" H 9350 9050 30  0001 C CNN
F 1 "VDD" H 9350 9060 30  0000 C CNN
F 2 "" H 9350 8950 60  0000 C CNN
F 3 "" H 9350 8950 60  0000 C CNN
	1    9350 8950
	1    0    0    -1  
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:GND-RESCUE-stm32f1-nrf24l01-transmitter #PWR016
U 1 1 572034AB
P 9350 10250
F 0 "#PWR016" H 9350 10250 30  0001 C CNN
F 1 "GND" H 9350 10180 30  0001 C CNN
F 2 "" H 9350 10250 60  0000 C CNN
F 3 "" H 9350 10250 60  0000 C CNN
	1    9350 10250
	1    0    0    -1  
$EndComp
Text Label 10200 9600 2    60   ~ 0
ADC0
Text Label 6450 2450 0    60   ~ 0
ADC0
Text Label 6450 2600 0    60   ~ 0
PA1/ADC1
Text Label 6450 2750 0    60   ~ 0
PA2/ADC2
Text Label 6450 2900 0    60   ~ 0
PA3/ADC3
Text Label 6450 3050 0    60   ~ 0
PA4/ADC4
Text Label 6450 3200 0    60   ~ 0
PA5/ADC5
Text Label 6450 3350 0    60   ~ 0
PA6/ADC6
Text Label 6450 3500 0    60   ~ 0
PA7/ADC7
Text Label 9950 2450 2    60   ~ 0
PB0/ADC8
Text Label 9950 2600 2    60   ~ 0
PB1/ADC9
Text Label 6450 3650 0    60   ~ 0
IRQ
$Comp
L stm32f1-nrf24l01-transmitter-rescue:CONN_3 J1
U 1 1 57203BE7
P 1300 1250
F 0 "J1" V 1250 1250 50  0000 C CNN
F 1 "PA1/A1" V 1350 1250 40  0000 C CNN
F 2 "Connector_JST:JST_EH_B3B-EH-A_1x03_P2.50mm_Vertical" H 1300 1250 60  0001 C CNN
F 3 "" H 1300 1250 60  0000 C CNN
	1    1300 1250
	-1   0    0    1   
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:CONN_3 J2
U 1 1 57203BF4
P 1300 1650
F 0 "J2" V 1250 1650 50  0000 C CNN
F 1 "PA2/A2" V 1350 1650 40  0000 C CNN
F 2 "Connector_JST:JST_EH_B3B-EH-A_1x03_P2.50mm_Vertical" H 1300 1650 60  0001 C CNN
F 3 "" H 1300 1650 60  0000 C CNN
	1    1300 1650
	-1   0    0    1   
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:CONN_3 J3
U 1 1 57203C22
P 1300 2050
F 0 "J3" V 1250 2050 50  0000 C CNN
F 1 "PA3/A3" V 1350 2050 40  0000 C CNN
F 2 "Connector_JST:JST_EH_B3B-EH-A_1x03_P2.50mm_Vertical" H 1300 2050 60  0001 C CNN
F 3 "" H 1300 2050 60  0000 C CNN
	1    1300 2050
	-1   0    0    1   
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:CONN_3 J4
U 1 1 57203C28
P 1300 2450
F 0 "J4" V 1250 2450 50  0000 C CNN
F 1 "PA4/A4" V 1350 2450 40  0000 C CNN
F 2 "Connector_JST:JST_EH_B3B-EH-A_1x03_P2.50mm_Vertical" H 1300 2450 60  0001 C CNN
F 3 "" H 1300 2450 60  0000 C CNN
	1    1300 2450
	-1   0    0    1   
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:CONN_3 J5
U 1 1 57203C2E
P 1300 2850
F 0 "J5" V 1250 2850 50  0000 C CNN
F 1 "PA5/A5" V 1350 2850 40  0000 C CNN
F 2 "Connector_JST:JST_EH_B3B-EH-A_1x03_P2.50mm_Vertical" H 1300 2850 60  0001 C CNN
F 3 "" H 1300 2850 60  0000 C CNN
	1    1300 2850
	-1   0    0    1   
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:CONN_3 J6
U 1 1 57203C34
P 1300 3250
F 0 "J6" V 1250 3250 50  0000 C CNN
F 1 "PA6/A6" V 1350 3250 40  0000 C CNN
F 2 "Connector_JST:JST_EH_B3B-EH-A_1x03_P2.50mm_Vertical" H 1300 3250 60  0001 C CNN
F 3 "" H 1300 3250 60  0000 C CNN
	1    1300 3250
	-1   0    0    1   
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:CONN_3 J7
U 1 1 57203C3A
P 1300 3650
F 0 "J7" V 1250 3650 50  0000 C CNN
F 1 "PA7/A7" V 1350 3650 40  0000 C CNN
F 2 "Connector_JST:JST_EH_B3B-EH-A_1x03_P2.50mm_Vertical" H 1300 3650 60  0001 C CNN
F 3 "" H 1300 3650 60  0000 C CNN
	1    1300 3650
	-1   0    0    1   
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:CONN_3 J8
U 1 1 57203C40
P 1300 4050
F 0 "J8" V 1250 4050 50  0000 C CNN
F 1 "PB0/A8" V 1350 4050 40  0000 C CNN
F 2 "Connector_JST:JST_EH_B3B-EH-A_1x03_P2.50mm_Vertical" H 1300 4050 60  0001 C CNN
F 3 "" H 1300 4050 60  0000 C CNN
	1    1300 4050
	-1   0    0    1   
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:CONN_3 J9
U 1 1 57203C46
P 1300 4450
F 0 "J9" V 1250 4450 50  0000 C CNN
F 1 "PB1/A9" V 1350 4450 40  0000 C CNN
F 2 "Connector_JST:JST_EH_B3B-EH-A_1x03_P2.50mm_Vertical" H 1300 4450 60  0001 C CNN
F 3 "" H 1300 4450 60  0000 C CNN
	1    1300 4450
	-1   0    0    1   
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:VCC #PWR01
U 1 1 57203C4E
P 1850 1000
F 0 "#PWR01" H 1850 1100 30  0001 C CNN
F 1 "VCC" H 1850 1100 30  0000 C CNN
F 2 "" H 1850 1000 60  0000 C CNN
F 3 "" H 1850 1000 60  0000 C CNN
	1    1850 1000
	1    0    0    -1  
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:CONN_3 J10
U 1 1 57203E9D
P 1300 4850
F 0 "J10" V 1250 4850 50  0000 C CNN
F 1 "PB3" V 1350 4850 40  0000 C CNN
F 2 "Connector_JST:JST_EH_B3B-EH-A_1x03_P2.50mm_Vertical" H 1300 4850 60  0001 C CNN
F 3 "" H 1300 4850 60  0000 C CNN
	1    1300 4850
	-1   0    0    1   
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:CONN_3 J11
U 1 1 57203EA3
P 1300 5250
F 0 "J11" V 1250 5250 50  0000 C CNN
F 1 "PB4" V 1350 5250 40  0000 C CNN
F 2 "Connector_JST:JST_EH_B3B-EH-A_1x03_P2.50mm_Vertical" H 1300 5250 60  0001 C CNN
F 3 "" H 1300 5250 60  0000 C CNN
	1    1300 5250
	-1   0    0    1   
$EndComp
Text Label 2450 1150 2    60   ~ 0
PA1/ADC1
Text Label 2450 1550 2    60   ~ 0
PA2/ADC2
Text Label 2450 1950 2    60   ~ 0
PA3/ADC3
Text Label 2450 2350 2    60   ~ 0
PA4/ADC4
Text Label 2450 2750 2    60   ~ 0
PA5/ADC5
Text Label 2450 3150 2    60   ~ 0
PA6/ADC6
Text Label 2450 3550 2    60   ~ 0
PA7/ADC7
Text Label 2450 3950 2    60   ~ 0
PB0/ADC8
Text Label 2450 4350 2    60   ~ 0
PB1/ADC9
Text Label 2450 4750 2    60   ~ 0
PB3
Text Label 2450 5150 2    60   ~ 0
PB4
Text Label 9950 3800 2    60   ~ 0
PB10
Text Label 9950 3950 2    60   ~ 0
PB11
$Comp
L stm32f1-nrf24l01-transmitter-rescue:GND-RESCUE-stm32f1-nrf24l01-transmitter #PWR05
U 1 1 57204AD8
P 6700 7250
F 0 "#PWR05" H 6700 7250 30  0001 C CNN
F 1 "GND" H 6700 7180 30  0001 C CNN
F 2 "" H 6700 7250 60  0000 C CNN
F 3 "" H 6700 7250 60  0000 C CNN
	1    6700 7250
	1    0    0    -1  
$EndComp
Text Label 6350 6750 0    60   ~ 0
RX
Text Label 6350 6850 0    60   ~ 0
TX
Text Notes 6500 6450 0    60   ~ 0
Diagnostics UART
Text Label 6450 3800 0    60   ~ 0
TX
Text Label 6450 3950 0    60   ~ 0
RX
Text Notes 14000 6200 0    60   ~ 0
Front panel LED
$Comp
L stm32f1-nrf24l01-transmitter-rescue:SPEAKER SP1
U 1 1 5720518F
P 14600 4350
F 0 "SP1" H 14500 4600 70  0000 C CNN
F 1 "SPEAKER" H 14500 4100 70  0001 C CNN
F 2 "Buzzer_Beeper:Buzzer_12x9.5RM7.6" H 14600 4350 60  0001 C CNN
F 3 "~" H 14600 4350 60  0000 C CNN
	1    14600 4350
	1    0    0    -1  
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:GND-RESCUE-stm32f1-nrf24l01-transmitter #PWR022
U 1 1 572051AD
P 13750 5150
F 0 "#PWR022" H 13750 5150 30  0001 C CNN
F 1 "GND" H 13750 5080 30  0001 C CNN
F 2 "" H 13750 5150 60  0000 C CNN
F 3 "" H 13750 5150 60  0000 C CNN
	1    13750 5150
	1    0    0    -1  
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:R-RESCUE-stm32f1-nrf24l01-transmitter R3
U 1 1 572052B4
P 13000 4800
F 0 "R3" V 13080 4800 40  0000 C CNN
F 1 "1k" V 13007 4801 40  0000 C CNN
F 2 "Resistor_SMD:R_0805_2012Metric_Pad1.15x1.40mm_HandSolder" V 12930 4800 30  0001 C CNN
F 3 "~" H 13000 4800 30  0000 C CNN
	1    13000 4800
	0    1    1    0   
$EndComp
Text Label 12250 4800 0    60   ~ 0
BUZZER
$Comp
L stm32f1-nrf24l01-transmitter-rescue:VDD #PWR021
U 1 1 572053AF
P 13750 4000
F 0 "#PWR021" H 13750 4100 30  0001 C CNN
F 1 "VDD" H 13750 4110 30  0000 C CNN
F 2 "" H 13750 4000 60  0000 C CNN
F 3 "" H 13750 4000 60  0000 C CNN
	1    13750 4000
	1    0    0    -1  
$EndComp
Text Label 6450 4400 0    60   ~ 0
BUZZER
Text Notes 13450 3750 0    60   ~ 0
Alarm buzzer
$Comp
L stm32f1-nrf24l01-transmitter-rescue:GND-RESCUE-stm32f1-nrf24l01-transmitter #PWR027
U 1 1 57206B26
P 14600 2800
F 0 "#PWR027" H 14600 2800 30  0001 C CNN
F 1 "GND" H 14600 2730 30  0001 C CNN
F 2 "" H 14600 2800 60  0000 C CNN
F 3 "" H 14600 2800 60  0000 C CNN
	1    14600 2800
	1    0    0    -1  
$EndComp
Text Notes 6400 4400 2    60   ~ 0
TIM2_CH1
$Comp
L stm32f1-nrf24l01-transmitter-rescue:STM32F103C8T6_DEV_BOARD U2
U 1 1 57202BC2
P 8250 3650
F 0 "U2" H 7250 5150 60  0000 L CNN
F 1 "STM32F103C8T6_DEV_BOARD" H 9200 1950 60  0000 C CNN
F 2 "WLA:STM32F103C8T6_DEV_BOARD" H 8400 4050 60  0001 C CNN
F 3 "~" H 8400 4050 60  0000 C CNN
	1    8250 3650
	1    0    0    -1  
$EndComp
Text Label 13450 1700 0    60   ~ 0
CE
$Comp
L stm32f1-nrf24l01-transmitter-rescue:C-RESCUE-stm32f1-nrf24l01-transmitter C1
U 1 1 5747F7DC
P 9650 9900
F 0 "C1" H 9650 10000 40  0000 L CNN
F 1 "100nF" H 9656 9815 40  0000 L CNN
F 2 "Capacitor_SMD:C_0805_2012Metric_Pad1.15x1.40mm_HandSolder" H 9688 9750 30  0001 C CNN
F 3 "~" H 9650 9900 60  0000 C CNN
	1    9650 9900
	1    0    0    -1  
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:GND-RESCUE-stm32f1-nrf24l01-transmitter #PWR017
U 1 1 5747F906
P 9650 10250
F 0 "#PWR017" H 9650 10250 30  0001 C CNN
F 1 "GND" H 9650 10180 30  0001 C CNN
F 2 "" H 9650 10250 60  0000 C CNN
F 3 "" H 9650 10250 60  0000 C CNN
	1    9650 10250
	1    0    0    -1  
$EndComp
Text Label 9950 2750 2    60   ~ 0
PB3
Text Label 9950 2900 2    60   ~ 0
PB4
Text Label 9950 3050 2    60   ~ 0
PB5
Text Label 9950 3200 2    60   ~ 0
PB6
Text Label 9950 3350 2    60   ~ 0
PB7
Text Label 9950 3500 2    60   ~ 0
PB8
Text Label 9950 3650 2    60   ~ 0
METER
$Comp
L Connector_Generic:Conn_01x02 J23
U 1 1 589BC0A8
P 14050 4400
F 0 "J23" H 14050 4500 40  0000 C CNN
F 1 "Buzzer" V 14150 4350 40  0000 C CNN
F 2 "Connector_JST:JST_EH_B2B-EH-A_1x02_P2.50mm_Vertical" H 14050 4400 60  0001 C CNN
F 3 "" H 14050 4400 60  0000 C CNN
	1    14050 4400
	1    0    0    1   
$EndComp
$Comp
L Connector_Generic:Conn_01x03 J20
U 1 1 589BCD46
P 7000 6850
F 0 "J20" V 7100 6850 50  0000 C CNN
F 1 "UART" V 7200 6850 40  0000 C CNN
F 2 "Connector_PinHeader_2.54mm:PinHeader_1x03_P2.54mm_Vertical" H 7000 6850 60  0001 C CNN
F 3 "" H 7000 6850 60  0000 C CNN
	1    7000 6850
	1    0    0    1   
$EndComp
Wire Wire Line
	8050 5550 8050 5700
Wire Wire Line
	8250 5550 8250 5700
Wire Wire Line
	8450 5550 8450 5700
Wire Wire Line
	7800 1800 7800 1900
Wire Wire Line
	15300 1650 15300 1750
Wire Wire Line
	14600 1050 14600 1150
Wire Wire Line
	15300 1150 15300 1250
Connection ~ 14600 1150
Wire Wire Line
	9500 4100 9950 4100
Wire Wire Line
	9500 4250 9950 4250
Wire Wire Line
	9500 4400 9950 4400
Wire Wire Line
	9500 4550 9950 4550
Wire Wire Line
	13300 1700 13950 1700
Wire Wire Line
	13950 2200 13450 2200
Wire Wire Line
	13950 2100 13450 2100
Wire Wire Line
	13950 2000 13450 2000
Wire Wire Line
	13950 1900 13450 1900
Wire Wire Line
	13950 1800 13450 1800
Wire Wire Line
	14400 6450 14400 6600
Wire Wire Line
	14400 7450 13550 7450
Wire Wire Line
	6950 4700 6450 4700
Wire Wire Line
	9350 8950 9350 9050
Wire Wire Line
	9350 9550 9350 9600
Wire Wire Line
	9350 10150 9350 10250
Wire Wire Line
	9350 9600 9650 9600
Connection ~ 9350 9600
Wire Wire Line
	6950 2450 6450 2450
Wire Wire Line
	6450 2600 6950 2600
Wire Wire Line
	6950 2750 6450 2750
Wire Wire Line
	6450 2900 6950 2900
Wire Wire Line
	6450 3050 6950 3050
Wire Wire Line
	6450 3200 6950 3200
Wire Wire Line
	6450 3350 6950 3350
Wire Wire Line
	6450 3500 6950 3500
Wire Wire Line
	9950 2450 9500 2450
Wire Wire Line
	9950 2600 9500 2600
Wire Wire Line
	6450 3650 6950 3650
Wire Wire Line
	1950 5350 1650 5350
Wire Wire Line
	1950 1350 1950 1750
Wire Wire Line
	1650 4950 1950 4950
Connection ~ 1950 5350
Wire Wire Line
	1650 4550 1950 4550
Connection ~ 1950 4950
Wire Wire Line
	1650 4150 1950 4150
Connection ~ 1950 4550
Wire Wire Line
	1650 3350 1950 3350
Connection ~ 1950 4150
Wire Wire Line
	1650 3750 1950 3750
Connection ~ 1950 3750
Wire Wire Line
	1650 1750 1950 1750
Connection ~ 1950 3350
Wire Wire Line
	1650 2950 1950 2950
Connection ~ 1950 2950
Wire Wire Line
	1650 2550 1950 2550
Connection ~ 1950 2550
Wire Wire Line
	1650 2150 1950 2150
Connection ~ 1950 2150
Wire Wire Line
	1650 1350 1950 1350
Connection ~ 1950 1750
Wire Wire Line
	9950 3950 9500 3950
Wire Wire Line
	9950 3800 9500 3800
Wire Wire Line
	6800 6850 6350 6850
Wire Wire Line
	6350 6750 6800 6750
Wire Wire Line
	6450 3800 6950 3800
Wire Wire Line
	6450 3950 6950 3950
Wire Wire Line
	13750 5000 13750 5150
Wire Wire Line
	13250 4800 13450 4800
Wire Wire Line
	12750 4800 12250 4800
Wire Wire Line
	13750 4000 13750 4150
Wire Wire Line
	6450 4400 6950 4400
Wire Wire Line
	14600 2650 14600 2800
Wire Wire Line
	2450 1150 1650 1150
Wire Wire Line
	2450 1550 1650 1550
Wire Wire Line
	2450 1950 1650 1950
Wire Wire Line
	2450 2350 1650 2350
Wire Wire Line
	2450 2750 1650 2750
Wire Wire Line
	2450 3150 1650 3150
Wire Wire Line
	2450 3550 1650 3550
Wire Wire Line
	2450 3950 1650 3950
Wire Wire Line
	2450 4350 1650 4350
Wire Wire Line
	2450 4750 1650 4750
Wire Wire Line
	2450 5150 1650 5150
Wire Wire Line
	1850 5250 1650 5250
Wire Wire Line
	1850 1000 1850 1250
Wire Wire Line
	1650 4850 1850 4850
Connection ~ 1850 4850
Wire Wire Line
	1650 4450 1850 4450
Connection ~ 1850 4450
Wire Wire Line
	1650 3650 1850 3650
Connection ~ 1850 3650
Wire Wire Line
	1650 3250 1850 3250
Connection ~ 1850 3250
Wire Wire Line
	1650 4050 1850 4050
Connection ~ 1850 4050
Wire Wire Line
	1650 2850 1850 2850
Connection ~ 1850 2850
Wire Wire Line
	1650 2450 1850 2450
Connection ~ 1850 2450
Wire Wire Line
	1650 2050 1850 2050
Connection ~ 1850 2050
Wire Wire Line
	1650 1650 1850 1650
Connection ~ 1850 1650
Wire Wire Line
	1650 1250 1850 1250
Connection ~ 1850 1250
Wire Wire Line
	8800 1800 8800 1900
Wire Wire Line
	13300 1150 14600 1150
Wire Wire Line
	13300 1150 13300 1700
Wire Wire Line
	9650 9700 9650 9600
Connection ~ 9650 9600
Wire Wire Line
	9650 10100 9650 10250
Wire Wire Line
	9950 2750 9500 2750
Wire Wire Line
	9950 2900 9500 2900
Wire Wire Line
	9950 3050 9500 3050
Wire Wire Line
	9950 3200 9500 3200
Wire Wire Line
	9950 3350 9500 3350
Wire Wire Line
	9950 3500 9500 3500
Wire Wire Line
	9500 3650 9950 3650
Wire Wire Line
	13500 4150 13750 4150
Wire Wire Line
	14300 4150 14300 4250
Connection ~ 13750 4150
Wire Wire Line
	13750 4550 14300 4550
Wire Wire Line
	14300 4550 14300 4450
Connection ~ 13750 4550
Wire Wire Line
	6800 6950 6700 6950
Wire Wire Line
	6700 6950 6700 7250
$Comp
L stm32f1-nrf24l01-transmitter-rescue:VCC #PWR09
U 1 1 589BC63C
P 8250 1800
F 0 "#PWR09" H 8250 1900 30  0001 C CNN
F 1 "VCC" H 8250 1900 30  0000 C CNN
F 2 "" H 8250 1800 60  0000 C CNN
F 3 "" H 8250 1800 60  0000 C CNN
	1    8250 1800
	1    0    0    -1  
$EndComp
Wire Wire Line
	8250 1800 8250 1900
$Comp
L stm32f1-nrf24l01-transmitter-rescue:Q_NPN_CBE Q1
U 1 1 589EC521
P 13650 4800
F 0 "Q1" H 13850 4850 50  0000 L CNN
F 1 "BC547B" H 13850 4750 50  0000 L CNN
F 2 "Package_TO_SOT_SMD:SOT-23_Handsoldering" H 13850 4900 50  0001 C CNN
F 3 "" H 13650 4800 50  0000 C CNN
	1    13650 4800
	1    0    0    -1  
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:C C2
U 1 1 589ECC74
P 13500 4300
F 0 "C2" H 13525 4400 50  0000 L CNN
F 1 "1u" H 13525 4200 50  0000 L CNN
F 2 "Capacitor_SMD:C_0805_2012Metric_Pad1.15x1.40mm_HandSolder" H 13538 4150 50  0001 C CNN
F 3 "" H 13500 4300 50  0000 C CNN
	1    13500 4300
	1    0    0    -1  
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:GND-RESCUE-stm32f1-nrf24l01-transmitter #PWR020
U 1 1 589ECD1A
P 13500 4550
F 0 "#PWR020" H 13500 4550 30  0001 C CNN
F 1 "GND" H 13500 4480 30  0001 C CNN
F 2 "" H 13500 4550 60  0000 C CNN
F 3 "" H 13500 4550 60  0000 C CNN
	1    13500 4550
	1    0    0    -1  
$EndComp
Wire Wire Line
	13500 4450 13500 4550
$Comp
L Connector_Generic:Conn_01x02 J24
U 1 1 58CFE9D2
P 14550 9100
F 0 "J24" H 14550 9200 40  0000 C CNN
F 1 "Meter" V 14650 9050 40  0000 C CNN
F 2 "Connector_JST:JST_EH_B2B-EH-A_1x02_P2.50mm_Vertical" H 14550 9100 60  0001 C CNN
F 3 "" H 14550 9100 60  0000 C CNN
	1    14550 9100
	1    0    0    1   
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:R-RESCUE-stm32f1-nrf24l01-transmitter R4
U 1 1 58D0049F
P 14350 8550
F 0 "R4" V 14430 8550 40  0000 C CNN
F 1 "3k9" V 14357 8551 40  0000 C CNN
F 2 "Resistor_SMD:R_0805_2012Metric_Pad1.15x1.40mm_HandSolder" V 14280 8550 30  0001 C CNN
F 3 "~" H 14350 8550 30  0000 C CNN
	1    14350 8550
	1    0    0    -1  
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:C C3
U 1 1 58D005D2
P 14000 9150
F 0 "C3" H 14025 9250 50  0000 L CNN
F 1 "1u" H 14025 9050 50  0000 L CNN
F 2 "Capacitor_SMD:C_0805_2012Metric_Pad1.15x1.40mm_HandSolder" H 14038 9000 50  0001 C CNN
F 3 "" H 14000 9150 50  0000 C CNN
	1    14000 9150
	1    0    0    -1  
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:GND-RESCUE-stm32f1-nrf24l01-transmitter #PWR024
U 1 1 58D00698
P 14350 9500
F 0 "#PWR024" H 14350 9500 30  0001 C CNN
F 1 "GND" H 14350 9430 30  0001 C CNN
F 2 "" H 14350 9500 60  0000 C CNN
F 3 "" H 14350 9500 60  0000 C CNN
	1    14350 9500
	1    0    0    -1  
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:GND-RESCUE-stm32f1-nrf24l01-transmitter #PWR023
U 1 1 58D00709
P 14000 9500
F 0 "#PWR023" H 14000 9500 30  0001 C CNN
F 1 "GND" H 14000 9430 30  0001 C CNN
F 2 "" H 14000 9500 60  0000 C CNN
F 3 "" H 14000 9500 60  0000 C CNN
	1    14000 9500
	1    0    0    -1  
$EndComp
Wire Wire Line
	14000 9000 14350 9000
Wire Wire Line
	14350 9000 14350 8800
Wire Wire Line
	14000 9300 14000 9500
Text Notes 15100 8100 2    60   ~ 0
Analog meter (PWM)
$Comp
L stm32f1-nrf24l01-transmitter-rescue:VCC #PWR013
U 1 1 58D2422E
P 8600 1800
F 0 "#PWR013" H 8600 1900 30  0001 C CNN
F 1 "VCC" H 8600 1900 30  0000 C CNN
F 2 "" H 8600 1800 60  0000 C CNN
F 3 "" H 8600 1800 60  0000 C CNN
	1    8600 1800
	1    0    0    -1  
$EndComp
Wire Wire Line
	8600 1800 8600 1900
Connection ~ 14350 9000
Text Notes 14500 8550 0    39   ~ 0
Resistor value depends on meter. \n3k9 is for the Airtronics meter, \nwhich is full scale 400mV / 670 Ohm.\n3k9 gives 483mV at 3.3V.
Text Notes 10000 3650 0    60   ~ 0
TIM4_CH4
Wire Wire Line
	14600 1150 14600 1250
Wire Wire Line
	14600 1150 15300 1150
Wire Wire Line
	9350 9600 9350 9650
Wire Wire Line
	1950 5350 1950 5750
Wire Wire Line
	1950 4950 1950 5350
Wire Wire Line
	1950 4550 1950 4950
Wire Wire Line
	1950 4150 1950 4550
Wire Wire Line
	1950 3750 1950 4150
Wire Wire Line
	1950 3350 1950 3750
Wire Wire Line
	1950 2950 1950 3350
Wire Wire Line
	1950 2550 1950 2950
Wire Wire Line
	1950 2150 1950 2550
Wire Wire Line
	1950 1750 1950 2150
Wire Wire Line
	1850 4850 1850 5250
Wire Wire Line
	1850 4450 1850 4850
Wire Wire Line
	1850 3650 1850 4050
Wire Wire Line
	1850 3250 1850 3650
Wire Wire Line
	1850 4050 1850 4450
Wire Wire Line
	1850 2850 1850 3250
Wire Wire Line
	1850 2450 1850 2850
Wire Wire Line
	1850 2050 1850 2450
Wire Wire Line
	1850 1650 1850 2050
Wire Wire Line
	1850 1250 1850 1650
Wire Wire Line
	9650 9600 10200 9600
Wire Wire Line
	13750 4150 14300 4150
Wire Wire Line
	13750 4550 13750 4600
Wire Wire Line
	5650 8750 5650 8800
Wire Wire Line
	5650 10400 5650 10500
$Comp
L stm32f1-nrf24l01-transmitter-rescue:GND-RESCUE-stm32f1-nrf24l01-transmitter #PWR04
U 1 1 58D05116
P 5650 10500
F 0 "#PWR04" H 5650 10500 30  0001 C CNN
F 1 "GND" H 5650 10430 30  0001 C CNN
F 2 "" H 5650 10500 60  0000 C CNN
F 3 "" H 5650 10500 60  0000 C CNN
	1    5650 10500
	1    0    0    -1  
$EndComp
Wire Wire Line
	6950 9900 7100 9900
Wire Wire Line
	8350 9050 8350 9300
Wire Wire Line
	3950 9200 3950 9300
Connection ~ 5650 8750
Wire Wire Line
	3950 9300 4350 9300
Wire Wire Line
	5650 8600 5650 8750
Wire Wire Line
	5000 8750 5350 8750
$Comp
L stm32f1-nrf24l01-transmitter-rescue:PWR_FLAG #FLG02
U 1 1 57206A98
P 3950 10000
F 0 "#FLG02" H 3950 10095 30  0001 C CNN
F 1 "PWR_FLAG" H 3950 10180 30  0000 C CNN
F 2 "" H 3950 10000 60  0000 C CNN
F 3 "" H 3950 10000 60  0000 C CNN
	1    3950 10000
	-1   0    0    1   
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:PWR_FLAG #FLG01
U 1 1 572067EF
P 3950 9200
F 0 "#FLG01" H 3950 9295 30  0001 C CNN
F 1 "PWR_FLAG" H 3950 9380 30  0000 C CNN
F 2 "" H 3950 9200 60  0000 C CNN
F 3 "" H 3950 9200 60  0000 C CNN
	1    3950 9200
	1    0    0    -1  
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:PWR_FLAG #FLG03
U 1 1 572067E0
P 5650 8600
F 0 "#FLG03" H 5650 8695 30  0001 C CNN
F 1 "PWR_FLAG" H 5650 8780 30  0000 C CNN
F 2 "" H 5650 8600 60  0000 C CNN
F 3 "" H 5650 8600 60  0000 C CNN
	1    5650 8600
	1    0    0    -1  
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:PWR_FLAG #FLG04
U 1 1 572059A3
P 7950 9050
F 0 "#FLG04" H 7950 9145 30  0001 C CNN
F 1 "PWR_FLAG" H 7950 9230 30  0000 C CNN
F 2 "" H 7950 9050 60  0000 C CNN
F 3 "" H 7950 9050 60  0000 C CNN
	1    7950 9050
	1    0    0    -1  
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:GND-RESCUE-stm32f1-nrf24l01-transmitter #PWR03
U 1 1 57203F33
P 1950 8000
F 0 "#PWR03" H 1950 8000 30  0001 C CNN
F 1 "GND" H 1950 7930 30  0001 C CNN
F 2 "" H 1950 8000 60  0000 C CNN
F 3 "" H 1950 8000 60  0000 C CNN
	1    1950 8000
	1    0    0    -1  
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:VDD #PWR011
U 1 1 57202CE6
P 8350 9050
F 0 "#PWR011" H 8350 9150 30  0001 C CNN
F 1 "VDD" H 8350 9200 30  0000 C CNN
F 2 "" H 8350 9050 60  0000 C CNN
F 3 "" H 8350 9050 60  0000 C CNN
	1    8350 9050
	1    0    0    -1  
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:GND-RESCUE-stm32f1-nrf24l01-transmitter #PWR06
U 1 1 57202C42
P 7100 10250
F 0 "#PWR06" H 7100 10250 30  0001 C CNN
F 1 "GND" H 7100 10180 30  0001 C CNN
F 2 "" H 7100 10250 60  0000 C CNN
F 3 "" H 7100 10250 60  0000 C CNN
	1    7100 10250
	1    0    0    -1  
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:LIPO_CHARGER_+_PROTECTION U1
U 1 1 57202BEA
P 5650 9600
F 0 "U1" H 4650 10150 60  0000 L CNN
F 1 "LIPO_CHARGER_+_PROTECTION" H 5650 9600 60  0000 C CNN
F 2 "WLA:LiPo_charger_and_protection" H 5650 9600 60  0001 C CNN
F 3 "~" H 5650 9600 60  0000 C CNN
	1    5650 9600
	1    0    0    -1  
$EndComp
Wire Wire Line
	14350 8300 14350 8250
Wire Wire Line
	14350 8250 13550 8250
Text Label 13550 8250 0    50   ~ 0
METER
$Comp
L stm32f1-nrf24l01-transmitter-rescue:CONN_3 J12
U 1 1 5E3C2EF8
P 1300 5650
F 0 "J12" V 1250 5650 50  0000 C CNN
F 1 "PB5" V 1350 5650 40  0000 C CNN
F 2 "Connector_JST:JST_EH_B3B-EH-A_1x03_P2.50mm_Vertical" H 1300 5650 60  0001 C CNN
F 3 "" H 1300 5650 60  0000 C CNN
	1    1300 5650
	-1   0    0    1   
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:CONN_3 J13
U 1 1 5E3C3307
P 1300 6050
F 0 "J13" V 1250 6050 50  0000 C CNN
F 1 "PB6" V 1350 6050 40  0000 C CNN
F 2 "Connector_JST:JST_EH_B3B-EH-A_1x03_P2.50mm_Vertical" H 1300 6050 60  0001 C CNN
F 3 "" H 1300 6050 60  0000 C CNN
	1    1300 6050
	-1   0    0    1   
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:CONN_3 J14
U 1 1 5E3C5C6A
P 1300 6450
F 0 "J14" V 1250 6450 50  0000 C CNN
F 1 "PB7" V 1350 6450 40  0000 C CNN
F 2 "Connector_JST:JST_EH_B3B-EH-A_1x03_P2.50mm_Vertical" H 1300 6450 60  0001 C CNN
F 3 "" H 1300 6450 60  0000 C CNN
	1    1300 6450
	-1   0    0    1   
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:CONN_3 J15
U 1 1 5E3C6D8C
P 1300 6850
F 0 "J15" V 1250 6850 50  0000 C CNN
F 1 "PB8" V 1350 6850 40  0000 C CNN
F 2 "Connector_JST:JST_EH_B3B-EH-A_1x03_P2.50mm_Vertical" H 1300 6850 60  0001 C CNN
F 3 "" H 1300 6850 60  0000 C CNN
	1    1300 6850
	-1   0    0    1   
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:CONN_3 J16
U 1 1 5E3C7054
P 1300 7250
F 0 "J16" V 1250 7250 50  0000 C CNN
F 1 "PB10" V 1350 7250 40  0000 C CNN
F 2 "Connector_JST:JST_EH_B3B-EH-A_1x03_P2.50mm_Vertical" H 1300 7250 60  0001 C CNN
F 3 "" H 1300 7250 60  0000 C CNN
	1    1300 7250
	-1   0    0    1   
$EndComp
$Comp
L stm32f1-nrf24l01-transmitter-rescue:CONN_3 J17
U 1 1 5E3C731A
P 1300 7650
F 0 "J17" V 1250 7650 50  0000 C CNN
F 1 "PB11" V 1350 7650 40  0000 C CNN
F 2 "Connector_JST:JST_EH_B3B-EH-A_1x03_P2.50mm_Vertical" H 1300 7650 60  0001 C CNN
F 3 "" H 1300 7650 60  0000 C CNN
	1    1300 7650
	-1   0    0    1   
$EndComp
Text Label 2450 7550 2    60   ~ 0
PB11
Wire Wire Line
	2450 7550 1650 7550
Text Label 2450 7150 2    60   ~ 0
PB10
Wire Wire Line
	2450 7150 1650 7150
Wire Wire Line
	2450 5550 1650 5550
Wire Wire Line
	2450 5950 1650 5950
Wire Wire Line
	2450 6350 1650 6350
Wire Wire Line
	2450 6750 1650 6750
Text Label 2450 5550 2    50   ~ 0
PB5
Text Label 2450 5950 2    50   ~ 0
PB6
Text Label 2450 6350 2    50   ~ 0
PB7
Text Label 2450 6750 2    50   ~ 0
PB8
Wire Wire Line
	1650 7750 1950 7750
Connection ~ 1950 7750
Wire Wire Line
	1950 7750 1950 8000
Wire Wire Line
	1650 5750 1950 5750
Connection ~ 1950 5750
Wire Wire Line
	1950 5750 1950 6150
Wire Wire Line
	1650 6150 1950 6150
Connection ~ 1950 6150
Wire Wire Line
	1950 6150 1950 6550
Wire Wire Line
	1650 6550 1950 6550
Connection ~ 1950 6550
Wire Wire Line
	1950 6550 1950 6950
Wire Wire Line
	1650 6950 1950 6950
Connection ~ 1950 6950
Wire Wire Line
	1950 6950 1950 7350
Wire Wire Line
	1650 7350 1950 7350
Connection ~ 1950 7350
Wire Wire Line
	1950 7350 1950 7750
Wire Wire Line
	1850 5250 1850 5650
Wire Wire Line
	1850 7650 1650 7650
Connection ~ 1850 5250
Wire Wire Line
	1650 7250 1850 7250
Connection ~ 1850 7250
Wire Wire Line
	1850 7250 1850 7650
Wire Wire Line
	1650 6850 1850 6850
Connection ~ 1850 6850
Wire Wire Line
	1850 6850 1850 7250
Wire Wire Line
	1650 6450 1850 6450
Connection ~ 1850 6450
Wire Wire Line
	1850 6450 1850 6850
Wire Wire Line
	1650 6050 1850 6050
Connection ~ 1850 6050
Wire Wire Line
	1850 6050 1850 6450
Wire Wire Line
	1650 5650 1850 5650
Connection ~ 1850 5650
Wire Wire Line
	1850 5650 1850 6050
Text Label 5000 8750 0    50   ~ 0
+USB
Wire Wire Line
	6450 4100 6950 4100
Wire Wire Line
	6450 4250 6950 4250
Text Label 6450 4100 0    50   ~ 0
USBDM
Text Label 6450 4250 0    50   ~ 0
USBDP
Wire Wire Line
	7100 9900 7100 10250
Wire Wire Line
	7950 9050 7950 9300
Connection ~ 7950 9300
Wire Wire Line
	7950 9300 8350 9300
$Comp
L Connector_Generic:Conn_01x02 J19
U 1 1 5E5E22CA
P 3550 9650
F 0 "J19" H 3468 9325 50  0000 C CNN
F 1 "BATTERY" H 3468 9416 50  0000 C CNN
F 2 "Connector_JST:JST_EH_B2B-EH-A_1x02_P2.50mm_Vertical" H 3550 9650 50  0001 C CNN
F 3 "~" H 3550 9650 50  0001 C CNN
	1    3550 9650
	-1   0    0    1   
$EndComp
Wire Wire Line
	3750 9550 3950 9550
Wire Wire Line
	3950 9550 3950 9300
Connection ~ 3950 9300
Wire Wire Line
	3750 9650 3950 9650
Wire Wire Line
	3950 9650 3950 9900
Wire Wire Line
	3950 9900 3950 10000
Connection ~ 3950 9900
Wire Wire Line
	3950 9900 4350 9900
$Comp
L Connector_Generic:Conn_01x02 J21
U 1 1 5E6642C8
P 7300 9000
F 0 "J21" V 7264 8812 50  0000 R CNN
F 1 "SWITCH" V 7173 8812 50  0000 R CNN
F 2 "Connector_JST:JST_EH_B2B-EH-A_1x02_P2.50mm_Vertical" H 7300 9000 50  0001 C CNN
F 3 "~" H 7300 9000 50  0001 C CNN
	1    7300 9000
	0    -1   -1   0   
$EndComp
Wire Wire Line
	7300 9300 7300 9200
Wire Wire Line
	6950 9300 7300 9300
Wire Wire Line
	7400 9200 7400 9300
Wire Wire Line
	7400 9300 7950 9300
Wire Wire Line
	14400 6700 14400 6950
Wire Wire Line
	14350 9100 14350 9500
Wire Wire Line
	13850 4300 13750 4300
Wire Wire Line
	13750 4150 13750 4300
Wire Wire Line
	13850 4400 13750 4400
Wire Wire Line
	13750 4400 13750 4550
Text Notes 1550 9300 0    50   ~ 0
USB
Text Label 1950 9750 2    50   ~ 0
USBDP
Wire Wire Line
	1500 9750 1950 9750
Text Label 1950 9650 2    50   ~ 0
USBDM
Wire Wire Line
	1500 9650 1950 9650
Wire Wire Line
	1900 9850 1900 10050
Wire Wire Line
	1500 9850 1900 9850
$Comp
L power:GND #PWR02
U 1 1 5E518DF6
P 1900 10050
F 0 "#PWR02" H 1900 9800 50  0001 C CNN
F 1 "GND" H 1905 9877 50  0000 C CNN
F 2 "" H 1900 10050 50  0001 C CNN
F 3 "" H 1900 10050 50  0001 C CNN
	1    1900 10050
	1    0    0    -1  
$EndComp
Text Label 1950 9550 2    50   ~ 0
+USB
Wire Wire Line
	1500 9550 1950 9550
$Comp
L Connector_Generic:Conn_01x04 J18
U 1 1 5E501B99
P 1300 9750
F 0 "J18" H 1218 9325 50  0000 C CNN
F 1 "USB" H 1218 9416 50  0000 C CNN
F 2 "Connector_JST:JST_EH_B4B-EH-A_1x04_P2.50mm_Vertical" H 1300 9750 50  0001 C CNN
F 3 "~" H 1300 9750 50  0001 C CNN
	1    1300 9750
	-1   0    0    1   
$EndComp
Text Notes 9350 8700 0    60   ~ 0
Battery level\nsensing
$Comp
L Connector_Generic:Conn_01x07 J22
U 1 1 5E7A987D
P 12200 2000
F 0 "J22" H 12118 1475 50  0000 C CNN
F 1 "NRF24 connector" H 12118 1566 50  0000 C CNN
F 2 "Connector_JST:JST_EH_B7B-EH-A_1x07_P2.50mm_Vertical" H 12200 2000 50  0001 C CNN
F 3 "~" H 12200 2000 50  0001 C CNN
	1    12200 2000
	1    0    0    1   
$EndComp
$Comp
L power:GND #PWR019
U 1 1 5E7ABF34
P 11650 2450
F 0 "#PWR019" H 11650 2200 50  0001 C CNN
F 1 "GND" H 11655 2277 50  0000 C CNN
F 2 "" H 11650 2450 50  0001 C CNN
F 3 "" H 11650 2450 50  0001 C CNN
	1    11650 2450
	1    0    0    -1  
$EndComp
Wire Wire Line
	12000 2300 11650 2300
Wire Wire Line
	11650 2300 11650 2450
$Comp
L stm32f1-nrf24l01-transmitter-rescue:VCC #PWR018
U 1 1 5E7B8924
P 11650 1200
F 0 "#PWR018" H 11650 1300 30  0001 C CNN
F 1 "VCC" H 11650 1350 30  0000 C CNN
F 2 "" H 11650 1200 60  0000 C CNN
F 3 "" H 11650 1200 60  0000 C CNN
	1    11650 1200
	1    0    0    -1  
$EndComp
Wire Wire Line
	11650 1200 11650 2200
Wire Wire Line
	11650 2200 12000 2200
Wire Wire Line
	12000 2100 11100 2100
Wire Wire Line
	11100 2000 12000 2000
Wire Wire Line
	11100 1900 12000 1900
Wire Wire Line
	11100 1800 12000 1800
Wire Wire Line
	11100 1700 12000 1700
Text Label 11100 2100 0    50   ~ 0
CSN
Text Label 11100 1700 0    50   ~ 0
SCK
Text Label 11100 2000 0    50   ~ 0
MOSI
Text Label 11100 1800 0    50   ~ 0
MISO
Text Label 11100 1900 0    50   ~ 0
IRQ
$Comp
L Connector_Generic:Conn_01x03 J28
U 1 1 5E26365B
P 4100 8000
F 0 "J28" H 4018 7675 50  0000 C CNN
F 1 "Charger LED" H 4018 7766 50  0000 C CNN
F 2 "Connector_JST:JST_EH_B3B-EH-A_1x03_P2.50mm_Vertical" H 4100 8000 50  0001 C CNN
F 3 "~" H 4100 8000 50  0001 C CNN
	1    4100 8000
	1    0    0    1   
$EndComp
$Comp
L Connector_Generic:Conn_01x01 J26
U 1 1 5E28A1F5
P 3200 7750
F 0 "J26" H 3118 7525 50  0000 C CNN
F 1 "Red" H 3118 7616 50  0000 C CNN
F 2 "TestPoint:TestPoint_Pad_1.5x1.5mm" H 3200 7750 50  0001 C CNN
F 3 "~" H 3200 7750 50  0001 C CNN
	1    3200 7750
	-1   0    0    1   
$EndComp
$Comp
L Connector_Generic:Conn_01x01 J27
U 1 1 5E28AAB5
P 3200 8150
F 0 "J27" H 3118 7925 50  0000 C CNN
F 1 "Blue" H 3118 8016 50  0000 C CNN
F 2 "TestPoint:TestPoint_Pad_1.5x1.5mm" H 3200 8150 50  0001 C CNN
F 3 "~" H 3200 8150 50  0001 C CNN
	1    3200 8150
	-1   0    0    1   
$EndComp
Wire Wire Line
	3400 8150 3650 8150
Wire Wire Line
	3650 7750 3400 7750
Wire Wire Line
	3650 8000 3900 8000
Wire Wire Line
	3650 7750 3650 8000
Wire Wire Line
	3900 8100 3650 8100
Wire Wire Line
	3650 8100 3650 8150
Wire Wire Line
	3900 7900 3800 7900
Wire Wire Line
	3800 7900 3800 8500
Wire Wire Line
	3800 8500 5350 8500
Wire Wire Line
	5350 8500 5350 8750
Connection ~ 5350 8750
Wire Wire Line
	5350 8750 5650 8750
Text Notes 10950 3150 0    50   ~ 0
Note that 4 pins of J22 and U3 are \nmade to overlap, so that we can save \nspace since we only want one \noption ever
$Comp
L Mechanical:MountingHole H1
U 1 1 5E38CF71
P 11750 9500
F 0 "H1" H 11850 9546 50  0000 L CNN
F 1 "MountingHole" H 11850 9455 50  0000 L CNN
F 2 "MountingHole:MountingHole_3.2mm_M3_DIN965" H 11750 9500 50  0001 C CNN
F 3 "~" H 11750 9500 50  0001 C CNN
	1    11750 9500
	1    0    0    -1  
$EndComp
$Comp
L Mechanical:MountingHole H2
U 1 1 5E38F132
P 11750 9750
F 0 "H2" H 11850 9796 50  0000 L CNN
F 1 "MountingHole" H 11850 9705 50  0000 L CNN
F 2 "MountingHole:MountingHole_3.2mm_M3_DIN965" H 11750 9750 50  0001 C CNN
F 3 "~" H 11750 9750 50  0001 C CNN
	1    11750 9750
	1    0    0    -1  
$EndComp
$EndSCHEMATC
