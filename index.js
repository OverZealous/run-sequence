/*jshint node:true */

"use strict";

var gulp = require('gulp'),
	colors = require('chalk');

function verifyTaskSets(taskSets, skipArrays) {
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
			throw new Error("Task "+t+" is not configured as a task on gulp.");
		}
		if(isArray) {
			if(t.length === 0) {
				throw new Error("An empty array was provided as a task set");
			}
			verifyTaskSets(t, true);
		}
	});
}

function runSequence() {
	var taskSets = Array.prototype.slice.call(arguments),
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
	
	verifyTaskSets(taskSets);
	
	gulp.on('task_stop', onTaskEnd);
	gulp.on('task_err', onError);
	
	runNextSet();
}

module.exports = runSequence;