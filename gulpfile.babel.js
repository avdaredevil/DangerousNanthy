const gulp = require('gulp')
const pug = require('gulp-pug')
const pump = require('pump')

const roots = {
  src: 'app',
  dest: 'package'
}

const srcs = {
  JS: `${roots.src}/*.js`,
  PUG: `${roots.src}/*.pug`
}

const dests = {
  JS: `${roots.dest}/main.js`,
  PUG: `${roots.dest}/index.html`
}

gulp.task('pug', (cb) => {
  pump(
    [
      gulp.src(srcs.PUG),
      pug(),
      gulp.dest(dests.PUG)
    ],
    cb
  )
})

gulp.task('watch', _ => {
  gulp.watch(srcs.PUG, ['pug'])
})

gulp.task('default', ['watch'])
