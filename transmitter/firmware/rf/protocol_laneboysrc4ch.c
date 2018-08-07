#include <protocol_laneboysrc4ch.h>
#include <protocol_hk310.h>

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
