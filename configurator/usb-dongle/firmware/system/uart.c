#include <errno.h>
#include <stdint.h>
#include <stdio.h>
#include <unistd.h>

#include <libopencm3/stm32/gpio.h>
#include <libopencm3/stm32/rcc.h>
#include <libopencm3/stm32/usart.h>
#include <libopencmsis/core_cm3.h>

#include <ring_buffer.h>
#include <uart.h>
#include <watchdog.h>
#include <webusb.h>


// ****************************************************************************
#define PRINTF_BUFFER_SIZE 256
#define RF_TX_BUFFER_SIZE 256


static uint8_t printf_buffer[PRINTF_BUFFER_SIZE];
static RING_BUFFER_T printf_ring_buffer;

static uint8_t rf_tx_buffer[PRINTF_BUFFER_SIZE];
static RING_BUFFER_T rf_tx_ring_buffer;

int _write(int file, char *ptr, int len);


// ****************************************************************************
void UART_init(void)
{
    rcc_periph_clock_enable(RCC_USART1);
    rcc_periph_clock_enable(RCC_USART3);

    RING_BUFFER_init(&printf_ring_buffer, printf_buffer, PRINTF_BUFFER_SIZE);
    RING_BUFFER_init(&rf_tx_ring_buffer, rf_tx_buffer, RF_TX_BUFFER_SIZE);

    // Setup GPIO pins GPIO_USART1_RE_TX on PA9 and GPIO_USART1_RE_RX on PA10
    gpio_set_mode(GPIOA, GPIO_MODE_OUTPUT_50_MHZ,
                    GPIO_CNF_OUTPUT_ALTFN_PUSHPULL, GPIO_USART1_TX);

    gpio_set_mode(GPIOA, GPIO_MODE_INPUT,
                    GPIO_CNF_INPUT_FLOAT, GPIO_USART1_RX);

    // Setup GPIO pin GPIO_USART3_TX on PB10
    gpio_set_mode(GPIOB, GPIO_MODE_OUTPUT_50_MHZ,
                    GPIO_CNF_OUTPUT_ALTFN_PUSHPULL, GPIO_USART3_TX);


    usart_set_baudrate(USART1, 115200);
    usart_set_databits(USART1, 8);
    usart_set_stopbits(USART1, USART_STOPBITS_1);
    usart_set_parity(USART1, USART_PARITY_NONE);
    usart_set_flow_control(USART1, USART_FLOWCONTROL_NONE);
    usart_set_mode(USART1, USART_MODE_TX_RX);

    // Enable USART1 receive interrupt
    USART_CR1(USART1) |= USART_CR1_RXNEIE;

    nvic_enable_irq(NVIC_USART1_IRQ);
    usart_enable(USART1);


    usart_set_baudrate(USART3, 115200);
    usart_set_databits(USART3, 8);
    usart_set_stopbits(USART3, USART_STOPBITS_1);
    usart_set_parity(USART3, USART_PARITY_NONE);
    usart_set_flow_control(USART3, USART_FLOWCONTROL_NONE);
    usart_set_mode(USART3, USART_MODE_TX);

    nvic_enable_irq(NVIC_USART3_IRQ);
    usart_enable(USART3);
}


// ****************************************************************************
void usart1_isr(void)
{
    // Check if we were called because of RXNE
    if (((USART_CR1(USART1) & USART_CR1_RXNEIE) != 0) &&
        ((USART_SR(USART1) & USART_SR_RXNE) != 0)) {

        uint16_t ch = usart_recv(USART1);
        WEBUSB_putc((char) ch);
    }

    // Check if we were called because of TXE
    if (((USART_CR1(USART1) & USART_CR1_TXEIE) != 0) &&
        ((USART_SR(USART1) & USART_SR_TXE) != 0)) {

        uint8_t data;

        // If there is still data in the transmit buffer send the next byte,
        // otherwise disable the TXE interrupt as it is no longer needed.
        if (RING_BUFFER_read_uint8(&rf_tx_ring_buffer, &data)) {
            usart_send(USART1, data);
        }
        else {
            USART_CR1(USART1) &= ~USART_CR1_TXEIE;
        }
    }
}


// ****************************************************************************
void usart3_isr(void)
{
    // Check if we were called because of TXE
    if (((USART_CR1(USART3) & USART_CR1_TXEIE) != 0) &&
        ((USART_SR(USART3) & USART_SR_TXE) != 0)) {

        uint8_t data;

        // If there is still data in the transmit buffer send the next byte,
        // otherwise disable the TXE interrupt as it is no longer needed.
        if (RING_BUFFER_read_uint8(&printf_ring_buffer, &data)) {
            usart_send(USART3, data);
        }
        else {
            USART_CR1(USART3) &= ~USART_CR1_TXEIE;
        }
    }
}


// ****************************************************************************
// Wait until the UART transmit buffer is empty
void UART_sync(void)
{
    while (! RING_BUFFER_is_empty(&printf_ring_buffer)) {
        // Put the CPU to sleep until an interrupt triggers.
        __WFI();

        WATCHDOG_reset();
    }
}


// ****************************************************************************
int _write(int file, char *ptr, int len)
{
    RING_BUFFER_SIZE_T written;

    if (file == STDOUT_FILENO) {
        written = RING_BUFFER_write(&printf_ring_buffer, (uint8_t *)ptr, len);

        // Enable the TXE interrupt for UART3
        USART_CR1(USART3) |= USART_CR1_TXEIE;

        return written;
    }

    if (file == STDERR_FILENO) {
        written = RING_BUFFER_write(&rf_tx_ring_buffer, (uint8_t *)ptr, len);

        // Enable the TXE interrupt for UART1
        USART_CR1(USART1) |= USART_CR1_TXEIE;

        return written;
    }

    errno = EIO;
    return -1;
}