var gulp = require('gulp-help')(require('gulp'), {description: ''});
var gutil = require('gulp-util');
var $ = require('gulp-load-plugins')();
var through = require('through2');
var runSequence = require('run-sequence');
var del = require('del');
var buildBranch = require('buildbranch');
var webpackMiddleware = require('webpack-dev-middleware');
var webpack = require('webpack');
var portScanner = require('portscanner');
var sauceConnectLauncher = require('sauce-connect-launcher');
var seleniumStandalone = require('selenium-standalone');
var _ = require('lodash');
var async = require('async');
var StreamSlicer = require('stream-slicer');
var connect = require('connect');
var serveStatic = require('serve-static');
var http = require('http');
var path = require('path');
var spawn = require('child_process').spawn;

var bowerDependencies = Object.keys(require('./bower.json').dependencies);

var webpackConfigTemplate = {
  entry: {
    index: './src/scripts/index.js',
    thirdparty:
      _.without(bowerDependencies, 'foundation', 'hint.css', 'normalize.css')
  },
  resolve: {
    modulesDirectories: ['bower_components', 'node_modules'],
    alias: {
      superagent: 'superagent/superagent.js',
      grapnel: 'grapnel/src/grapnel.js'
    }
  },
  externals: {
    jsonify: 'JSON'
  },
  module: {
    noParse: [
      new RegExp('(' + _.without(bowerDependencies,
        'strkio-storage-githubgist'
      ).join('|') + ')')
    ],
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

function httpServer(o, cb) {
  var c = connect();
  o.middleware && (o.middleware.forEach(function (m) { c.use(m); }));
  var roots = Array.isArray(o.root) ? o.root : [o.root];
  roots.forEach(function (r) { c.use(serveStatic(r)); });
  var server = http.createServer(c);
  server.listen(o.port, cb);
  ['exit', 'SIGTERM', 'SIGINT'].forEach(function (e) {
    process.on(e, function () {
      try { server.close(); } catch (e) {}
      setImmediate(process.exit.bind(null, 0));
    });
  });
  return server;
}

gulp.task('build', function (cb) {
  optimize = true;
  runSequence(
    'clean', [
      'build:favicon',
      'build:fonts',
      'build:html',
      'build:scripts',
      'build:stylesheets'
    ],
    'build:rev',
    'build:manifest',
    cb);
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

gulp.task('build:manifest', function () {
  return gulp.src(['build/**'])
    .pipe($.manifest({
      hash: true,
      filename: 'cache.manifest',
      exclude: ['cache.manifest', '404.html']
    }))
    .pipe(gulp.dest('build'));
});

gulp.task('build:rev', function (cb) {
  var revved = [];
  var filter = $.filter(['**', '!index.html', '!404.html']);
  gulp.src([
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
    .on('end', function () {
      del(revved, cb);
    });
});

gulp.task('build:scripts', function (cb) {
  var webpackConfig = Object.create(webpackConfigTemplate);
  if (optimize) {
    webpackConfig.plugins || (webpackConfig.plugins = []);
    webpackConfig.plugins.push(new webpack.DefinePlugin({
      __DEV__: false
    }));
    webpackConfig.plugins.push(new webpack.optimize.CommonsChunkPlugin(
      'thirdparty', 'build/scripts/thirdparty.js'));
    webpackConfig.plugins.push(new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }));
    delete webpackConfig.entry['dev-mode'];
  }
  webpackConfig.output = {filename: 'build/scripts/[name].js'};
  webpack(webpackConfig, function (err, stats) {
    if (err) {
      return cb(err);
    }
    if (!optimize) {
      console.log(stats.toString());
    }
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
  del(['build'], {force: true}, cb);
});

gulp.task('deploy', function (cb) {
  buildBranch({
    ignore: ['bower_components'],
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

gulp.task('serve', ['clean'], function (cb) {
  var webpackConfig = Object.create(webpackConfigTemplate);
  webpackConfig.devtool = 'eval'; // http://webpack.github.io/docs/configuration.html#devtool
  webpackConfig.output = {path: '/', filename: 'scripts/[name].js'};
  webpackConfig.plugins || (webpackConfig.plugins = []);
  webpackConfig.plugins.push(new webpack.DefinePlugin({
    __DEV__: true
  }));
  webpackConfig.plugins.push(new webpack.optimize.CommonsChunkPlugin(
    'thirdparty', 'scripts/thirdparty.js'));
  runSequence(['build:stylesheets', 'build:html'], function () {
    httpServer({
      root: ['build', 'src', '.'],
      port: 8000,
      middleware: [
          webpackMiddleware(webpack(webpackConfig))
      ]
    }, cb);
    gulp.watch(src.css, ['build:stylesheets']);
    gulp.watch(src.js, ['lint:scripts']);
    gulp.watch(src.html, ['build:html']);
  });
});

gulp.task('serve:build', function (cb) {
  httpServer({root: 'build', port: 8000}, cb);
});

gulp.task('launch:sauce-connect', function (cb) {
  var port = 4445;
  portScanner.checkPortStatus(port, 'localhost', function (err, status) {
    if (status === 'open') {
      gutil.log('Sauce Connect must be already running (port ' + port +
        ' is open).');
      cb();
    } else {
      sauceConnectLauncher({
        username: process.env.SAUCE_USERNAME,
        accessKey: process.env.SAUCE_ACCESS_KEY
      }, function (err, sauceConnectProcess) {
        if (process) {
          ['exit', 'SIGTERM', 'SIGINT'].forEach(function (e) {
            process.on(e, function () {
              try { sauceConnectProcess.close(); } catch (e) {}
              setImmediate(process.exit.bind(null, 0));
            });
          });
        }
        cb(err);
      });
    }
  });
});

gulp.task('launch:selenium', function (cb) {
  cb = _.once(cb);
  var options = gutil.env;
  var port = 4444;
  var launchTimeoutInMs = 5000;
  portScanner.checkPortStatus(port, 'localhost', function (err, status) {
    if (status === 'open') {
      gutil.log('Selenium must be already running (port ' + port +
        ' is open).');
      cb();
    } else {
      var selenium = seleniumStandalone({stdio: ['ignore', 'pipe', 'pipe']});
      var launchTimeout;
      ['stderr', 'stdout'].forEach(function (output) {
        selenium[output].on('data', function (data) {
          var l = data.toString();
          if (options.verbose === 'true') {
            gutil.log(l.trim());
          }
          if (~l.indexOf('Started org.openqa.jetty.jetty.Server')) {
            clearTimeout(launchTimeout);
            cb();
          }
        });
      });
      launchTimeout = setTimeout(function () {
        cb(new Error('An attempt to start Selenium timed out (' +
          launchTimeoutInMs + 'ms).'));
      }, launchTimeoutInMs);
    }
  });
});

function buildAndServe(cb) {
  var port = 8000;
  portScanner.checkPortStatus(port, 'localhost', function (err, status) {
    if (status === 'open') {
      gutil.log('HTTP server must be already running (port ' + port +
      ' is open).');
      cb();
    } else {
      runSequence('build', 'serve:build', cb);
    }
  });
}

gulp.task('test:e2e', function (cb) {
  var options = gutil.env;
  var mochaOptions = options.mochaArg || [];
  Array.isArray(mochaOptions) || (mochaOptions = [mochaOptions]);
  var concurrency = options.concurrency || 2;
  var browser = options.browser || 'phantomjs';
  var desiredCapabilities = options.desiredCapabilities;
  desiredCapabilities &&
    (desiredCapabilities = JSON.parse(desiredCapabilities));
  var target = options.target || 'localhost:8000';
  target.match(/^https?:\/\/.*$/i) || (target = 'http://' + target);
  var launchSauceConnect = options.launchSauceConnect !== false;
  if (!desiredCapabilities) {
    if (browser === 'saucelabs') {
      desiredCapabilities = require('./test/sauce-browsers.json');
    } else {
      Array.isArray(browser) || (browser = [browser]);
      desiredCapabilities = browser.map(function (browserName) {
        return {browserName: browserName};
      });
    }
  }
  Array.isArray(desiredCapabilities) ||
    (desiredCapabilities = [desiredCapabilities]);
  var build = options.build;
  if (browser === 'saucelabs') {
    build = require('./package.json').version + '-' + Date.now();
  }
  buildAndServe(function (err) {
    if (err) {
      return cb(err);
    }
    runSequence(
      (function () {
        var r = [];
        if (browser === 'saucelabs') {
          launchSauceConnect && r.push('launch:sauce-connect');
        } else {
          r.push('launch:selenium');
        }
        return r;
      }()),
      function () {
        gutil.log('Starting E2E suite (over ' + desiredCapabilities.length +
        ' browser(s))');
        async.mapLimit(desiredCapabilities, concurrency, function (c, cb) {
          var env = _.clone(process.env);
          if (browser !== 'saucelabs') {
            delete env.SAUCE_USERNAME;
            delete env.SAUCE_ACCESS_KEY;
          }
          env.BASE_URL = target;
          env.WEBDRIVER_DESIRED_CAPABILITIES = JSON.stringify(c);
          env.BUILD = build;
          var id = c.browserName;
          c.version && (id += '/' + c.version);
          c.deviceName && (id += '/' + c.deviceName);
          var reporter = function (slice) {
            slice = slice.toString();
            if (slice.trim().length) {
              gutil.log(id + ': ' + slice.replace(/\r/g, ''));
            }
          };
          var mocha = spawn('mocha', mochaOptions.concat('test/e2e.js'),
            {env: env});
          mocha.stdout.pipe(new StreamSlicer().on('slice', reporter));
          mocha.stderr.pipe(new StreamSlicer().on('slice', reporter));
          mocha.on('close', function (exitCode) {
            cb(null, exitCode);
          });
        }, function (err, exitCodes) {
          if (!err) {
            var failed = exitCodes.some(function (exitCode) {
              return exitCode !== 0;
            });
            if (failed) {
              err = new Error('FAILED');
              err.showStack = false;
            } else {
              gutil.log('SUCCEEDED');
            }
            process.kill(process.pid, 'SIGINT');
          }
          cb(err);
        });
      });
  });
});

gulp.task('test', ['test:e2e']);
