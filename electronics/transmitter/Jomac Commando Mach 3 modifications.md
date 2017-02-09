This file documents the modifications done to integrate the Headless Tx into the Jomac Commando Mach 3 transmitter.

The goal is to do as little as possible modifications to the transmitter so that it can be converted back to original condition easily.


- Connect GND to Jomac PCB GND
- Connect 3V3 for pots to Orange wire (colors refer to Jomac wiring)
- Connect ST pot lightblue wire to GND
- Connect unused terminal of ST-trim pot to GND
- Connect TH pot / D1 wire to GND
- Connect wipers of ST pot, ST-trim pot and TH pot to respective Headless Tx analog inputs

Isolate the ST-trim pot:
- Disconnect one side of R14

Isolate the LED and power:
- Disconnect one side of R18

Isolate the power switch:
- Disconnect one side of L1
- Disconnect one side of C16 (could stay in place, but just to be safe as it is an old capacitor)
- Disconnect one side of R19

- Replace the LED with a high-brightness one (original LED is kept untouched, just removed from the housing and safely tucked away)