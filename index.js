/*jshint node:true */

"use strict";

module.exports = function(gulp) {
	return function() {
		var taskSets = Array.prototype.slice.call(arguments);
		
		function runNextSet() {
			if(taskSets.length) {
				var command = taskSets.shift();
				if(!Array.isArray(command)) {
					command = [command];
				}
				gulp.run.apply(gulp, command.concat(runNextSet));
			}
		}
		
		runNextSet();
	};
};

