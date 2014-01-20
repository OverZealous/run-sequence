/*jshint node:true */

"use strict";

var colors = require('chalk');
var gulp = require('gulp');

module.exports = function() {
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
				gulp.run.apply(gulp, command);
			} else {
				finish();
			}
		};
	
	gulp.on('task_stop', onTaskEnd);
	gulp.on('task_err', onError);
	
	runNextSet();
};

