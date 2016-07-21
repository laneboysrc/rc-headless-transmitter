var gulp      = require('gulp');
var simulator = require('tx-simulator');

var simulatorTask = function () {
    simulator.start();
};

gulp.task('txSimulator', simulatorTask);
module.exports = simulatorTask;
