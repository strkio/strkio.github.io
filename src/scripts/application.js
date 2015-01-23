var conf = require('./conf');

var Vue = require('vue');
var GitHubGist = require('strkio-storage-githubgist');

function CachedGitHubGist(gist) {
  this.gist = gist;
}

CachedGitHubGist.prototype.fetch = function (callback) {
  var cachedItemKey = 'strkio-gist-' + this.gist.data.id;
  var cachedItem = localStorage.getItem(cachedItemKey + '-updated') ||
    localStorage.getItem(cachedItemKey);
  if (cachedItem) {
    return callback(null, JSON.parse(cachedItem));
  }
  this.gist.fetch(function (err, self) {
    // do not cache Gist unless it belongs to the current user,
    // this way we will always get the latest snapshot
    if (err) {
      return callback(err);
    }
    var data = self.data;
    var owner = data.owner === localStorage.getItem('strkio_user');
    if (owner) {
      localStorage.setItem(cachedItemKey, JSON.stringify(data));
    }
    callback(null, data);
  });
};

CachedGitHubGist.prototype.save = function (data, callback) {
  var cachedItemKey = 'strkio-gist-' + this.gist.data.id;
  if (typeof data === 'function') {
    callback = data;
    data = JSON.parse(localStorage.getItem(cachedItemKey + '-updated') ||
      localStorage.getItem(cachedItemKey));
  } else {
    localStorage.setItem(cachedItemKey + '-updated', JSON.stringify(data));
  }
  this.gist.data = JSON.parse(localStorage.getItem(cachedItemKey));
  this.gist.save(data, function (err) {
    if (!err) {
      localStorage.setItem(cachedItemKey, JSON.stringify(data));
      localStorage.removeItem(cachedItemKey + '-updated');
    }
    callback.apply(null, arguments);
  });
};

CachedGitHubGist.prototype.sync = function (callback) {
  var cachedItemKey = 'strkio-gist-' + this.gist.data.id;
  this.save(function (err) {
    if (err) {
      return callback(err);
    }
    localStorage.removeItem(cachedItemKey);
    this.fetch(callback);
  }.bind(this));
};

module.exports = Vue.extend({
  template: require('../templates/application.html'),
  components: {
    'streak-set': require('./components/streak-set')
  },
  filters: {
    encode: function (value) {
      return encodeURIComponent(value);
    }
  },
  events: {
    'streak-updated': function () {
      this.update();
      return false;
    }
  },
  compiled: function () {
    this.$data.$add('clientId', conf.clientId);
    if (!localStorage.getItem('strkio_oauthToken')) {
      this.$data.$add('redirectURL', window.location.href);
    }
    if (this.$data.gist) {
      this.storage = new CachedGitHubGist(new GitHubGist(
        this.$data.gist,
        {oauthToken: localStorage.getItem('strkio_oauthToken')}
      ));
    } else {
      this.$data.$add('draft', true);
    }
  },
  ready: function () {
    this.$data.$add('set', {});
    var init = true;
    this.$watch('set.streaks', function () {
      (init) ? (init = false) : this.update();
    }.bind(this));
    if (this.storage) {
      this.storage.fetch(function (err, data) {
        // todo: error-handling, 404 in particular
        data || (data = {streaks: []});
        this.$data.$add('owner', data.owner ===
          localStorage.getItem('strkio_user'));
        this.$data.set = data;
      }.bind(this));
    } else {
      var data = JSON.parse(localStorage.getItem('strkio-draft'));
      data || (data = {streaks: []});
      this.$data.set = data;
    }
  },
  methods: {
    update: function () {
      if (this.$data.draft) {
        localStorage.setItem('strkio-draft', JSON.stringify(this.set));
      } else {
        this.storage.save(this.set, function () {
          // todo: error handling
        });
      }
    },
    sync: function () {
      // todo: throttle in case of gistStorage
      this.storage.sync(function (err, data) {
        // todo: error handling
        if (!err) {
          this.$data.set = data;
        }
      }.bind(this));
    },
    addNewStreak: function () {
      this.$broadcast('add-streak');
      // directives/ref gets torn away on element removal
      // this.$['streak-set'].add();
    },
    saveAsGist: function () {
      var gist = new GitHubGist(this.set, {
        oauthToken: localStorage.getItem('strkio_oauthToken')
      });
      gist.save(function (err, self) {
        // todo: proper error handling
        if (err) {
          console.error(err);
        } else {
          // todo: clear draft
          window.location.search = '?gist=' + self.data.id;
        }
      });
    },
    signOut: function () {
      // todo: move authentication-specific code to a separate script
      localStorage.removeItem('strkio_oauthToken');
      window.location = '/';
      // todo: (?) DELETE /applications/:client_id/tokens/:access_token
    }
  }
});
