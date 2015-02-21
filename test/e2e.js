var SelSauce = require('selenium-sauce');
var expect = require('chai').expect;

var config = require('./e2e.config');

describe('strk.io', function () {

  this.timeout(2 * 60 * 1000);

  new SelSauce(config, function (browser) {

    if (browser.desiredCapabilities.browserName === 'phantomjs') {
      browser.addCommand('localStorage',
        require('./webdriverio-localstorage-shim'));
    }

    before(function (done) {
      browser.init(function (err) {
        done(err);
      });
    });

    beforeEach(function (done) {
      browser
        .url(config.baseURL + '/')
        .waitForVisible('.logo')
        .call(done);
    });

    describe(browser.desiredCapabilities.browserName, function () {

      browser.addCommand('openDraft', function (cb) {
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

      it('should have sign/draft buttons on the home page',
        function (done) {
          browser
            .isVisible('#sign-in-btn')
            .isVisible('#draft-btn')
            .call(done);
        });

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

      it('should present a demo first time user opens up a draft');

      it('should allow to create a new streak',
        function (done) {
          browser
            .openDraft()
            .clickAddNewStreak()
            .setValue('.strk-streak-name-input', 'streak-1')
            .click('.streak-apply-changes-btn')
            .waitForVisible('.strk-streak-name')
            .getText('.strk-streak-name', function (err, text) {
              expect(text).to.be.equal('streak-1');
            })
            .call(done);
        });

      it('should not allow empty string as a streak name',
        function (done) {
          browser
            .openDraft()
            .clickAddNewStreak()
            .setValue('.strk-streak-name-input', '')
            .click('.streak-apply-changes-btn')
            .waitForVisible('.error')
            .call(done);
        });

      it('should not allow / in a streak name',
        function (done) {
          browser
            .openDraft()
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
      browser
        .localStorage('DELETE')
        .call(done);
    });

    after(function (done) {
      if (this.sauceLabs) {
        this.sauceLabs.updateJob(browser.requestHandler.sessionID, {
          passed: this.currentTest.state === 'passed',
          public: true
        }, function (err) {
          if (err) {
            console.error(err);
          }
          browser.end(done);
        });
      } else {
        browser.end(done);
      }
    }.bind(this));

  });

});
