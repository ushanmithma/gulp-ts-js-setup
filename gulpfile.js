// Initizlise modules
const { src, dest, watch, series, parallel } = require('gulp');
const gulpif = require('gulp-if');
const sass = require('gulp-sass')(require('sass'));
const postcss = require('gulp-postcss');
const cssnano = require('cssnano');
const autoprefixer = require('autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const typescript = require('gulp-typescript');
const tsify = require('tsify');
const terser = require('gulp-terser');
typescript.createProject('tsconfig.json');
const browserSync = require('browser-sync').create();

// File paths variables
const files = {
  scssPath: './src/scss/**/*.scss',
  jsPath: './src/js/**/*.js',
  tsPath: './src/ts/**/*.ts'
};

const jsFiles = ['app.js'];
const tsFiles = ['main.ts'];

// Sass task
let sassTask = () => {
  return src(files.scssPath)
    .pipe(gulpif(process.env.NODE_ENV == 'development', sourcemaps.init()))
    .pipe(sass().on('error', sass.logError))
    .pipe(gulpif(process.env.NODE_ENV == 'production', postcss([autoprefixer('since 2015-03-10'), cssnano()])))
    .pipe(gulpif(process.env.NODE_ENV == 'development', sourcemaps.write('.')))
    .pipe(dest('./public/css'));
};

// JavaScript task
let jsTask = (cb) => {
  jsFiles.map((entry) => {
    return browserify({ entries: ['./src/js/' + entry] })
      .transform(babelify, { presets: ['@babel/preset-env'] })
      .bundle()
      .pipe(source(entry))
      .pipe(buffer())
      .pipe(gulpif(process.env.NODE_ENV == 'development', sourcemaps.init({ loadMaps: true })))
      .pipe(gulpif(process.env.NODE_ENV == 'production', uglify()))
      .pipe(gulpif(process.env.NODE_ENV == 'development', sourcemaps.write('./')))
      .pipe(dest('./public/js'));
  });
  cb();
};

// TypeScript task
let tsTask = (cb) => {
  tsFiles.map((entry) => {
    return browserify({ entries: ['./src/ts/' + entry] })
      .plugin(tsify)
      .transform(babelify, { presets: ['@babel/preset-typescript'], extensions: ['.ts'] })
      .bundle()
      .pipe(source('main.js'))
      .pipe(buffer())
      .pipe(gulpif(process.env.NODE_ENV == 'development', sourcemaps.init({ loadMaps: true })))
      .pipe(gulpif(process.env.NODE_ENV == 'production', terser()))
      .pipe(gulpif(process.env.NODE_ENV == 'development', sourcemaps.write('./')))
      .pipe(dest('./public/js'));
  });
  cb();
};

let browserSyncServe = (cb) => {
  browserSync.init({
    server: {
      baseDir: '.'
    }
  });
  cb();
};

let browserSyncReload = (cb) => {
  browserSync.reload();
  cb();
};

// Watch task
let watchTask = () => {
  watch('*.html', browserSyncReload);
  watch([files.scssPath, files.jsPath, files.tsPath], parallel(sassTask, jsTask, tsTask, browserSyncReload));
};

exports.build = series(sassTask, jsTask, tsTask);

exports.watch = series(parallel(sassTask, jsTask, tsTask), browserSyncServe, watchTask);
