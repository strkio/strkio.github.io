var ErrorHandler = require('webdriverio/lib/utils/ErrorHandler');

/**
 * webdriver.localStorage shim for PhantomJSDriver (which does not support
 * org.openqa.selenium.html5.WebStorage at the moment).
 */
module.exports = function (command, cb) {
  if (command === 'DELETE') {
    this.execute('window.localStorage.clear();', cb);
  } else {
    cb(new ErrorHandler.ProtocolError('Command ' + command +
    ' isn\'t supported'));
  }
};
