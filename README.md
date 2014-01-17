![status](https://secure.travis-ci.org/OverZealous/gulp-run-sequence.png?branch=master)

gulp-run-sequence
=======

Runs a sequence of gulp tasks in the specified order.  This function is designed to solve the situation where you have defined run-order, but choose not to or cannot use dependencies.

You can still run some of the tasks in parallel, by providing an array of task names.

Usage
-----

You must call the exported function with your gulp instance.

```javascript
var gulp = require('gulp');
var runSequence = require('gulp-run-sequence')(gulp);
var clean = require('gulp-clean');

gulp.task('build', function() {
  runSequence('build-clean', ['build-scripts', 'build-styles'], 'build-html');
});

// configure build-clean, build-scripts, build-styles, build-html as you
// wish, but make sure they either return a stream or handle the callback

gulp.task('build-clean', function() {
	return gulp.src('build').pipe(clean());
});

```

LICENSE
-------

(MIT License)

Copyright (c) 2014 [Phil DeJarnett](http://overzealous.com)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
