/* jshint node: true */
/* global describe, it, beforeEach */
'use strict';

var runSequence = require('../');
var gulp = require('gulp');
var should = require('should');
var simpleTask = require('./simpleTask');
var submodule = require('./submodule');
require('mocha');

function extend(copy, obj) {
	copy = copy || {};
	Object.keys(obj).forEach(function(k) {
		copy[k] = obj[k];
	});
	return copy;
}

describe('runSequence', function() {
	var task1 = simpleTask();
	var task2 = simpleTask();
	var task3 = simpleTask();
	var task4 = simpleTask();

	gulp.task('task1', task1);
	gulp.task('task2', task2);
	gulp.task('task3', task3);
	gulp.task('task4', ['task3'], task4);
	gulp.task('errTask', function() {
		throw new Error('Error Task');
	});

	beforeEach(function() {
		simpleTask.resetRunCounter();
		task1.reset();
		task2.reset();
		task3.reset();
		task4.reset();
		submodule.task.reset();
	});

	describe('Basics', function() {
		it('should run a single task', function() {
			runSequence('task1');
			task1.counter.should.eql(1);
		});
		it('should run multiple tasks', function() {
			runSequence('task1', 'task2');
			task1.counter.should.eql(1);
			task2.counter.should.eql(2);
		});
		it('should run simultaneous tasks', function() {
			runSequence(['task1', 'task2'], 'task3');
			task1.counter.should.not.eql(-1);
			task2.counter.should.not.eql(-1);
			task3.counter.should.eql(3);
		});
		it('should run task dependencies', function() {
			runSequence('task4');
			task1.counter.should.eql(-1);
			task2.counter.should.eql(-1);
			task3.counter.should.eql(1);
			task4.counter.should.eql(2);
		});
		it('should run task dependencies after previous tasks', function() {
			runSequence('task1', 'task4');
			task1.counter.should.eql(1);
			task2.counter.should.eql(-1);
			task3.counter.should.eql(2);
			task4.counter.should.eql(3);
		});
		it('should handle the callback', function() {
			var wasCalled = false;
			runSequence('task1', 'task4', function(err) {
				should.equal(err, undefined);
				wasCalled = true;
			});
			task1.counter.should.eql(1);
			task2.counter.should.eql(-1);
			task3.counter.should.eql(2);
			task4.counter.should.eql(3);
			//noinspection BadExpressionStatementJS
			wasCalled.should.be.true;
		})
	});

	describe('Input Array Handling', function() {
		it('should not modify passed-in parallel task arrays', function() {
			var taskArray = ['task1', 'task2'];
			runSequence(taskArray);
			taskArray.should.eql(['task1', 'task2']);
		});
	});

	describe('Asynchronous Tasks', function() {
		it('should run a single task', function() {
			task1.shouldPause = true;
			runSequence('task1');
			task1.counter.should.eql(-1);
			task1.continue();
			task1.counter.should.eql(1);
		});
		it('should run multiple tasks', function() {
			task1.shouldPause = true;
			task2.shouldPause = true;
			runSequence('task1', 'task2');
			task1.counter.should.eql(-1);
			task2.counter.should.eql(-1);
			task1.continue();
			task1.counter.should.eql(1);
			task2.counter.should.eql(-1);
			task2.continue();
			task2.counter.should.eql(2);
		});
		it('should run simultaneous tasks', function() {
			task1.shouldPause = true;
			runSequence(['task1', 'task2'], 'task3');
			task1.counter.should.eql(-1);
			task2.counter.should.eql(1);
			task3.counter.should.eql(-1);
			task1.continue();
			task1.counter.should.eql(2);
			task3.counter.should.eql(3);
		});
		it('should run task dependencies', function() {
			task3.shouldPause = true;
			runSequence('task4');
			task3.counter.should.eql(-1);
			task4.counter.should.eql(-1);
			task3.continue();
			task3.counter.should.eql(1);
			task4.counter.should.eql(2);
		});
		it('should run task dependencies after previous tasks', function() {
			task1.shouldPause = true;
			task3.shouldPause = true;
			task4.shouldPause = true;
			runSequence('task1', 'task4');
			task1.counter.should.eql(-1);
			task2.counter.should.eql(-1);
			task3.counter.should.eql(-1);
			task4.counter.should.eql(-1);
			task1.continue();
			task1.counter.should.eql(1);
			task3.counter.should.eql(-1);
			task4.counter.should.eql(-1);
			task3.continue();
			task3.counter.should.eql(2);
			task4.counter.should.eql(-1);
			task4.continue();
			task4.counter.should.eql(3);
		});
	});

	describe('Submodules', function() {
		it('should not be able to see tasks on a different gulp by default', function() {
			// Ensure that the subtask is NOT seen here
			(function() {
				runSequence('runSubtask');
			}).should.throw();
			submodule.task.counter.should.eql(-1);
		});
		it('should be able to see tasks on a different gulp when configured', function() {
			// Now make sure it runs with the internal run-sequence
			(function() {
				submodule.runSequence('runSubtask');
			}).should.not.throw();
			submodule.task.counter.should.eql(1);
		});
	});

	describe('Duplicate Tasks', function() {
		it('should not error if a task is duplicated across tasks-lists', function() {
			(function() {
				runSequence(['task1', 'task2'], ['task3', 'task1']);
			}).should.not.throw();
			task1.counter.should.eql(4);
			task2.counter.should.eql(2);
			task3.counter.should.eql(3);
		});

		it('should not error if a task is duplicated serially', function() {
			(function() {
				runSequence('task1', 'task2', 'task1');
			}).should.not.throw();
			task1.counter.should.eql(3);
			task2.counter.should.eql(2);
		});

		it('should error if a task is duplicated within a parallel array', function() {
			(function() {
				runSequence(['task1', 'task1'], 'task2');
			}).should.throw(/more than once/i);
			shouldNotRunAnything();
		});
	});

	function shouldNotRunAnything() {
		task1.counter.should.eql(-1);
		task2.counter.should.eql(-1);
		task3.counter.should.eql(-1);
		task4.counter.should.eql(-1);
	}

	describe('Error Handling', function() {
		it('should error if no tasks are provided', function() {
			(function() {
				runSequence();
			}).should.throw(/no tasks/i);
			shouldNotRunAnything();
		});

		it('should error if a non-string task is provided', function() {
			(function() {
				runSequence(null);
			}).should.throw(/not a valid task string/i);
			shouldNotRunAnything();
		});

		it('should error if a a non-string task is provided as part of a task-list', function() {
			(function() {
				runSequence([true]);
			}).should.throw(/not a valid task string/i);
			shouldNotRunAnything();
		});

		it('should error if an empty task-list is provided', function() {
			(function() {
				runSequence([]);
			}).should.throw();
			(function() {
				runSequence('task1', []);
			}).should.throw(/empty array/i);
			shouldNotRunAnything();
		});

		it('should error if an undefined task is provided', function() {
			(function() {
				runSequence('task1', 'hello world');
			}).should.throw(/not configured/i);
			shouldNotRunAnything();
		});

		it('should error if an undefined task is provided as part of a task-list', function() {
			(function() {
				runSequence(['task1', 'hello world']);
			}).should.throw(/not configured/i);
			shouldNotRunAnything();
		});

		it('should pass errors to the callback', function() {
			var called = false;
			(function() {
				runSequence('task1', 'errTask', function(err) {
					called = true;
					should(err).be.ok;
				});
			}).should.throw(/Error Task/i);

			called.should.eql(true);
		})

		it('should pass error if gulp execution halted in second execution', function(done) {
			var stopTask = gulp.task('stopTask', function() {
				if(stopTask.shouldStop) {
					gulp.stop();
				}
			});

			stopTask.shouldStop = false;

			var outerTask = gulp.task('outerTask', function(cb) {
				runSequence('task2', ['stopTask', 'task3'], function(err) {
					if(stopTask.shouldStop) {
						try {
							should(err).be.ok;
							err.message.should.equal('orchestration aborted');
						} catch(e) {
							cb();
							return done(e);
						}
						cb();
						done();
					} else {
						cb();
					}
				});
			});

			gulp.start('outerTask', function() {
				stopTask.shouldStop = true;
				task3.shouldPause = true;
				gulp.start('outerTask');
			});
		})
	});

	describe('Options', function() {
		var defaultOptions = extend({}, runSequence.options);
		afterEach(function() {
			extend(runSequence.options, defaultOptions);
		});
		it('should ignore empty errors when configured', function() {
			runSequence.options.ignoreUndefinedTasks = true;
			runSequence('task1', null, undefined, 'task2');
			task1.counter.should.eql(1);
			task2.counter.should.eql(2);
		});
	});

});
