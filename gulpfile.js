'use strict';

let gulp = require('gulp');
let fs = require('fs');
let exec = require('child_process').exec;
let clean = require('gulp-clean');

let cmd = function (command, callback) {
  let logger = function (data) {
    console.log(data.toString());
  };

  let build = exec(command);
  build.stdout.on('data', logger);
  build.stderr.on('data', logger);
  build.on('exit', callback);
};

gulp.task('build debug', function (callback) {
  cmd('npm run debug', callback);
});

gulp.task('build prod', function (callback) {
  cmd('npm run prod', callback);
});

gulp.task('clean server', function () {
  process.chdir('..');
  return gulp.src(['/src/main/resources/public/*']).pipe(clean());
});

gulp.task('copy to server', function () {
  return gulp.src(['./frontend/dist/frontend/**/*']).pipe(gulp.dest('./server/src/main/resources/public'));
});

gulp.task('Debug', gulp.series('build debug', 'clean server', 'copy to server'));

gulp.task('Production', gulp.series('build prod', 'clean server', 'copy to server'));
