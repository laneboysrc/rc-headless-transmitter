#include <stdint.h>

#include <serial_number.h>

// Build a serial number string from the chip's unique ID.
// The input buffer must have a size of at least 9 char.
void SERIAL_NUMBER_get(char *buffer)
{
    volatile uint32_t *unique_id_p = (volatile uint32_t *)0x1FFFF7E8;

    uint8_t i;
    uint32_t unique_id;

    // Combine all unique ID fields into a single 32-bit number
    unique_id = *unique_id_p + *(unique_id_p + 1) + *(unique_id_p + 2);

    // Split the unique ID into 8 nibbles
    for (i = 0; i < 8; i++) {
        buffer[i] = unique_id & 0x0f;
        unique_id = unique_id >> 4;
    }

    // Convert each nibble into a HEX digit
    for (i = 0; i < 8; i++) {
        if (buffer[i] > 9) {
            buffer[i] += 'A' - 10;
        }
        else {
            buffer[i] += '0';
        }
    }

    // Terminate the buffer to form a C-string
    buffer[8] = 0;
}
