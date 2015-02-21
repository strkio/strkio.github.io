var Vue = require('vue');
var queryString = require('query-string');
var request = require('superagent');

var config = require('./conf');
var session = require('./session');
var router = require('./router');

Vue.config.silent = !__DEV__;
Vue.config.warnExpressionErrors = !!__DEV__;
Vue.config.async = false; /* fixme */

var qs = queryString.parse(window.location.search);
var oauthToken = session.get('oauthToken');

if (qs.code && !oauthToken) {
  // exchange ?code= for the OAuth (access) token
  request.get(config.gatekeeperURL + '/authenticate/' + qs.code,
    function (res) {
      if (res.error) {
        // not using router in order to reset query string
        window.location = '/#/sign-in-failed';
        return;
      }
      var accessToken = res.body.token;
      request.get('https://api.github.com/user?access_token=' +	accessToken,
        function (res) {
          if (res.error) {
            window.location = '/#/sign-in-failed';
            return;
          }
          session.set('user', res.body.login).set('oauthToken', accessToken);
          window.location = qs['redirect_uri'];
        });
    });
} else {
  if (qs.code) {
    window.location = '/' + window.location.hash;
  } else {
    router.navigate(router.fragment.get() || '/');
  }
}
