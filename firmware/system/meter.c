/*
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

#include <libopencm3/stm32/gpio.h>
#include <libopencm3/stm32/rcc.h>
#include <libopencm3/stm32/timer.h>

#include <battery.h>
#include <config.h>
#include <meter.h>


// ****************************************************************************
#define METER_TIMER_PRESCALER 4

static uint32_t meter_timer_frequency;


// ****************************************************************************
void METER_init(void)
{
    rcc_periph_clock_enable(RCC_TIM4);

    // Remap TIM4_CH4 to GPIOB9
    gpio_set_mode(GPIO_BANK_TIM4_CH4, GPIO_MODE_OUTPUT_50_MHZ, GPIO_CNF_OUTPUT_ALTFN_PUSHPULL, GPIO_TIM4_CH4);

    timer_set_mode(TIM4, TIM_CR1_CKD_CK_INT, TIM_CR1_CMS_EDGE, TIM_CR1_DIR_UP);

    // Timer runs at 24 / 4 = 6 MHz
    timer_enable_preload(TIM4);
    timer_set_prescaler(TIM4, METER_TIMER_PRESCALER - 1);
    meter_timer_frequency = rcc_apb1_frequency / METER_TIMER_PRESCALER;

    // Setting the timer period to 6 MHz / 100 = 60kHz. This gives us a 1%
    // resolution in duty cycle, using direct oc values of 0..100.
    timer_set_period(TIM4, 100);

    timer_set_oc_mode(TIM4, TIM_OC1, TIM_OCM_PWM1);
    timer_enable_oc_preload(TIM4, TIM_OC1);
    timer_disable_oc_output(TIM4, TIM_OC1);

    timer_set_oc_polarity_low(TIM4, TIM_OC1);
}


// ****************************************************************************
void METER_show_level(uint32_t battery_voltage_mv)
{
    uint32_t duty_cycle;

    // Setting meter_pwm_percent to 0 means meter off; PWM output disabled
    if (config.tx.meter_pwm_percent == 0) {
        timer_disable_oc_output(TIM4, TIM_OC1);
        timer_disable_counter(TIM4);
        return;
    }

    timer_enable_oc_output(TIM4, TIM_OC1);
    timer_enable_counter(TIM4);

    if (battery_voltage_mv >= BATTERY_FULL_LEVEL) {
        duty_cycle = 100;
    }
    else if (battery_voltage_mv >= BATTERY_LOW_LEVEL) {
        // Map BATTERY_FULL_LEVEL..BATTERY_LOW_LEVEL to PWM duty cycle 100%..50%.
        duty_cycle = 50 + (50 * ((battery_voltage_mv - BATTERY_LOW_LEVEL) * 100 / (BATTERY_FULL_LEVEL - BATTERY_LOW_LEVEL))) / 100;
    }
    else if (battery_voltage_mv >= BATTERY_VERY_LOW_LEVEL) {
        // Map BATTERY_LOW_LEVEL..BATTERY_VERY_LOW_LEVEL to PWM duty cycle 50%..25%.
        duty_cycle = 25 + (25 * ((battery_voltage_mv - BATTERY_VERY_LOW_LEVEL) * 100 / (BATTERY_LOW_LEVEL - BATTERY_VERY_LOW_LEVEL))) / 100;
    }
    else {
        // At minimum we show 20% meter deflection
        duty_cycle = 20;
    }

    // Scale by the config value 0..100%
    duty_cycle = duty_cycle * config.tx.meter_pwm_percent / 100;

    timer_set_oc_value(TIM2, TIM_OC1, duty_cycle);
}
