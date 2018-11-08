#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

#include <libopencm3/stm32/flash.h>

#include <config.h>
#include <configurator.h>
#include <inputs.h>
#include <persistent_storage.h>


#define FLASH_PAGE_SIZE 1024


static struct {
    bool active;
    uint32_t *version_src;
    uint32_t *version_dst;
    uint32_t *src;
    uint32_t *dst;
    size_t words_remaining;
} store_config = {.active = false};

static bool save_config = false;
static bool save_hardware_input_values = false;


// WARNING: because config_flash is defined as const, the compiler
// optimizes all kind of statements away. Don't put config_flash elements
// in printf as it will not print the actual value in the flash, but
// rather the value it was at compile time!


// ****************************************************************************
void PERSISTENT_STORAGE_init(void)
{
    // Nothing to do here ...
}


// ****************************************************************************
void PERSISTENT_STORAGE_save_config(void)
{
    save_config = true;
}


// ****************************************************************************
void PERSISTENT_STORAGE_save_hardware_input_values(void)
{
    save_hardware_input_values = true;
}


// ****************************************************************************
// This function copies the content of config (RAM) to config_flash (FLASH).
//
// The function writes the first word of the configuration as last item. The
// first word represents the config_version. Since we erasing immediately when
// we write the flash, it stays 0xffffffff until we write it at the end,
// having written all the other bytes. We can therefore use the config_versoin
// as indication that a write was interrupted, e.g. because of power loss.
void PERSISTENT_STORAGE_background_flash_write(void)
{
    if (!store_config.active) {
        // If the configurator is active delay writing to the flash.
        //
        // This is necessary as writing to the flash takes a very long time
        // and more or less halts the CPU. So we can't reliably send RF
        // packets every 5 ms anymore, causing the configurator to loose
        // the hop sequence and therefore the connection.
        if (CONFIGURATOR_is_connected(TRANSPORT_ANY)) {
            return;
        }

        if (save_config) {
            save_config = false;

            store_config.active = true;
            store_config.version_src = (uint32_t *)(&config);
            store_config.version_dst = (uint32_t *)(&config_flash);
            store_config.src = store_config.version_src + 1;
            store_config.dst = store_config.version_dst + 1;
            store_config.words_remaining = sizeof(config) / sizeof(uint32_t) - 1;

            printf("PERSISTENT_STORAGE: saving config to flash ...\n");
            flash_unlock();
            flash_erase_page((uint32_t)store_config.version_dst);
        }
        else if (save_hardware_input_values) {
            save_hardware_input_values = false;

            store_config.active = true;
            store_config.version_src = (uint32_t *)(logical_inputs);
            store_config.version_dst = (uint32_t *)(logical_inputs_flash);
            store_config.src = store_config.version_src + 1;
            store_config.dst = store_config.version_dst + 1;
            store_config.words_remaining = sizeof(logical_inputs) / sizeof(uint32_t) - 1;

            printf("PERSISTENT_STORAGE: saving logical input values to flash ...\n");
            flash_unlock();
            flash_erase_page((uint32_t)store_config.version_dst);
        }
        return;
    }

    if (((uint32_t)store_config.dst % FLASH_PAGE_SIZE) == 0) {
        flash_erase_page((uint32_t)store_config.dst);
    }

    flash_program_word((uint32_t) store_config.dst, *store_config.src);

    ++store_config.src;
    ++store_config.dst;
    --store_config.words_remaining;

    if (store_config.words_remaining == 0) {
        store_config.active = false;
        flash_program_word((uint32_t)store_config.version_dst, *store_config.version_src);
        flash_lock();
        printf("PERSISTENT_STORAGE: done saving to flash.\n");
    }
}

