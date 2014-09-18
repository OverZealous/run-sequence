/*jshint node:true */

"use strict";

var colors = require('chalk');

function verifyTaskSets(gulp, taskSets, skipArrays) {
	if(taskSets.length === 0) {
		throw new Error('No tasks were provided to run-sequence');
	}
	taskSets.forEach(function(t) {
		var isTask = typeof t === "string",
			isArray = !skipArrays && Array.isArray(t);
		if(!isTask && !isArray) {
			throw new Error("Task "+t+" is not a valid task string.");
		}
		if(isTask && !gulp.hasTask(t)) {
			throw new Error("Task "+t+" is not configured as a task on gulp.  If this is a submodule, you may need to use require('run-sequence').use(gulp).");
		}
		if(isArray) {
			if(t.length === 0) {
				throw new Error("An empty array was provided as a task set");
			}
			verifyTaskSets(gulp, t, true);
		}
	});
}

function runSequence(gulp) {
	var taskSets = Array.prototype.slice.call(arguments, 1),
		callBack = typeof taskSets[taskSets.length-1] === 'function' ? taskSets.pop() : false,
		currentTaskSet,
		
		finish = function(err) {
			gulp.removeListener('task_stop', onTaskEnd);
			gulp.removeListener('task_err', onError);
			if(callBack) {
				callBack(err);
			} else if(err) {
				console.log(colors.red('Error running task sequence:'), err);
			}
		},
		
		onError = function(err) {
			finish(err);
		},
		onTaskEnd = function(event) {
			var idx = currentTaskSet.indexOf(event.task);
			if(idx > -1) {
				currentTaskSet.splice(idx,1);
			}
			if(currentTaskSet.length === 0) {
				runNextSet();
			}
		},
		
		runNextSet = function() {
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
		};
	
	verifyTaskSets(gulp, taskSets);
	
	gulp.on('task_stop', onTaskEnd);
	gulp.on('task_err', onError);
	
	runNextSet();
}

module.exports = runSequence.bind(null, require('gulp'));
module.exports.use = function(gulp) {
	return runSequence.bind(null, gulp);
};