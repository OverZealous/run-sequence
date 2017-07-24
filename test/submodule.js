var _gulp = require('gulp');
var gulp = new _gulp.Gulp();
var simpleTask = require('./simpleTask');
var runSequence = require('../').use(gulp);

var subtask = simpleTask();

gulp.task('subtask1', subtask);

gulp.task('runSubtask', function() {
	runSequence('subtask1');
});

module.exports = {
	task: subtask,
	runSequence: runSequence,
	gulp: gulp
};