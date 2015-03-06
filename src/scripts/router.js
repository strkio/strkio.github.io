var Vue = require('vue');
var Grapnel = require('grapnel').Grapnel;
var once = require('lodash.once');

var App = require('./application');
var config = require('./conf');
var session = require('./session');

var oauthToken = session.get('oauthToken');
var lastOpenStreak = session.get('lastOpenStreak');

var reloadOnStorageModification = once(function () {
  var storageModified = false;
  window.addEventListener('storage', function () {
    storageModified = true;
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && storageModified) {
      location.reload();
    }
  });
});

function mount(vue) {
  vue.$mount('#application');
}

function mountApp(data) {
  reloadOnStorageModification();
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

module.exports = Grapnel.listen({
  '/gists/:id': function (req) {
    mountApp({gistId: req.params.id});
  },
  '/draft': function () {
    mountApp({});
  },
  '/sign-in-failed': mountSignIn,
  '/*': function (req, e) {
    if (!e.parent()) {
      var router = this;
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
