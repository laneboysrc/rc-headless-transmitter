ARDUINO_DIR = /opt/arduino-1.6.10/
BUILD_DIR = _build

SINGLE_THREAD = 1

BOARD_TAG = nodemcuv2
FLASH_DEF = 4M1M
UPLOAD_PORT = /dev/ttyUSB3
UPLOAD_SPEED = 460800
UPLOAD_RESET = nodemcu

# Enable logging
CPP_EXTRA = -DDEBUG


DUMMY := $(shell rm -f $(BUILD_DIR)/buildinfo.cpp)

include ./makeEspArduino/makeEspArduino.mk


MKSPIFFS_PATH := $(lastword $(wildcard $(ARDUINO_DIR)/tools/mkspiffs/*))

ifeq ($(FLASH_DEF),4M3M)
	SPIFFS_START = 0x100000
	SPIFFS_END = 0x3FB000
	SPIFFS_SIZE = 0x2FB000
else ifeq ($(FLASH_DEF),4M1M)
	SPIFFS_START = 0x300000
	SPIFFS_END = 0x3FB000
	SPIFFS_SIZE = 0x0FB000
else
	$(error FLASH_DEF is not 4M3M or 4M1M)
endif

SPIFFS_PAGE = 256
SPIFFS_BLOCK = 8192
SPIFFS_DIR := ./data/
SPIFFS_IMAGE := $(BUILD_DIR)/spiffs.image


spiffs:
	$(MKSPIFFS_PATH)/mkspiffs -c $(SPIFFS_DIR) -p $(SPIFFS_PAGE) -b $(SPIFFS_BLOCK) -s $(SPIFFS_SIZE) $(SPIFFS_IMAGE)
	$(ESPTOOL_PATH)/esptool -cd $(UPLOAD_RESET) -cb $(UPLOAD_SPEED) -cp $(UPLOAD_PORT) -ca $(SPIFFS_START) -cf $(SPIFFS_IMAGE)
.PHONY: spiffs

spiffs-webapp: SPIFFS_DIR := ./data.web-app/
spiffs-webapp: SPIFFS_IMAGE := $(BUILD_DIR)/spiffs-webapp.image
spiffs-webapp:
	$(MKSPIFFS_PATH)/mkspiffs -c $(SPIFFS_DIR) -p $(SPIFFS_PAGE) -b $(SPIFFS_BLOCK) -s $(SPIFFS_SIZE) $(SPIFFS_IMAGE)
	$(ESPTOOL_PATH)/esptool -cd $(UPLOAD_RESET) -cb $(UPLOAD_SPEED) -cp $(UPLOAD_PORT) -ca $(SPIFFS_START) -cf $(SPIFFS_IMAGE)
.PHONY: spiffs-webapp

terminal:
	miniterm.py -p $(UPLOAD_PORT) -b 115200 -e
.PHONY: terminal

flash: upload
.PHONY: flash