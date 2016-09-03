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
    _ws = ws;
    _ws_client_id = client_id;
    _connected = true;
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
            // send_packet(_slip.buffer, _slip.message_size);
            _ws->binary(_ws_client_id, _slip.buffer, _slip.message_size);
        }

        SLIP_init(&_slip);
    }
}


void Bridge::uart_send(const uint8_t *packet, uint8_t packet_length)
{
    uint8_t buffer[32 * 2 + 2];
    size_t length = SLIP_encode(packet, packet_length, buffer);
    Serial.write(buffer, length);
}


void Bridge::websocket_received(const uint8_t *packet, uint8_t packet_length)
{
    uart_send(packet, packet_length);
}
