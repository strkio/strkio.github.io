var Vue = require('vue');
var HttpStatus = require('http-status');
var moment = require('moment');

var config = require('./conf');
var session = require('./session');
var GitHubGist = require('./githubgist');

function synchronize(gist, cb) {
  gist.save(function (err) {
    if (err) {
      return cb(err);
    }
    gist.fetch({force: true}, cb);
  });
}

function fn(v) {
  return typeof v === 'function' ? v : function () { return v; };
}

function generateData(threshold, value) {
  threshold = fn(threshold);
  value = fn(value);
  var data = {};
  for (var i = 0, d = moment(); i < 355; i++, d.subtract(1, 'day')) {
    if (Math.random() > threshold(d)) {
      data[d.format('YYYY-MM-DD')] = value(d);
    }
  }
  return data;
}

module.exports = Vue.extend({
  template: require('../templates/application.html'),
  components: {
    'streak-set': require('./components/streak-set'),
    'streak-draft': {
      template: require('../templates/components/streak-draft.html'),
      components: {
        'streak-settings': require('./components/streak-settings')
      }
    }
  },
  filters: {
    encode: require('./filters/encode-uri-component')
  },
  events: {
    'set-updated': function () {
      this.commitChanges();
      return false;
    },
    'streak-settings-closed': function (streak) {
      this.$data.activateNewStreakVM = false;
      if (streak) {
        this.$data.set.streaks.push(streak);
      }
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
    $data.$add('activateNewStreakVM', false);
    $data.$add('owner', true);
    $data.$add('saveInProgress', 0);
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
    generateSample: function () {
      var streak1 = {
        name: 'Solve one puzzle a day',
        data: generateData(function (d) {
          var weekday = d.isoWeekday() % 7;
          return weekday === 0 || weekday === 6 ? 0.8 : 0.33;
        }, 1)
      };
      var streak2 = {
        name: 'Workout (on weekdays, at least 45m)',
        excludedDays: [0, 6],
        range: [45, 120],
        data: generateData(0.5, function () {
          return 45 + ~~(Math.random() * 9) * 5;
        })
      };
      for (var i = 0; i < 30; i++) {
        streak2.data[moment().subtract(Math.random() * 355, 'days')
          .format('YYYY-MM-DD')] = 30;
      }
      var streak3 = {
        name: 'No junk food',
        startDate: moment().subtract(13, 'months').format('YYYY-MM-DD'),
        inverted: true,
        data: generateData(function (d) {
          var weekday = d.isoWeekday() % 7;
          return weekday === 0 || weekday === 6 ? 0.9 : 0.66;
        }, 1)
      };
      this.$data.set.streaks = [];
      var streaks = this.$data.set.streaks;
      streaks.push(streak1);
      streaks.push(streak2);
      streaks.push(streak3);
    },
    commitChanges: function () {
      var gist = this.gist;
      if (gist) {
        var $data = this.$data;
        $data.saveInProgress++;
        gist.save(this.set, function (err) {
          if (err) {
            console.error(err);
          }
          $data.updatePending = gist.updatePending();
          setTimeout(function () {
            $data.saveInProgress--;
          }, 500);
        });
      } else {
        session.set('draft', JSON.stringify(this.set));
      }
    },
    sync: function () {
      var $data = this.$data;
      if ($data.syncInProgress || $data.saveInProgress) {
        return;
      }
      var gist = this.gist;
      var scrollTop = document.body.scrollTop;
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
          document.body.scrollTop = scrollTop;
          $data.updatePending = gist.updatePending();
        });
      }, this);
    },
    addNewStreak: function () {
      var $data = this.$data;
      if ($data.syncInProgress || $data.saveInProgress) {
        return;
      }
      this.$data.activateNewStreakVM = true;
      Vue.nextTick(function () {
        this.$['new-streak'].$el.scrollIntoView(false);
      }, this);
    },
    saveAsGist: function () {
      var $data = this.$data;
      if ($data.syncInProgress || $data.saveInProgress) {
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
