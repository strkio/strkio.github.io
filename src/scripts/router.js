var Vue = require('vue');
var Grapnel = require('grapnel').Grapnel;

var App = require('./application');
var config = require('./conf');
var session = require('./session');

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

module.exports = Grapnel.listen({
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
  '/': mountSignIn,
  '/*': function (req, e) {
    if (!e.parent()) {
      // todo: implement
    }
  }
});
