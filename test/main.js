/* jshint node: true */
/* global describe, it, beforeEach */
'use strict';

var runSequence = require('../');
var gulp = require('gulp');
var should = require('should');
require('mocha');

describe('runSequence', function() {
	var runCounter = 0,
		getCounter = function() {
			runCounter++;
			return runCounter;
		},
		simpleTask = function() {
			var task = function(cb) {
				if(task.shouldPause) {
					task.cb = cb;
				} else {
					task.counter = getCounter();
					cb();
				}
			};
			task.shouldPause = false;
			task.counter = -1;
			//noinspection ReservedWordAsName
			task.continue = function(err) {
				if(task.cb) {
					task.counter = getCounter();
					var cb = task.cb;
					delete task.cb;
					cb(err);
				}
			};
			task.reset = function() {
				task.shouldPause = false;
				task.counter = -1;
				delete task.cb;
			};
			return task;
		};
	
	
	var task1 = simpleTask(),
		task2 = simpleTask(),
		task3 = simpleTask(),
		task4 = simpleTask();
	
	gulp.task('task1', task1);
	gulp.task('task2', task2);
	gulp.task('task3', task3);
	gulp.task('task4', ['task3'], task4);
	
	beforeEach(function() {
		runCounter = 0;
		task1.reset();
		task2.reset();
		task3.reset();
		task4.reset();
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
		it('should resolve the promise', function(done) {
			runSequence('task1', 'task4')
                .then(function() {
                    task1.counter.should.eql(1);
                    task2.counter.should.eql(-1);
                    task3.counter.should.eql(2);
                    task4.counter.should.eql(3);
                    done();
               });
		})
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
	
	describe('Error Handling', function() {
		it('should error if no tasks are provided', function() {
			(function() {
				runSequence();
			}).should.throw();
		});
		
		it('should error if a non-string task is provided', function() {
			(function() {
				runSequence(null);
			}).should.throw();
		});
		
		it('should error if a a non-string task is provided as part of a task-list', function() {
			(function() {
				runSequence([true]);
			}).should.throw();
		});
		
		it('should error if an empty task-list is provided', function() {
			(function() {
				runSequence([]);
			}).should.throw();
			(function() {
				runSequence('task1', []);
			}).should.throw();
		});
		
		it('should error if an undefined task is provided', function() {
			(function() {
				runSequence('task1','hello world');
			}).should.throw();
		});
		
		it('should error if an undefined task is provided as part of a task-list', function() {
			(function() {
				runSequence(['task1','hello world']);
			}).should.throw();
		});
	});
	
});