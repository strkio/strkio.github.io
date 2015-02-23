var ErrorHandler = require('webdriverio/lib/utils/ErrorHandler');

/**
 * webdriver.localStorage shim (for drivers which do not support
 * org.openqa.selenium.html5.WebStorage).
 *
 * @see https://code.google.com/p/selenium/issues/detail?id=8420
 */
module.exports = function (command, cb) {
  if (command === 'DELETE') {
    this.execute('window.localStorage.clear();', cb);
  } else {
    cb(new ErrorHandler.ProtocolError('Command ' + command +
    ' isn\'t supported'));
  }
};
