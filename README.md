# run-sequence

[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url]

Runs a sequence of gulp tasks in the specified order.  This function is designed to solve the situation where you have defined run-order, but choose not to or cannot use dependencies.

> ### Please Note
>
> This is intended to be a temporary solution until [orchestrator](https://github.com/robrich/orchestrator/) is updated to support [non-dependent ordered tasks](https://github.com/robrich/orchestrator/issues/21).
> 
> Be aware that this solution is a hack, and may stop working with a future update to orchestrator. 

Each argument to `run-sequence` is run in order.  This works by listening to the `task_stop` and `task_err` events, and keeping track of which tasks have been completed.  You can still run some of the tasks in parallel, by providing an array of task names for one or more of the arguments.

If the final argument is a function, it will be used as a callback after all the functions are either finished or an error has occurred.

## Possible Breaking Change in version 1.0.0

In version 1.0 I've added a check that prevents the same task from showing up within any sequence.  This is to help reduce typo errors, as well as prevent the [silent exit bug when the same task occurred twice in a parallel sequence](https://github.com/OverZealous/run-sequence/issues/13).  The sequence will now fail immediately during the validation stage.

If this breaking change affects you, you'll need to take one of several actions:

1. Remove duplicate tasks if they are a mistake.
2. Filter unneeded duplicate tasks before passing them to `run-sequence`.
3. Rewrite your tasks or wrap your tasks within functions that can be called multiple times if for some reason you rely on this functionality.
4. Continue using `run-sequence` version 0.3.7 if it was working for you.

[I welcome feedback](https://github.com/OverZealous/run-sequence/issues) if this change is a problem for your setup!

## Usage

First, install `run-sequence` as a development dependency:

```shell
npm install --save-dev run-sequence
```

Then add use it in your gulpfile, like so:

```js
var gulp = require('gulp');
var runSequence = require('run-sequence');
var clean = require('gulp-clean');

// This will run in this order:
// * build-clean
// * build-scripts and build-styles in parallel
// * build-html
// * Finally call the callback function
gulp.task('build', function(callback) {
  runSequence('build-clean',
              ['build-scripts', 'build-styles'],
              'build-html',
              callback);
});

// configure build-clean, build-scripts, build-styles, build-html as you
// wish, but make sure they either return a stream or handle the callback
// Example:

gulp.task('build-clean', function() {
    return gulp.src(BUILD_DIRECTORY).pipe(clean());
//  ^^^^^^
//   This is the key here, to make sure tasks run asynchronously!
});

gulp.task('build-scripts', function() {
    return gulp.src(SCRIPTS_SRC).pipe(...)...
//  ^^^^^^
//   This is the key here, to make sure tasks run asynchronously!
});
```

### Using within gulp submodules

If you have a complex gulp setup with your tasks split up across different files, you may get the error that `run-sequence` is unable to find your tasks.  In this case, you can configure `run-sequence` to look at the gulp within the submodule, like so:

```js
// submodule tasks/mygulptask.js

var gulp = require('gulp'), // might be a different instance than the toplevel one
	// this uses the gulp you provide
    runSequence = require('run-sequence').use(gulp);
    
    // ...and then use normally
    runSequence('subtask1', 'subtask2');
```

## Help Support This Project

If you'd like to support this and other OverZealous Creations (Phil DeJarnett) projects, [donate via Gittip][gittip-url]!

[![Support via Gittip][gittip-image]][gittip-url]

## LICENSE

[MIT License](http://en.wikipedia.org/wiki/MIT_License)


[npm-url]: https://npmjs.org/package/run-sequence
[npm-image]: https://badge.fury.io/js/run-sequence.png

[travis-url]: http://travis-ci.org/OverZealous/run-sequence
[travis-image]: https://secure.travis-ci.org/OverZealous/run-sequence.png?branch=master

[gittip-url]: https://www.gittip.com/OverZealous/
[gittip-image]: https://raw2.github.com/OverZealous/gittip-badge/0.1.2/dist/gittip.png
