'use strict';

const END = 192;
const ESC = 219;
const ESC_END = 220;
const ESC_ESC = 221;

const STATE_IDLE = 0;
const STATE_ESC = 1;
const STATE_OVERFLOW = 2;
const STATE_MESSAGE_RECEIVED = 3;

class Slip {

  constructor(options) {
    this.options = options || {
      max_message_size: 128
    };

    this.state = STATE_IDLE;
    this.message_size = 0;
    this.buffer = new Uint8Array(this.options.max_message_size);
  }


  encode(data) {
    let encoded = new Uint8Array(this.options.max_message_size);
    let encoded_length = 0;
    let max_message_size = this.options.max_message_size;

    function _encode(data, callback)
    {
      if (!callback  ||  data.length == 0) {
        return;
      }

      let length = data.length;
      let index = 0;

      callback(END);

      while (length) {
        switch (data[index]) {
        case END:
          callback(ESC);
          callback(ESC_END);
          break;

        case ESC:
          callback(ESC);
          callback(ESC_ESC);
          break;

        default:
          callback(data[index]);
        }

        --length;
        ++index;
      }

      callback(END);
    }

    function _callback(data) {
      encoded[encoded_length] = data;
      encoded_length += 1;
      if (encoded_length > max_message_size) {
        throw 'options.max_message_size exceeded';
      }
    }

    _encode(data, _callback);
    return encoded.slice(0, encoded_length);
  }


  decode(new_input) {
    // If we are getting called after we received already a complete message,
    // re-initialize for receiving a new message
    if (this.state == STATE_MESSAGE_RECEIVED) {
      this.state = STATE_IDLE;
      this.message_size = 0;
    }

    // If the SLIP message is too long wait until it finishes, then start
    // capturing the next message. This means long messages are simply ignored.
    if (this.state == STATE_OVERFLOW) {
      if (new_input == END) {
        this.state = STATE_IDLE;
        this.message_size = 0;
      }
      return undefined;
    }

    switch (new_input) {
    case END:
      // We return True only if we received a message
      if (this.message_size) {
        this.state = STATE_MESSAGE_RECEIVED;
        return this.buffer.slice(0, this.message_size);
      }
      return undefined;

    case ESC:
      this.state = STATE_ESC;
      break;

    default:
      if (this.state == STATE_ESC) {
        this.state = STATE_IDLE;
        switch (new_input) {
        case ESC_ESC:
          new_input = ESC;
          break;

        case ESC_END:
          new_input = END;
          break;

        // Protocol violation; handle it gracefully by ignoring ESC
        default:
          break;
        }
      }

      if (this.message_size < this.options.max_message_size) {
        this.buffer[this.message_size] = new_input;
        ++this.message_size;
      }
      else {
        this.state = STATE_OVERFLOW;
      }
      break;
    }

    return undefined;
  }
}

module.exports = Slip;
window['Slip'] = new Slip();