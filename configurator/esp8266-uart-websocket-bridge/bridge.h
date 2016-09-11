#pragma once

#include <stdint.h>
#include <stdbool.h>

#include <ESPAsyncWebServer.h>
extern "C" {
    #include <slip.h>
}


class Bridge
{
  public:
    Bridge();
    void ws_connected(AsyncWebSocket *ws, uint32_t client_id);
    void ws_disconnected(void);
    void uart_received(uint8_t byte);
    void uart_send(const uint8_t *packet, uint8_t packet_length);
    void websocket_received(const uint8_t *packet, uint8_t packet_length);
    bool isCached(uint8_t *packet, uint8_t *packet_length);

  private:
    AsyncWebSocket *_ws;
    uint32_t _ws_client_id;
    bool _connected;

    slip_t _slip;
    uint8_t _slip_buffer[128];
};