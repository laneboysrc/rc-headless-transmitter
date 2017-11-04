(This is not relevant at the moment, but may become if we reuse the Open Source Multi-protocol transmitter module code)

Hint for compiling .ino files:

    INOFLAGS += -x c
    INOFLAGS += -include stdint.h
    INOFLAGS += -include string.h
    INOFLAGS += -include libs/libopencm3/include/libopencm3/stm32/gpio.h
    INOFLAGS += -include multiprotocol/Pins.h
    INOFLAGS += -include multiprotocol/Multiprotocol.h

    C_OBJECTS = $(addprefix $(OBJECT_DIRECTORY)/, $(patsubst %.ino, %.o, $(C_SOURCE_FILE_NAMES:.c=.o) ))
    vpath %.ino $(C_PATHS)

    # Create objects from .ino source files
    $(OBJECT_DIRECTORY)/%.o : %.ino
        @echo [CC] $(notdir $<)
        $(ECHO)$(CC) $(INOFLAGS) -DNRF24L01_INSTALLED $(INC_PATHS) -c -o $@ $<
