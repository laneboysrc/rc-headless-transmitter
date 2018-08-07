#include <protocol_laneboysrc4ch.h>
#include <protocol_hk310.h>

/* ****************************************************************************

RF protocol compatible with the LANE Boys RC nrf24le01-rc receiver.

This protocol is mostly like the HK310 protocol, but with the two unused bytes
utilized to transmit a 4th channel.

To distinguish between the HK310 and the LANEBoysRC-4CH protocol the following
data has been changed:
- Stick data uses packet id 0x56 (instead of 0x55)
- Failsafe data uses packet id 0xab (instead of 0xaa)
- The first bind packet uses 0xff 0xab 0x56 as special marker (instead of 0xff 0xaa 0x55)

Since the protocol is almost identical to the HK310 its actual implementation
has been merged into "protocol_hk310.c".

*/

// ****************************************************************************
void PROTOCOL_LANEBOYSRC4CH_init(void)
{
    PROTOCOL_HK310_init_ex(4);
}

// ****************************************************************************
void PROTOCOL_LANEBOYSRC4CH_enable_binding(void)
{
    PROTOCOL_HK310_enable_binding();
}

// ****************************************************************************
void PROTOCOL_LANEBOYSRC4CH_disable_binding(void)
{
    PROTOCOL_HK310_disable_binding();
}
