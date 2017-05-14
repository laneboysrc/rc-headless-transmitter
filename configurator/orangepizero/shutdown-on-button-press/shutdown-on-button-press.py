#!/bin/env python

import os
import sys
import time

gpioNumber = "6"
export = '/sys/class/gpio/export'
direction = '/sys/class/gpio/gpio' + gpioNumber + '/direction'
value = '/sys/class/gpio/gpio' + gpioNumber + '/value'
timeout = time.time()

def shutdown():
  print('Shutting down ...')
  os.system('/bin/sh -c "sudo poweroff"')
  sys.exit(0)

try:
  with open(export, 'w') as f:
    f.write(gpioNumber)
except IOError:
  pass

time.sleep(0.1)

with open(direction, 'w') as f:
  f.write('in')

with open(value, 'r') as f:
  print('Monitoring GPIO' + gpioNumber)
  while True:
    f.seek(0)
    newValue = int(f.read())

    if newValue:
      timeout = time.time()


    if (time.time() - timeout) > 2.0:
      shutdown()

    time.sleep(0.1)

