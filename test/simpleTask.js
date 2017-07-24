var runCounter = 0;
var getCounter = function() {
	runCounter++;
	return runCounter;
};
var simpleTask = function() {
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

simpleTask.resetRunCounter = function() {
	runCounter = 0;
};

module.exports = simpleTask;