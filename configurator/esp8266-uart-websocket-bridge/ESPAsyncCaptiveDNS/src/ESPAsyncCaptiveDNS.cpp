#include "ESPAsyncCaptiveDNS.h"

// ***************************************************************************
// Simple DNS server for the ESP8266 that redirects all domain name request to
// a single IP address.
//
// Compared to the DNSServer module that comes with the ESP8266 Arduino this
// module provides the following functionality:
//  - Fully asynchronous operation using LWIP
//  - Able to handle requests that contain AR entries (e.g. from the dig command)
//  - Don't respond to the local. domain (which interferes with avahi on Linux)
//
//
// For a good reference about DNS packet structure please refer to:
// http://www.ccs.neu.edu/home/amislove/teaching/cs4700/fall09/handouts/project1-primer.pdf


// ***************************************************************************
ESPAsyncCaptiveDNS::ESPAsyncCaptiveDNS()
{
  _port = 53;
  _ttl = 30;
}


// ***************************************************************************
void ESPAsyncCaptiveDNS::start(const IPAddress &our_ip)
{
  _our_ip = our_ip;

  _udp_pcb = udp_new();
  udp_bind(_udp_pcb, IP_ADDR_ANY, _port);
  udp_recv(_udp_pcb, &_static_receive_callback, this);
}


// ***************************************************************************
void ESPAsyncCaptiveDNS::_static_receive_callback(void *arg, struct udp_pcb *pcb, struct pbuf *pbuf, struct ip_addr *ip, u16_t port) {
  reinterpret_cast<ESPAsyncCaptiveDNS*>(arg)->_receive_callback(pcb, pbuf, ip, port);
}


// ***************************************************************************
void ESPAsyncCaptiveDNS::_receive_callback(udp_pcb* pcb, struct pbuf *pbuf, struct ip_addr *ip, u16_t port) {
  if (pbuf == NULL) {
    return;
  }

  if (pbuf->payload == NULL  ||  pbuf->len == 0) {
    pbuf_free(pbuf);
    return;
  }

  _context.pcb = pcb;
  _context.pbuf = pbuf;
  _context.payload = (char *)pbuf->payload;
  _context.ip = ip;
  _context.port = port;

  const char *query = _context.payload + sizeof(dns_header_t);
  String query_domain = _parse_domain_name(query);

#ifdef DEBUG
  os_printf("Query for domain: %s\n", query_domain.c_str());
#endif

  if (_is_valid_query((dns_header_t *)_context.payload)) {
    // Reply NXDOMAIN to 'local' to keep mDNS from working on Linux, otherwise
    // respond with our IP address
    if (query_domain == "local.") {
      _send_not_found_response();
    }
    else {
      _send_ip_response();
    }
  }

  pbuf_free(pbuf);
}


// ***************************************************************************
// A query is valid when the DNS header indicates the QR flag, has a query
// opcode and a query count of 1
bool ESPAsyncCaptiveDNS::_is_valid_query(const dns_header_t *dns_header)
{
  if (dns_header->QR != DNS_QR_QUERY) {
    return false;
  }

  if (dns_header->OPCODE != DNS_OPCODE_QUERY) {
    return false;
  }

  if (ntohs(dns_header->QDCOUNT) != 1) {
    return false;
  }

#ifdef DEBUG
  if (ntohs(dns_header->ARCOUNT) != 0) {
    os_printf("ARCOUNT = %u\n", ntohs(dns_header->ARCOUNT));
  }

  if (ntohs(dns_header->NSCOUNT) != 0) {
    os_printf("NSCOUNT = %u\n", ntohs(dns_header->NSCOUNT));
  }
#endif

  return true;
}


// ***************************************************************************
String ESPAsyncCaptiveDNS::_parse_domain_name(const char *buffer)
{
  String parsed_name = "";

  if (buffer == NULL) {
    return parsed_name;
  }

  while (true) {
    unsigned char label_length = *(buffer++);

    if (label_length == 0) {
      parsed_name.toLowerCase();
      return parsed_name;
    }

    for (int i = 0; i < label_length; i++) {
      parsed_name += *(buffer++);
    }

    parsed_name += ".";
  }
}


// ***************************************************************************
size_t ESPAsyncCaptiveDNS::_get_query_size(const char *buffer)
{
  size_t size = 0;

  if (buffer == NULL) {
    return 0;
  }

  while (true) {
    unsigned char label_length = *(buffer++);
    ++size;

    if (label_length == 0) {
      return size + 4;          // Domain name size + type + class
    }

    size += label_length;
    buffer += label_length;
  }
}


// ***************************************************************************
void ESPAsyncCaptiveDNS::_send_ip_response(void)
{
  // Deal with ARCOUNT and NSCOUNT not being 0. We need to find out
  // the size of the QUERY section and ignore the rest

  const char *query = _context.payload + sizeof(dns_header_t);
  size_t query_size = _get_query_size(query);

  if (query_size == 0) {
#ifdef DEBUG
    os_printf("Failed to retrieve query size\n");
#endif
    return;
  }

  size_t answerSize = sizeof(dns_header_t) + query_size + DNS_ANSWER_SIZE;

  struct pbuf *p = pbuf_alloc(PBUF_TRANSPORT, answerSize, PBUF_RAM);

  if (p == NULL) {
#ifdef DEBUG
    os_printf("Failed to allocate pbuf\n");
#endif
    return;
  }

  // Copy the header and query into the answer and modify it into a
  // response packet
  memcpy(p->payload, _context.pbuf->payload, sizeof(dns_header_t) + query_size);

  dns_header_t *dnsHeader = (dns_header_t *)p->payload;
  dnsHeader->QR = DNS_QR_RESPONSE;
  dnsHeader->ANCOUNT = htons(1);
  dnsHeader->NSCOUNT = htons(0);
  dnsHeader->ARCOUNT = htons(0);

  // Note: the fields in the answer section are in network byte order (big endian)
  uint8_t *answer = (uint8_t *)(p->payload) + sizeof(dns_header_t) + query_size;

  // Use DNS Packet Compression by reusing the domain name that is part of the
  // query section. That name starts right after the DNS header.
  // The pointer is identified by the most significant 2 bis being set.
  *(answer++) = (0xc000 + sizeof(dns_header_t)) >> 8;
  *(answer++) = (0xc000 + sizeof(dns_header_t));

  *(answer++) = 0x00;               // 0x0001: Answer is of TYPE A query (host address)
  *(answer++) = 0x01;

  *(answer++) = 0x00;               // 0x0001: Answer is of CLASS IN (internet address)
  *(answer++) = 0x01;

  *(answer++) = _ttl >> 24;
  *(answer++) = _ttl >> 16;
  *(answer++) = _ttl >> 8;
  *(answer++) = _ttl;

  *(answer++) = 0x00;               // 0x0004: RDLENGTH is 4 bytes (IPV4)
  *(answer++) = 0x04;

  *(answer++) = _our_ip[0];         // Set the IP address as RDATA. It is already in network byte order
  *(answer++) = _our_ip[1];
  *(answer++) = _our_ip[2];
  *(answer++) = _our_ip[3];

#ifdef DEBUG
  union {
    uint8_t f[4];
    struct ip_addr w;
  } source_ip;

  source_ip.w = *_context.ip;

  os_printf("  Sending response to %d.%d.%d.%d:%d\n",
    source_ip.f[0], source_ip.f[1], source_ip.f[2], source_ip.f[3], _context.port);
#endif

  udp_sendto(_context.pcb, p, _context.ip, _context.port);
  pbuf_free(p);
}


// ***************************************************************************
void ESPAsyncCaptiveDNS::_send_not_found_response(void)
{
  // Build the response packet from the query by modifying a few fields
  dns_header_t *header = (dns_header_t *)_context.payload;

  header->QR = DNS_QR_RESPONSE;
  header->RCODE = DNS_NXDOMAIN;

#ifdef DEBUG
  os_printf("  Sending NOT FOUND to 0x%x, %d\n", *_context.ip, _context.port);
#endif

  udp_sendto(_context.pcb, _context.pbuf, _context.ip, _context.port);
}


