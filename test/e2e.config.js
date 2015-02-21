var config = {
  quiet: false
};

if (process.env.WEBDRIVER_TARGET) {
  config.httpServer = {
    disable: true
  };
  var baseURL = process.env.WEBDRIVER_TARGET;
  config.baseURL = baseURL.match(/^https?:\/\/.*$/i) ?
    baseURL : 'http://' + baseURL;
} else {
  config.httpServer = {
    disable: 'if-port-is-already-open',
    port: 8000,
    root: 'build'
  };
  config.baseURL = 'http://localhost:' + config.httpServer.port;
}

var browser = process.env.WEBDRIVER_BROWSER || 'phantomjs';
if (browser.match(/^sauce(labs)?$/)) {
  config.sauceLabs = {
    username: process.env.SAUCE_USERNAME,
    password: process.env.SAUCE_ACCESS_KEY
  };
  config.sauceConnect = {
    username: process.env.SAUCE_USERNAME,
    accessKey: process.env.SAUCE_ACCESS_KEY
  };
  config.webdriver = {
    host: 'ondemand.saucelabs.com',
    port: 80,
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    logLevel: 'silent',
    desiredCapabilities: [
      {
        browserName: 'chrome',
        version: '40.0',
        platform: 'OS X 10.10'
      },
      {
        browserName: 'firefox',
        version: '35.0',
        platform: 'OS X 10.10'
      }
    ]
  };
  config.webdriver.desiredCapabilities
    .forEach(function (dc) { dc.name = 'strk.io'; });
} else {
  config.webdriver = {
    desiredCapabilities: browser.split(',').map(function (browserName) {
      return {browserName: browserName};
    })
  };
}

config.selenium = {
  disable: 'if-port-is-already-open'
};
config.webdriver.waitforTimeout = 1000;

module.exports = config;
