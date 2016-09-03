#include <ESP8266WiFi.h>
#include <ESPAsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <ESPAsyncCaptiveDNS.h>
#include <Hash.h>


#define HTTP_PORT 80
#define WEBSOCKET_PORT 9706

const char *ssid = "ESP8266-WLA";
const char *password = "12345678";
const char *domain = "configurator";


AsyncWebServer http_server(HTTP_PORT);
AsyncWebServer ws_server(WEBSOCKET_PORT);
AsyncWebSocket ws("/");
ESPAsyncCaptiveDNS dns_server;


void wsHandler(AsyncWebSocket * server, AsyncWebSocketClient * client, AwsEventType type, void * arg, uint8_t *data, size_t len){
    if (type == WS_EVT_CONNECT) {
        os_printf("ws[%s][%u] connect\n", server->url(), client->id());
        client->printf("Hello Client %u :)", client->id());
        client->ping();
    }
    else if (type == WS_EVT_DISCONNECT) {
        os_printf("ws[%s][%u] disconnect: %u\n", server->url(), client->id());
    }
    else if (type == WS_EVT_ERROR) {
        os_printf("ws[%s][%u] error(%u): %s\n", server->url(), client->id(), *((uint16_t*)arg), (char*)data);
    }
    else if (type == WS_EVT_PONG) {
        os_printf("ws[%s][%u] pong[%u]: %s\n", server->url(), client->id(), len, (len) ? (char*)data : "");
    }
    else if (type == WS_EVT_DATA) {
        AwsFrameInfo * info = (AwsFrameInfo*)arg;
        String msg = "";

        if (info->final  &&  info->index == 0  &&  info->len == len) {
            // The whole message is in a single frame and we got all of it's data
            os_printf("ws[%s][%u] %s-message[%llu]: ", server->url(), client->id(), (info->opcode == WS_TEXT) ? "text":"binary", info->len);

            if (info->opcode == WS_TEXT) {
                for (size_t i = 0; i < info->len; i++) {
                    msg += (char)data[i];
                }
                os_printf("%s\n", msg.c_str());
                client->text("I got your text message");
            }
            else {
                char buff[3];
                for(size_t i = 0; i < info->len; i++) {
                    sprintf(buff, "%02x ", (uint8_t)data[i]);
                    msg += buff ;
                }
                os_printf("%s\n", msg.c_str());
                client->text("I got your binary message");
            }
        }
        else {
            //message is comprised of multiple frames or the frame is split into multiple packets
            if (info->index == 0) {
                if (info->num == 0)
                    os_printf("ws[%s][%u] %s-message start\n", server->url(), client->id(), (info->message_opcode == WS_TEXT) ? "text" : "binary");
                os_printf("ws[%s][%u] frame[%u] start[%llu]\n", server->url(), client->id(), info->num, info->len);
            }

            os_printf("ws[%s][%u] frame[%u] %s[%llu - %llu]: ", server->url(), client->id(), info->num, (info->message_opcode == WS_TEXT) ? "text" : "binary", info->index, info->index + len);

            if (info->opcode == WS_TEXT) {
                for(size_t i=0; i < info->len; i++) {
                    msg += (char)data[i];
                }
            }
            else {
                char buff[3];
                for(size_t i=0; i < info->len; i++) {
                    sprintf(buff, "%02x ", (uint8_t)data[i]);
                    msg += buff ;
                }
            }
            os_printf("%s\n", msg.c_str());

            if ((info->index + len) == info->len){
                os_printf("ws[%s][%u] frame[%u] end[%llu]\n", server->url(), client->id(), info->num, info->len);
                if (info->final) {
                    os_printf("ws[%s][%u] %s-message end\n", server->url(), client->id(), (info->message_opcode == WS_TEXT)?"text":"binary");
                    if (info->message_opcode == WS_TEXT) {
                        client->text("I got your text message");
                    }
                    else {
                        client->text("I got your binary message");
                    }
                }
            }
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


void setup() {
    Serial.begin(115200);
    Serial.setDebugOutput(true);

    WiFi.mode(WIFI_AP);
    // WiFi.softAP(ssid, password);

    IPAddress apIP = WiFi.softAPIP();
    Serial.print("\nAP IP address: ");
    Serial.println(apIP);

    SPIFFS.begin();

    ws.onEvent(wsHandler);
    ws_server.addHandler(&ws);
    ws_server.begin();

    // Serve the configurator app from the SPIFFS file system, but only
    // if the HOST matches our (fake) domain.
    http_server.serveStatic("/", SPIFFS, "/").setDefaultFile("index.html").setFilter(filterHost);;
    http_server.onNotFound(notFoundHandler);
    http_server.begin();

    dns_server.start(apIP);
}


void loop() {
    // Nothing to do, everything is asynchonous based on callbacks
}
