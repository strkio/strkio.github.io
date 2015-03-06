var assign = require('lodash.assign');

// https://code.google.com/p/selenium/wiki/DesiredCapabilities

var webdriverioConfig = {
  desiredCapabilities: JSON.parse(process.env.WEBDRIVER_DESIRED_CAPABILITIES),
  waitforTimeout: 60 * 1000
};
if (process.env.SAUCE_USERNAME && process.env.SAUCE_ACCESS_KEY) {
  assign(webdriverioConfig, {
    host: 'ondemand.saucelabs.com',
    port: 80,
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    logLevel: 'silent',
    seleniumVersion: '2.43.0'
  });
  webdriverioConfig.desiredCapabilities.name ||
  (webdriverioConfig.desiredCapabilities.name = 'strk.io');
}
webdriverioConfig.desiredCapabilities['safari.options'] = {
  cleanSession: true
};

module.exports = webdriverioConfig;
