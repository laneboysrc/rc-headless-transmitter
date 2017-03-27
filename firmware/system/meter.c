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

    timer_set_oc_mode(TIM4, TIM_OC1, TIM_OCM_PWM1);
    timer_enable_oc_preload(TIM4, TIM_OC1);
    timer_disable_oc_output(TIM4, TIM_OC1);

    timer_set_oc_polarity_low(TIM4, TIM_OC1);
}


// ****************************************************************************
void METER_show_level(uint32_t battery_voltage)
{
    uint32_t period;
    uint32_t duty_cycle;

    // dummy function, remove ...
    period = battery_voltage;
    duty_cycle = battery_voltage;

    // if (config.scalefactor == 0) {
    //     timer_disable_oc_output(TIM4, TIM_OC1);
    //     timer_disable_counter(TIM4);
    //     return;
    // }

    timer_enable_oc_output(TIM4, TIM_OC1);
    timer_enable_counter(TIM4);

    // Map BATTERY_FULL_LEVEL .. BATTERY_LOW_LEVEL to PWM duty cycle 100% .. 50%.
    // Scale by the config value 0..100% (0 means meter off; PWM output disabled)

    // The Timer4 runs at 6 MHz, so we need to set the ARR to that figure
    // divided by the frequency we are looking to generate.
    // period = meter_timer_frequency / frequency;

    // Simple non-linear function to mimic a perceived linear volume level
    // duty_cycle = (period / 2) * volume_factor / 100 * volume_factor / 100 * volume_factor / 100;


    timer_set_period(TIM2, period);
    timer_set_oc_value(TIM2, TIM_OC1, duty_cycle);
}
