//require('fastclick');

var queryString = require('query-string');
var request = require('superagent');

var App = require('./application');
var conf = require('./conf');

var Vue = require('vue');

// todo: query router
var qs = queryString.parse(window.location.search);
// todo: move authentication-specific code to a separate script
var oauthToken = localStorage.getItem('strkio_oauthToken');
var lastOpenStreak = localStorage.getItem('strkio_lastOpenStreak') || '';

function bootstrapApp(data) {
  new App({
    data: Vue.util.extend(data || {}, {
      signedIn: !!oauthToken
    })
  }).$mount('body');
}

if (qs.code && !oauthToken) {
  // todo: make clientId (used in HTML templates) configurable
  // todo: deploy zstreak-specific endpoint
  // todo: error-handling
  request.get(conf.gatekeeperURL + '/authenticate/' + qs.code, function (res) {
    var accessToken = res.body.token;
    request.get('https://api.github.com/user?access_token=' +	accessToken,
      function (res) {
        localStorage.setItem('strkio_user', res.body.login);
        localStorage.setItem('strkio_oauthToken', accessToken);
        var search = queryString.parse(location.search);
        delete search.code;
        location.search = queryString.stringify(search);
      });
  });
} else if (qs.gist) {
  var gist = qs.gist;
  localStorage.setItem('strkio_lastOpenStreak', 'gist:' + gist);
  bootstrapApp({gist: gist});
} else if (qs.hasOwnProperty('draft')) {
  localStorage.setItem('strkio_lastOpenStreak', 'draft');
  bootstrapApp();
} else {
  if (oauthToken && !lastOpenStreak.indexOf('gist:')) {
    window.location.search = '?gist=' + lastOpenStreak.split(':', 2)[1];
  } else if (oauthToken) {
    window.location.search = '?draft';
  } else {
    // todo: use lastOpenStreak as a redirectURL (github)
    // todo: make body content by default (just hidden)
    // document.body.removeAttribute('v-cloak');
    new Vue({
      template: require('../templates/index.html'),
      el: 'body',
      data: {
        clientId: conf.clientId
      }
    });
  }
}
