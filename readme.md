# strkio.github.io [![Build Status](https://travis-ci.org/strkio/strkio.github.io.svg?branch=develop)](https://travis-ci.org/strkio/strkio.github.io)

[strk.io](http://strk.io/).

## Running locally

> PREREQUISITE: [Node.js](http://nodejs.org/) >= 0.10, NPM, [Bower](http://bower.io/) and [Gulp](http://gulpjs.com/). 

```sh
$ git clone https://github.com/strkio/strkio.github.io
$ cd strkio.github.io
$ npm install
$ bower install
$ gulp serve
```

## Testing 

> If you intend to use [PhantomJS](https://github.com/ariya/phantomjs), it MUST be >= 2.0.0 (for MacOSX/Linux builds 
  [look here](https://github.com/eugene1g/phantomjs/releases)). 

```sh
$ # run tests on phantomjs
$ mocha
 
$ # run tests on chrome/firefox/... 
$ WEBDRIVER_BROWSER=<browser_name> mocha

$ # run tests on Sauce Labs
$ SAUCE_USERNAME= SAUCE_ACCESS_KEY= WEBDRIVER_BROWSER=saucelabs mocha
 
$ # test <subdomain>.ngrok.com instead of localhost:8000 
$ WEBDRIVER_TARGET=<subdomain>.ngrok.com mocha  
```

> Web server and Selenium start automatically (only) if corresponding ports 
  (8000 and 4444 respectively) are closed. Having said that, if you don't want to waste your time 
  waiting for Selenium to bootstrap each time you execute `mocha` - consider 
  keeping it running as a separate process (`./node_modules/selenium-sauce/node_modules/.bin/start-selenium`).  

## Deploying to GitHub Pages

> (note to maintainers) 'git push' to the 'stable' branch triggers deployment (via 
[Travis CI](https://travis-ci.org/strkio/strkio.github.io)) automatically. 
 

```sh
$ gulp build && gulp deploy
```

## License

[MIT License](http://opensource.org/licenses/mit-license.php).
