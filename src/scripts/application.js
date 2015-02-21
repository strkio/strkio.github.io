var Vue = require('vue');
var HttpStatus = require('http-status');

var config = require('./conf');
var session = require('./session');
var GitHubGist = require('./session-backed-githubgist');

function synchronize(gist, cb) {
  gist.save(function (err) {
    if (err) {
      return cb(err);
    }
    gist.fetch({force: true}, cb);
  });
}

module.exports = Vue.extend({
  template: require('../templates/application.html'),
  components: {
    'streak-set': require('./components/streak-set')
  },
  filters: {
    encode: require('./filters/encode-uri-component')
  },
  events: {
    'set-updated': function () {
      this.commitChanges();
      return false;
    }
  },
  created: function () {
    var $data = this.$data;
    $data.$add('clientId', config.clientId);
    var wl = window.location;
    var redirectURL = wl.protocol + '//' + wl.host + '/?redirect_uri=' +
      encodeURIComponent(wl.protocol + '//' + wl.host + '/' + wl.hash);
    $data.$add('redirectURL', redirectURL);
    if ($data.gistId) {
      this.gist = new GitHubGist(
        $data.gistId, {oauthToken: session.get('oauthToken')});
    } else {
      $data.$add('draft', true);
    }
    $data.$add('owner', true);
    $data.$add('syncInProgress', false);
    $data.$add('updatePending', false);
    $data.$add('loaded', false);
    var cb = function (err, data) {
      err && ($data.$add('err', err));
      data && ($data.$add('set', data));
      this.$watch('set.streaks', this.$emit.bind(this, 'set-updated'));
      $data.loaded = true;
    }.bind(this);
    if (this.gist) {
      this.gist.fetch(function (err, data) {
        if (err) {
          var e = new Error();
          e.status = err.status || 500;
          e.message = HttpStatus.getStatusText(err.status);
          return cb(e);
        }
        $data.updatePending = this.gist.updatePending();
        $data.owner = data.owner === session.get('user');
        if ($data.owner) {
          session.set('lastOpenStreak', 'gist:' + data.id);
        }
        // there is no need to call commitChanges on page load
        // due to the presence of "lightbolt" indicator
        cb(null, data);
      }.bind(this));
    } else {
      var data = JSON.parse(session.get('draft'));
      data || (data = {streaks: []});
      cb(null, data);
    }
  },
  methods: {
    commitChanges: function () {
      var gist = this.gist;
      if (gist) {
        var $data = this.$data;
        gist.save(this.set, function (err) {
          if (err) {
            console.error(err);
          }
          $data.updatePending = gist.updatePending();
        });
      } else {
        session.set('draft', JSON.stringify(this.set));
      }
    },
    sync: function () {
      var $data = this.$data;
      if ($data.syncInProgress) {
        return;
      }
      var gist = this.gist;
      $data.syncInProgress = true;
      $data.wrn = null;
      Vue.nextTick(function () {
        synchronize(gist, function (err, data) {
          if (err) {
            $data.wrn = {
              message: 'Synchronization failed (GitHub returned ' +
                err.status + ')'
            };
          }
          $data.set = data;
          $data.syncInProgress = false;
          $data.updatePending = gist.updatePending();
        });
      }, this);
    },
    addNewStreak: function () {
      var $data = this.$data;
      if ($data.syncInProgress) {
        return;
      }
      this.$broadcast('new-streak-requested');
      // directives/ref gets torn away on element removal
      // this.$['streak-set'].add();
    },
    saveAsGist: function () {
      var $data = this.$data;
      if ($data.syncInProgress) {
        return;
      }
      var gist = new GitHubGist(this.set, {
        oauthToken: session.get('oauthToken')
      });
      $data.syncInProgress = true;
      $data.wrn = null;
      Vue.nextTick(function () {
        gist.save(function (err, data) {
          if (err) {
            $data.wrn = {
              message: 'Failed to create a new gist (GitHub returned ' +
              err.status + ')'
            };
          } else {
            session.remove('draft');
            window.location.hash = '#/gists/' + data.id;
          }
          $data.syncInProgress = false;
        });
      }, this);
    },
    signOut: function () {
      session.keys().filter(function (key) {
        return key.indexOf('gist-') || !key.endsWith('-updated');
      }).forEach(session.remove);
      // todo: use session.destroy(); instead
      window.location = '/';
    }
  }
});
