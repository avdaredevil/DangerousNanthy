const gulp = require('gulp')
const babel = require('gulp-babel')
const pug = require('gulp-pug')
const pump = require('pump')

const roots = {
  src: 'app',
  dest: 'package'
}

const srcs = {
  JS: "app/main.js",//`${roots.src}/*.js`,
  PUG: "app/index.pug"//`${roots.src}/*.pug`
}

const dests = {
  JS: "package/",//`${roots.dest}/main.js`,
  PUG: "package/"//`${roots.dest}/index.html`
}

gulp.task('js', (cb) => {
  pump(
    [
      gulp.src(srcs.JS),
      babel({
        presets: ['es2015', 'stage-0']
      }),
      gulp.dest(dests.JS)
    ],
    cb
  )
})

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
  gulp.watch(srcs.JS, ['js'])
})

gulp.task('default', ['watch'])
