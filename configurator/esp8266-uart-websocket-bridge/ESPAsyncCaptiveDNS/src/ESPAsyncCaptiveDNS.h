#ifndef ESPASYNCCAPTIVEDNS_H
#define ESPASYNCCAPTIVEDNS_H

#include <Arduino.h>
#include <ESP8266WiFi.h>

extern "C"{
  #include <lwip/def.h>
  #include <lwip/udp.h>
}


#define DNS_QR_QUERY 0
#define DNS_QR_RESPONSE 1
#define DNS_OPCODE_QUERY 0
#define DNS_NXDOMAIN 3

#define DNS_ANSWER_SIZE 16


typedef struct {
  uint16_t ID;          // Identification number
  uint8_t RD : 1;       // Recursion desired
  uint8_t TC : 1;       // Truncated message
  uint8_t AA : 1;       // Authoritive Answer
  uint8_t OPCODE : 4;   // Message type
  uint8_t QR : 1;       // Query/Response flag
  uint8_t RCODE : 4;    // Response code
  uint8_t Z : 3;        // (reserved)
  uint8_t RA : 1;       // Recursion available
  uint16_t QDCOUNT;     // Number of query entries
  uint16_t ANCOUNT;     // Number of answer entries
  uint16_t NSCOUNT;     // Number of authority entries
  uint16_t ARCOUNT;     // Number of resource entries
} dns_header_t;

typedef struct {
  udp_pcb* pcb;
  struct pbuf *pbuf;
  char *payload;
  struct ip_addr *ip;
  uint16_t port;
} udp_transfer_t;


class ESPAsyncCaptiveDNS
{
  public:
    ESPAsyncCaptiveDNS();
    void start(const IPAddress &our_ip);

  private:
    IPAddress _our_ip;
    uint16_t _port;
    uint32_t _ttl;

    struct udp_pcb *_udp_pcb;
    udp_transfer_t _context;

    String _parse_domain_name(const char *buffer);
    size_t _get_query_size(const char *buffer);
    bool _is_valid_query(const dns_header_t *dns_header);
    void _send_ip_response(void);
    void _send_not_found_response(void);
    void _receive_callback(struct udp_pcb *pcb, struct pbuf *p, struct ip_addr *addr, u16_t port);
    static void _static_receive_callback(void *arg, struct udp_pcb *pcb, struct pbuf *p, struct ip_addr *addr, u16_t port);
};

#endif // ESPASYNCCAPTIVEDNS_H