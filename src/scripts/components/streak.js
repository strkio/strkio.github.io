var Vue = require('vue');
var moment = require('moment');

module.exports = Vue.extend({
  template: require('../../templates/components/streak.html'),
  components: {
    'streak-calendar-graph': require('./streak-calendar-graph')
  },
  computed: {
    totalEntries: function () {
      var data = this.$data.streak.data;
      var startDate = this.$data.streak.startDate;
      return Object.keys(data).reduce(
        startDate ?
        function (v, key) {
          return v + (startDate <= key && data[key] ? 1 : 0);
        } :
        function (v, key) {
          return v + (data[key] ? 1 : 0);
        },
        0);
    },
    longestStreak: function () {
      var data = this.$data.streak.data;
      var inverted = !!this.$data.streak.inverted;
      var startDate = this.$data.streak.startDate ?
        moment(this.$data.streak.startDate) : null;
      var today = moment().startOf('day');
      var keys = Object.keys(data);
      if (!keys.length) {
        return inverted ? today.diff(startDate, 'days') + 1 : 0;
      }
      keys.sort();
      var entries = [];
      if (inverted) {
        entries.push(moment(startDate));
      }
      keys.forEach(function (key) {
        var e = moment(key);
        if (!inverted || (e.isSame(startDate) || e.isAfter(startDate))) {
          entries.push(e);
        }
      });
      if (inverted) {
        entries.push(today);
      }
      if (inverted && entries.length === 2) {
        return today.diff(startDate, 'days') + 1;
      }
      var longest = 0;
      var streak = 1;
      for (var i = 0, end = entries.length - 1; i < end; i++) {
        if (inverted) {
          streak = entries[i + 1].diff(entries[i], 'days');
          if (longest < streak) {
            longest = streak;
          }
        } else {
          if (moment(entries[i]).add(1, 'day').isSame(entries[i + 1])) {
            streak++;
          } else {
            if (longest < streak) {
              longest = streak;
            }
            streak = 1;
          }
        }
      }
      if (longest < streak) {
        longest = streak;
      }
      return longest;
    },
    currentStreak: function () {
      var data = this.$data.streak.data;
      var inverted = !!this.$data.streak.inverted;
      var startDate = this.$data.streak.startDate ?
        moment(this.$data.streak.startDate) : null;
      var today = moment().startOf('day');
      var result = 0;
      var countDown = startDate ? today.diff(startDate, 'days') + 1 :
        Number.MAX_VALUE;
      while ((!!data[today.format('YYYY-MM-DD')] ^ inverted) && countDown--) {
        result++;
        today.subtract(1, 'day');
      }
      return result;
    }
  }
});
