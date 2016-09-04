#include <stdint.h>

#include <ESPAsyncWebServer.h>
#include <bridge.h>
extern "C" {
    #include <slip.h>
}


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
    const char WS_MAX_PACKETS_IN_TRANSIT[] = {0x42, 8};

    _ws = ws;
    _ws_client_id = client_id;
    _connected = true;

    _ws->binary(_ws_client_id, WS_MAX_PACKETS_IN_TRANSIT, sizeof(WS_MAX_PACKETS_IN_TRANSIT));
}


void Bridge::ws_disconnected(void)
{
    uint8_t packet[] = {CFG_DISCONNECT};
    uart_send(packet, sizeof(packet));

    _connected = false;
}


void Bridge::uart_received(uint8_t byte)
{
    if (SLIP_decode(&_slip, byte)) {
        if (_connected) {
            log_packet("nrf->ws", _slip.buffer, _slip.message_size);
            _ws->binary(_ws_client_id, _slip.buffer, _slip.message_size);
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
