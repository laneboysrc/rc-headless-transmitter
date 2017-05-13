var Gpio = require('onoff').Gpio;
var childProcess = require('child_process');

const gpioNumber = 10;

var button = new Gpio(gpioNumber, 'in', 'both');
var timer = null;

console.log('Monitoring GPIO' + gpioNumber);

function shutdown() {
  console.log('Shutting down!');
  childProcess.exec('sudo /bin/sh -c "poweroff"');
}

button.watch((err, value) => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }

  if (!value) {
    timer = setTimeout(shutdown, 2000);
    console.log('Checking if button is held for more than 2 seconds ...');
  }
});
