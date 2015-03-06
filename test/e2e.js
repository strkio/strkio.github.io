var SauceLabs = require('saucelabs');
var webdriverio = require('webdriverio');
var expect = require('chai').expect;

describe('strk.io', function () {

  this.timeout(60 * 1000);

  var baseURL = process.env.BASE_URL;
  var allTestsSucceeded = true;

  var sauceLabs;
  if (process.env.SAUCE_USERNAME && process.env.SAUCE_ACCESS_KEY) {
    sauceLabs = new SauceLabs({
      username: process.env.SAUCE_USERNAME,
      password: process.env.SAUCE_ACCESS_KEY
    });
  }

  var browser = webdriverio.remote(require('./webdriverio-config'));
  browser.addCommand('localStorage',
    require('./webdriverio-localstorage-shim'));
  if (~['safari', 'iphone'].indexOf(browser.desiredCapabilities.browserName)) {
    browser.addCommand('setValue',
      require('./webdriverio-setvalue-shim')(browser));
  }

  before(function (done) {
    browser.init(done);
  });

  beforeEach(function (done) {
    browser
      .url(baseURL + '/')
      .waitForVisible('.logo')
      .call(done);
  });

  describe('#/', function () {

    it('should have sign/draft buttons on the home page',
      function (done) {
        browser
          .isVisible('#sign-in-btn')
          .isVisible('#draft-btn')
          .call(done);
      });

  });

  describe('#/features', function () {

    it('should provide access to the list of features',
      function (done) {
        browser
          .click('#features-btn')
          .waitForVisible('.strk-feature-icon')
          .isVisible('#features-btn', function (err) {
            expect(err).to.exist;
          })
          .click('#features-close-btn')
          .waitForVisible('#features-btn')
          .call(done);
      });

  });

  describe('#/draft', function () {

    browser.addCommand('clickDraft', function (cb) {
      this
        .click('#draft-btn')
        .waitForVisible('#streak-add-btn')
        .call(cb);
    });

    browser.addCommand('clickAddNewStreak', function (cb) {
      this
        .click('#streak-add-btn')
        .waitForVisible('.strk-streak-settings')
        .call(cb);
    });

    it('should present a demo first time user opens up a draft');

    it('should allow to create a new streak',
      function (done) {
        browser
          .clickDraft()
          .clickAddNewStreak()
          .setValue('.strk-streak-name-input', 'streak-1')
          .click('.streak-apply-changes-btn')
          .waitForVisible('.strk-streak')
          .getText('.strk-streak-name', function (err, text) {
            expect(text).to.be.equal('streak-1');
          })
          .call(done);
      });

    it('should not allow empty string as a streak name',
      function (done) {
        browser
          .clickDraft()
          .clickAddNewStreak()
          .setValue('.strk-streak-name-input', ' ')
          .click('.streak-apply-changes-btn')
          .waitForVisible('.error')
          .call(done);
      });

    it('should not allow / in a streak name',
      function (done) {
        browser
          .clickDraft()
          .clickAddNewStreak()
          .setValue('.strk-streak-name-input', 'hello/there')
          .click('.streak-apply-changes-btn')
          .waitForVisible('.error')
          .call(done);
      });

    it('should not allow to select start date after than current date');
    it('should require at least on week day to be included');
    it('should allow to specify range if numeric type is selected');
    it('should update settings only on "apply changes"');
    it('should allow to delete an existing streak');
    it('should allow to cancel streak removal');
    it('should update streak stats in real-time');
    it('should calculate longest/current streak differently when "invert"ed');
    it('should show "unsupported" banner on browsers not meeting ' +
      'the requirements');

  });

  afterEach(function (done) {
    allTestsSucceeded = allTestsSucceeded &&
      this.currentTest.state === 'passed';
    browser
      .localStorage('DELETE')
      .call(done);
  });

  after(function (done) {
    if (sauceLabs) {
      sauceLabs.updateJob(browser.requestHandler.sessionID, {
        build: process.env.BUILD,
        passed: allTestsSucceeded,
        public: true
      }, function (err) {
        browser.end(function () {
          done(err);
        });
      });
    } else {
      browser.end(done);
    }
  });

});
