var gulp = require('gulp-help')(require('gulp'), {description: ''});
var $ = require('gulp-load-plugins')();
var through = require('through2');
var runSequence = require('run-sequence');
var del = require('del');
var buildBranch = require('buildbranch');
var webpackMiddleware = require('webpack-dev-middleware');
var webpack = require('webpack');
var path = require('path');

var webpackConfigTemplate = {
  entry: {
    index: './src/scripts/index.js',
    thirdparty: [
      'd3', 'moment', 'pikaday', 'query-string', 'superagent', 'vue',
      'fastclick', 'strkio-storage-githubgist'
    ]
  },
  resolve: {
    modulesDirectories: ['bower_components', 'node_modules'],
    alias: {
      superagent: 'superagent/superagent.js'
    }
  },
  externals: {
    jsonify: 'JSON'
  },
  module: {
    noParse: [/(d3|moment|pikaday|query-string|superagent|vue|fastclick)/],
    loaders: [
      {
        test: /\.html/,
        loader: 'html',
        query: {
          removeRedundantAttributes: false // because of foundation
        }
      }
    ]
  },
  plugins: [
    new webpack.ResolverPlugin(
      new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin(
        '.bower.json', ['main']
      )
    ),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
  ]
};

var optimize = false;

var src = {
  js: ['gulpfile.js', 'src/scripts/**/*.js'],
  css: 'src/stylesheets/**/*.css',
  html: 'src/*.html'
};

gulp.task('build', function (cb) {
  optimize = true;
  runSequence('clean', [
    'build:favicon',
    'build:fonts',
    'build:html',
    'build:scripts',
    'build:stylesheets'
  ], 'build:rev', cb);
});

gulp.task('build:favicon', function () {
  gulp.src('src/favicon.ico')
    .pipe(gulp.dest('build'));
});

gulp.task('build:fonts', function () {
  return gulp.src('src/fonts/*.ttf', {base: 'src'})
    .pipe(gulp.dest('build'));
});

gulp.task('build:html', function () {
  var htmlminConfig = {};
  var preprocessctx = {};
  if (optimize) {
    htmlminConfig.removeComments = true;
    htmlminConfig.collapseWhitespace = true;
    preprocessctx.NODE_ENV = 'production';
  }
  return gulp.src(src.html)
    .pipe($.preprocess({context: preprocessctx}))
    .pipe($.htmlmin(htmlminConfig))
    .pipe(gulp.dest('build'));
});

gulp.task('build:rev', function () {
  var revved = [];
  var filter = $.filter(['**', '!index.html']);
  return gulp.src([
    'build/scripts/*.js',
    'build/stylesheets/*.css',
    'build/favicon.ico',
    'build/index.html'
  ], {base: path.join(__dirname, 'build')})
    .pipe(filter)
    .pipe($.rev())
    .pipe(filter.restore())
    .pipe(through.obj(function (file, enc, callback) {
      if (file.revOrigPath) {
        revved.push(file.revOrigPath);
      }
      this.push(file);
      callback();
    }))
    .pipe($.revReplace({replaceInExtensions: '.html'}))
    .pipe(gulp.dest('build'))
    .on('end', function (cb) {
      del(revved, cb);
    });
});

gulp.task('build:scripts', function (cb) {
  var webpackConfig = Object.create(webpackConfigTemplate);
  if (optimize) {
    webpackConfig.plugins || (webpackConfig.plugins = []);
    webpackConfig.plugins.push(new webpack.optimize.CommonsChunkPlugin(
      'thirdparty', 'build/scripts/thirdparty.js'));
    webpackConfig.plugins.push(new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }));
  }
  webpackConfig.output = {filename: 'build/scripts/[name].js'};
  webpack(webpackConfig, function (err, stats) {
    if (err) {
      return cb(err);
    }
    console.log(stats.toString());
    cb();
  });
});

gulp.task('build:stylesheets', function () {
  return gulp.src([
    'src/stylesheets/index.css',
    'src/stylesheets/thirdparty.css' // todo: replace with concat
  ], {base: 'src'})
    .pipe($.myth())
    .on('error', console.log)
    .pipe(optimize ? $.csso() : through.obj())
    .pipe(gulp.dest('build'));
});

gulp.task('clean', function (cb) {
  del(['build'], cb);
});

gulp.task('deploy', function (cb) {
  buildBranch({
    folder: 'build',
    domain: 'strk.io',
    branch: 'master'
  }, cb);
});

gulp.task('lint', ['lint:scripts']);

gulp.task('lint:scripts', function () {
  return gulp.src(src.js)
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe($.jscs());
});

gulp.task('serve', ['build:stylesheets', 'build:html'], function () {
  var webpackConfig = Object.create(webpackConfigTemplate);
  webpackConfig.devtool = 'eval'; // http://webpack.github.io/docs/configuration.html#devtool
  webpackConfig.output = {path: '/', filename: 'scripts/index.js'};
  webpackConfig.plugins || (webpackConfig.plugins = []);
  webpackConfig.plugins.push(new webpack.optimize.CommonsChunkPlugin(
    'thirdparty', 'scripts/thirdparty.js'));
  $.connect.server({
    root: ['build', 'src', '.'],
    port: 8000,
    middleware: function () {
      return [
        webpackMiddleware(webpack(webpackConfig))
      ];
    }
  });
  gulp.watch(src.css, ['build:stylesheets']);
  gulp.watch(src.js, ['lint:scripts']);
  gulp.watch(src.html, ['build:html']);
});

gulp.task('serve:build', function () {
  $.connect.server({root: 'build', port: 9000});
});

gulp.task('usemin', function () {
  return gulp.src('src/index.html')
    .pipe($.usemin())
    .pipe(gulp.dest('build/'));
});
