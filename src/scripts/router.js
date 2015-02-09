var Vue = require('vue');
var Grapnel = require('grapnel').Grapnel;

var App = require('./application');
var config = require('./conf');
var session = require('./session');

var oauthToken = session.get('oauthToken');
var lastOpenStreak = session.get('lastOpenStreak');

function mount(vue) {
  vue.$mount('#application');
}

function mountApp(data) {
  mount(new App({
    data: Vue.util.extend(data, {
      signedIn: !!session.get('oauthToken')
    })
  }));
}

function mountSignIn() {
  mount(new Vue({
    template: require('../templates/index.html'),
    data: {
      clientId: config.clientId
    }
  }));
}

var router = module.exports = Grapnel.listen({
  '/features': function () {
    mount(new Vue({
      template: require('../templates/features.html')
    }));
  },
  '/gists/:id': function (req) {
    mountApp({gistId: req.params.id});
  },
  '/draft': function () {
    mountApp({});
  },
  '/sign-in-failed': mountSignIn,
  '/*': function (req, e) {
    if (!e.parent()) {
      if (oauthToken) {
        if (lastOpenStreak && !lastOpenStreak.indexOf('gist:')) {
          router.navigate('/gists/' + lastOpenStreak.split(':', 2)[1]);
        } else {
          router.navigate('/draft');
        }
      } else {
        mountSignIn();
      }
    }
  }
});
