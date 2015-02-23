/**
 * webdriver.setValue shim which makes sure 'change' event is emitted once
 * value is set.
 *
 * @see https://code.google.com/p/selenium/issues/detail?id=4061
 */
module.exports = function (browser) {
  var originalSetValue = browser.setValue;
  return function (selector, value, cb) {
    return originalSetValue.call(browser, selector, value, function () {
      var args = Array.prototype.slice.call(arguments);
      this.execute(
        'document.querySelector("' + selector +
          '").dispatchEvent(new Event("change"));',
        function () {
          cb.apply(browser, args);
        }
      );
    });
  };
};
