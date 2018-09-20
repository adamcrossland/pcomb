var gulp = require('gulp');
var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var browserify = require('browserify');
var source = require('vinyl-source-stream');

gulp.task('lib', function (done) {
  gulp.src('src/*.ts')
    .pipe(sourcemaps.init())
    .pipe(ts({
      declarationFiles: true,
      noImplicitAny: true
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist/src'))
    .on('end', function() { done(); });
});

gulp.task('demo', function () {
  gulp.src('app/*.ts')
    .pipe(ts({
      declarationFiles: true,
      sourceMap: true
    }))
    .pipe(gulp.dest('app/'));
});

gulp.task('build-test', function (done) {
  gulp.src('tests/*.ts')
    .pipe(ts({
      declarationFiles: false,
      noImplicitAny: true,
      noEmitOnError: false
    }))
    .pipe(gulp.dest('tests/'))
    .on('end', function() { done(); });
});

gulp.task('run-test', ['build-test'], function (done) {
  var testResult = require("./tests/testrun.js");

  done();
});

gulp.task('browserify', function () {
  return browserify('./app/chattymath.js')
    .bundle()
    .pipe(source('chattybundle.js'))
    .pipe(gulp.dest('./app/'));
});

gulp.task('build-lib', ['lib']);
gulp.task('test', ['build-lib', 'build-test', 'run-test'])
gulp.task('build-all', ['lib', 'test', 'demo', 'browserify']);
gulp.task('build-demo', ['build-lib', 'demo', 'browserify']);