#include <ESP8266WiFi.h>
#include <ESPAsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <ESPAsyncCaptiveDNS.h>
#include <Hash.h>

#include <bridge.h>


#define HTTP_PORT 80
#define WEBSOCKET_PORT 9706

#define MAX_PACKET_SIZE 32


const char *ssid = "LANE Boys RC";
const char *password = "12345678";
const int channel = 13;

const char *domain = "configurator";


AsyncWebServer http_server(HTTP_PORT);
AsyncWebServer ws_server(WEBSOCKET_PORT);
AsyncWebSocket ws("/");
ESPAsyncCaptiveDNS dns_server;
Bridge bridge;


uint32_t ws_client_id;
bool ws_connected = false;


void flash_led(void)
{
    // Just a brief message on the serial port to make the LED flash
    // '~' has been chosen as it contains a lot of 1 bits
    os_printf("~~~~~~~~~~~~~~~\n");
}


void wsHandler(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void * arg, uint8_t *data, size_t len){
    if (type == WS_EVT_CONNECT) {
        os_printf("ws[%s][%u] connect\n", server->url(), client->id());

        if (ws_connected) {
            os_printf("ws[%s][%u] Already connected, rejecting.\n", server->url(), client->id());
            client->close();
            return;
        }

        ws_client_id = client->id();
        ws_connected = true;
        bridge.ws_connected(server, ws_client_id);
    }

    else if (type == WS_EVT_DISCONNECT) {
        os_printf("ws[%s] disconnect: %u\n", server->url(), client->id());

        if (client->id() == ws_client_id) {
            bridge.ws_disconnected();
            ws_connected = false;
        }
    }

    else if (type == WS_EVT_ERROR) {
        os_printf("ws[%s][%u] error(%u): %s\n", server->url(), client->id(), *((uint16_t*)arg), (char*)data);
    }

    else if (type == WS_EVT_DATA) {
        // Shortcut: since the configuration is only sending messages that are
        // less than 127 bytes long, they always fit in a single frame.
        // We therefore don't have to assemble frames into a message.

        uint8_t packet[MAX_PACKET_SIZE];
        uint8_t packet_length;

        AwsFrameInfo *info = (AwsFrameInfo*)arg;

        if (info->final  &&  info->index == 0  &&  info->len == len) {
            // The whole message is in a single frame and we got all of it's data
            // os_printf("ws[%s][%u] %s-message[%llu]\n", server->url(), client->id(), (info->opcode == WS_TEXT) ? "text":"binary", info->len);

            if (info->opcode == WS_TEXT) {
                os_printf("ws[%s][%u] Received TEXT, ignored.\n", server->url(), client->id());
                return;
            }

            if (info->len > MAX_PACKET_SIZE) {
                os_printf("ws[%s][%u] Packet too long, ignored.\n", server->url(), client->id());
                return;
            }

            packet_length = info->len;
            memcpy(packet, data, info->len);

            bridge.websocket_received(packet, packet_length);
        }
        else {
            //message is comprised of multiple frames or the frame is split into multiple packets
            os_printf("ws[%s][%u] ERROR: Messages spanning multiple frames is not implemented\n", server->url(), client->id());
        }
    }
}


bool filterHost(AsyncWebServerRequest *request) {
    return request->host() == domain;
}


void notFoundHandler(AsyncWebServerRequest *request) {
#ifdef DEBUG
    os_printf("%s HTTP/1.%u %s\n",
        request->methodToString(), request->version(), request->url().c_str());

    os_printf("  host: %s\n", request->host().c_str());

    if (request->contentLength()) {
        os_printf("  ContentType: %s\n", request->contentType().c_str());
        os_printf("  ContentLength: %u\n", request->contentLength());
        os_printf("  Multipart: %s\n", request->multipart() ? "true" : "false");
    }

    int headers = request->headers();
    for (int i = 0; i < headers; i++) {
        AsyncWebHeader* h = request->getHeader(i);
        os_printf("  header: %s=%s\n", h->name().c_str(), h->value().c_str());
    }

    int params = request->params();
    for (int i = 0; i < params; i++) {
        AsyncWebParameter* p = request->getParam(i);
        if (p->isFile()) {
            os_printf("  file: %s = %s, size: %u\n", p->name().c_str(), p->value().c_str(), p->size());
        }
        else {
            os_printf("  param: %s = %s\n", p->name().c_str(), p->value().c_str());
        }
    }
#endif // DEBUG

    // Captive portal: All failed requests using our (fake) domain get a 404,
    // but failed requests to other domains are redirected to our domain
    if (filterHost(request)) {
        request->send(404);
    }
    else {
        request->redirect("http://" + String(domain));
    }
}


String IPAddress2String(const IPAddress& ipAddress)
{
    String result = String(ipAddress[0]) + "." + String(ipAddress[1]) + "." +
        String(ipAddress[2]) + "." + String(ipAddress[3]);

    return result;
}


void setup() {
    Serial.begin(115200);

    // If you want to use the alternate RX/TX pins to connect the nRF51 board
    // uncomment the following line. Note that you still need to disconnect
    // the lines during firmware update via UART.
    // Serial.swap();

    Serial1.begin(115200);
    Serial1.setDebugOutput(true);

    WiFi.mode(WIFI_AP);
    WiFi.softAP(ssid, password, channel);
    // WiFi.softAP(ssid, password, channel, hidden);
    // WiFi.softAPConfig(local_ip, gateway, subnet);

    IPAddress apIP = WiFi.softAPIP();
    os_printf("\nAP IP address: %s\n", IPAddress2String(apIP).c_str());

    SPIFFS.begin();

    ws.onEvent(wsHandler);
    ws_server.addHandler(&ws);
    ws_server.begin();

    // Serve the configurator app from the SPIFFS file system, but only
    // if the HOST matches our (fake) domain.
    http_server.serveStatic("/", SPIFFS, "/")
        .setCacheControl("max-age=86400")
        .setDefaultFile("index.html")
        .setFilter(filterHost);

    http_server.onNotFound(notFoundHandler);
    http_server.begin();

    dns_server.start(apIP);
}


void loop() {
    static unsigned long last_message_ms;
    unsigned long now_ms;

    // Every second show a brief message to let the LED flash
    now_ms = millis();
    if (now_ms > (last_message_ms + 1000)) {
        last_message_ms = now_ms;
        flash_led();
    }

    while (Serial.available()) {
        bridge.uart_received(Serial.read());
    }


}
