import gulp from 'gulp';
import babel from 'gulp-babel';
import pug from 'gulp-pug';
import terser from 'gulp-terser';
import browserSync from 'browser-sync';

const server = browserSync.create();

const paths = {
  scripts: {
    src: 'app/main.js',
    dest: 'package/'
  },
  templates: {
    src: 'app/index.pug',
    dest: 'package/'
  },
  assets: {
    src: 'assets/**/*',
    dest: 'package/assets/'
  }
};

// JavaScript transpilation and minification
export function scripts() {
  return gulp.src(paths.scripts.src)
    .pipe(babel())
    .pipe(terser())
    .pipe(gulp.dest(paths.scripts.dest))
    .pipe(server.stream());
}

// Pug template compilation
export function templates() {
  return gulp.src(paths.templates.src)
    .pipe(pug())
    .pipe(gulp.dest(paths.templates.dest))
    .pipe(server.stream());
}

// Copy assets - with binary file handling for WSL
export function assets() {
  return gulp.src(paths.assets.src, { 
    encoding: false,  // Treat as binary files
    buffer: true,     // Buffer the files
    removeBOM: false  // Don't remove BOM
  })
    .pipe(gulp.dest(paths.assets.dest));
}

// Watch files for changes
export function watch() {
  gulp.watch(paths.scripts.src, scripts);
  gulp.watch(paths.templates.src, templates);
  gulp.watch(paths.assets.src, assets);
}

// Serve files with BrowserSync
export function serve(done) {
  server.init({
    server: {
      baseDir: './package',
      routes: {
        '/assets': './package/assets'
      }
    },
    port: 5000,
    open: false,
    notify: false
  });
  done();
}

// Build task
export const build = gulp.parallel(scripts, templates, assets);

// Default task - development mode
export default gulp.series(
  build,
  gulp.parallel(serve, watch)
);
