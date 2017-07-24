/*jshint node:true */

"use strict";

var colors = require('chalk');
var gutil = require('gulp-util');

function options() { return module.exports.options }

function verifyTaskSets(gulp, taskSets, skipArrays) {
	if(taskSets.length === 0) {
		throw new Error('No tasks were provided to run-sequence');
	}

	var foundTasks = {};
	taskSets.forEach(function(t) {
		var isTask = typeof t === "string";
		var isArray = !skipArrays && Array.isArray(t);
		if(!isTask && !isArray) {
			throw new Error("Task " + t + " is not a valid task string.");
		}
		if(isTask && !gulp.hasTask(t)) {
			throw new Error("Task " + t + " is not configured as a task on gulp.  If this is a submodule, you may need to use require('run-sequence').use(gulp).");
		}
		if(skipArrays && isTask) {
			if(foundTasks[t]) {
				throw new Error("Task " + t + " is listed more than once. This is probably a typo.");
			}
			foundTasks[t] = true;
		}
		if(isArray) {
			if(t.length === 0) {
				throw new Error("An empty array was provided as a task set");
			}
			verifyTaskSets(gulp, t, true, foundTasks);
		}
	});
}

function filterArray(arr) {
	return arr.filter(function(t) { return !!t; });
}

function runSequence(gulp) {
	// load gulp directly when no external was passed
	if(gulp === undefined) {
		gulp = require('gulp');
	}

	// Slice and dice the input to prevent modification of parallel arrays.
	var taskSets = Array.prototype.slice.call(arguments, 1).map(function(task) {
		return Array.isArray(task) ? task.slice() : task;
	});
	var callBack = typeof taskSets[taskSets.length - 1] === 'function' ? taskSets.pop() : false;
	var currentTaskSet;

	if(options().ignoreUndefinedTasks) {
		// ignore missing tasks
		taskSets = filterArray(taskSets)
			.map(function(t) {
				if(Array.isArray(t)) {
					return filterArray(t);
				} else {
					return t;
				}
			});
	}

	function finish(e) {
		gulp.removeListener('task_stop', onTaskEnd);
		gulp.removeListener('task_err', onError);

		var error;
		if(e && e.err) {
			error = new gutil.PluginError('run-sequence(' + e.task + ')', e.err, { showStack: options().showErrorStackTrace });
		}

		if(callBack) {
			callBack(error);
		} else if(error) {
			gutil.log(colors.red(error.toString()));
		}
	}

	function onError(err) {
		finish(err);
	}

	function onTaskEnd(event) {
		var idx = currentTaskSet.indexOf(event.task);
		if(idx > -1) {
			currentTaskSet.splice(idx, 1);
		}
		if(currentTaskSet.length === 0) {
			runNextSet();
		}
	}

	function runNextSet() {
		if(taskSets.length) {
			var command = taskSets.shift();
			if(!Array.isArray(command)) {
				command = [command];
			}
			currentTaskSet = command;
			gulp.start.apply(gulp, command);
		} else {
			finish();
		}
	}

	verifyTaskSets(gulp, taskSets);

	gulp.on('task_stop', onTaskEnd);
	gulp.on('task_err', onError);

	runNextSet();
}

module.exports = runSequence.bind(null, undefined);
module.exports.use = function(gulp) {
	return runSequence.bind(null, gulp);
};

module.exports.options = {
	showErrorStackTrace: true,
	ignoreUndefinedTasks: false,
};
