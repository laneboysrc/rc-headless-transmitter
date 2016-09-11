#include <stdint.h>
#include <stdbool.h>

#include <ESPAsyncWebServer.h>
#include <bridge.h>
extern "C" {
    #include <slip.h>
}

#define MAX_PACKET_SIZE 32

#define MSG_DEBUG 0x00
#define TX_FREE_TO_CONNECT 0x30
#define CFG_REQUEST_TO_CONNECT 0x31
#define CFG_READ 0x72
#define CFG_WRITE 0x77
#define CFG_COPY 0x63
#define CFG_DISCONNECT 0x64
#define TX_INFO 0x49
#define TX_REQUESTED_DATA 0x52
#define TX_WRITE_SUCCESSFUL 0x57
#define TX_COPY_SUCCESSFUL 0x43

#define TX_INFO_CACHE_SIZE 256
#define TX_INFO_ELEMENT_SIZE 6

uint32_t tx_info_cache[TX_INFO_CACHE_SIZE];
bool first_tx_info;


void log_packet(const char *msg, const uint8_t *packet, uint8_t packet_length)
{
    uint16_t offset;
    uint16_t src;
    uint16_t dst;
    uint16_t count;

    if (packet[0] == TX_INFO) {
        return;
    }

    if (packet[0] == TX_FREE_TO_CONNECT) {
        return;
    }

    os_printf("%s ", msg);

    switch (packet[0]) {
        case MSG_DEBUG:
            os_printf("%d %s\n", packet_length, &packet[1]);
            break;

        case TX_FREE_TO_CONNECT:
            os_printf("TX_FREE_TO_CONNECT\n");
            break;

        case CFG_REQUEST_TO_CONNECT:
            os_printf("CFG_REQUEST_TO_CONNECT\n");
            break;

        case CFG_READ:
            offset = (packet[2] << 8) + packet[1];
            count = packet[3];

            os_printf("CFG_READ o=%u, c=%u\n", offset, count);
            break;

        case CFG_WRITE:
            offset = (packet[2] << 8) + packet[1];
            count = packet_length - 3;

            os_printf("CFG_WRITE o=%u, c=%u\n", offset, count);
            break;

        case CFG_COPY:
            src = (packet[2] << 8) + packet[1];
            dst = (packet[4] << 8) + packet[3];
            count = (packet[6] << 8) + packet[5];

            os_printf("CFG_COPY src=%u dst=%u c=%u\n", src, dst, count);
            break;

        case CFG_DISCONNECT:
            os_printf("CFG_DISCONNECT\n");
            break;

        case TX_INFO:
            os_printf("TX_INFO\n");
            break;

        case TX_REQUESTED_DATA:
            offset = (packet[2] << 8) + packet[1];
            count = packet_length - 3;

            os_printf("TX_REQUESTED_DATA o=%u, c=%u\n", offset, count);
            break;

        case TX_WRITE_SUCCESSFUL:
            offset = (packet[2] << 8) + packet[1];
            count = packet[3];

            os_printf("TX_WRITE_SUCCESSFUL o=%u, c=%u\n", offset, count);
            break;

        case TX_COPY_SUCCESSFUL:
            src = (packet[2] << 8) + packet[1];
            dst = (packet[4] << 8) + packet[3];
            count = (packet[6] << 8) + packet[5];

            os_printf("TX_COPY_SUCCESSFUL src=%u dst=%u c=%u\n", src, dst, count);
            break;

        default:
            break;
    }
}


Bridge::Bridge()
{
    _ws = NULL;
    _connected = false;
    _slip.buffer = _slip_buffer;
    _slip.buffer_size = sizeof(_slip_buffer);
    SLIP_init(&_slip);
}

void Bridge::ws_connected(AsyncWebSocket *ws, uint32_t client_id)
{
    const char WS_MAX_PACKETS_IN_TRANSIT[] = {0x42, 5};

    _ws = ws;
    _ws_client_id = client_id;
    _connected = true;

    _ws->binary(_ws_client_id, WS_MAX_PACKETS_IN_TRANSIT, sizeof(WS_MAX_PACKETS_IN_TRANSIT));

    memset(tx_info_cache, 0xa5, sizeof(tx_info_cache));
    first_tx_info = true;
}


void Bridge::ws_disconnected(void)
{
    uint8_t packet[] = {CFG_DISCONNECT};
    uart_send(packet, sizeof(packet));

    _connected = false;
}


// Cache TX_INFO values to data sent to the client (phone)
//
// The transmitter sends a TX_INFO packet every 5 ms. Forwarding these packets
// over the Websocket and having them processed by the configurator client
// can cause quite some load, especially on Smartphones that are power
// conscious.
//
// Within each TX_INFO packet there can be up to 4 info fields, each field
// comprising of an item identifier (uint16_t) and a value (int32_t).
//
// In order to reduce the bandwidth, the bridge holds a cache of info fields.
// If it sees an info field with the same value, it does not send it up via
// the Websocket as it knows that the configurator client has received this
// info already. This assumes that the configurator client caches the info
// itself.
//
// In order to keep the business logic working, upon connection all cachable
// items are initialized with 0xa5a5a5a5 (a value unlikely to appear), and the
// first TX_INFO is always sent along even if it is cached.
bool Bridge::isCached(uint8_t *packet, uint8_t *packet_length)
{
    // Early exit on illegal packets
    if (*packet_length < 1  ||  *packet_length > MAX_PACKET_SIZE) {
        return false;
    }

    if (packet[0] != TX_INFO) {
        return false;
    }

    uint8_t tweaked_packet[MAX_PACKET_SIZE];
    uint8_t tweaked_packet_length = 1;
    uint8_t offset = 1;

    while (*packet_length >= offset + TX_INFO_ELEMENT_SIZE) {
        uint16_t item;
        uint32_t value;

        item = packet[offset] + (packet[offset + 1] << 8);

        if (item < TX_INFO_CACHE_SIZE) {
            value  = packet[offset + 2];
            value += packet[offset + 3] << 8;
            value += packet[offset + 4] << 16;
            value += packet[offset + 5] << 24;

            if (tx_info_cache[item] != value) {
                tx_info_cache[item] = value;

                memcpy(&tweaked_packet[tweaked_packet_length], &packet[offset], TX_INFO_ELEMENT_SIZE);
                tweaked_packet_length += 6;
            }
        }

        offset += TX_INFO_ELEMENT_SIZE;
    }

    if (tweaked_packet_length > 1) {
        tweaked_packet[0] = TX_INFO;
        *packet_length = tweaked_packet_length;
        memcpy(packet, tweaked_packet, tweaked_packet_length);
        first_tx_info = false;
        return false;
    }

    if (first_tx_info) {
        first_tx_info = false;
        return false;
    }

    return true;
}


void Bridge::uart_received(uint8_t byte)
{
    if (SLIP_decode(&_slip, byte)) {
        if (_slip.message_size  &&  _slip.buffer[0] == MSG_DEBUG) {
            log_packet("NRF LOG", _slip.buffer, _slip.message_size);
        }
        else if (_connected) {
            log_packet("nrf->ws", _slip.buffer, _slip.message_size);

            if (!isCached(_slip.buffer, &_slip.message_size)) {
                _ws->binary(_ws_client_id, _slip.buffer, _slip.message_size);
            }
        }

        SLIP_init(&_slip);
    }
}


void Bridge::uart_send(const uint8_t *packet, uint8_t packet_length)
{
    log_packet("ws->nrf", packet, packet_length);

    uint8_t buffer[32 * 2 + 2];
    size_t length = SLIP_encode(packet, packet_length, buffer);
    Serial.write(buffer, length);
}


void Bridge::websocket_received(const uint8_t *packet, uint8_t packet_length)
{
    uart_send(packet, packet_length);
}
