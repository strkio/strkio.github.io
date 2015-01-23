var CalendarGraph = require('../calendar-graph');
var CalendarGraphTooltip = require('../calendar-graph-tooltip');
var moment = require('moment');
var Vue = require('vue');

module.exports = Vue.extend({
  template: require('../../templates/components/streak.html'),
  components: {
    'streak-visualization': {
      ready: function () {
        // todo: use
        // var mq = window.matchMedia('only screen and (max-width: 1024px)');
        // mq.addListener(function(changed) {...});
        var self = this;
        var data = this.$data.data || {}; // todo: remove fallback;
        var startDateTime = this.$data.startDate ?
          moment(this.$data.startDate)
            .startOf('day').toDate().getTime()
          : 0;
        var excludedDays = this.$data.excludedDays || [];
        var coloring = this.$data.coloring || {green: [1, 1]};
        new CalendarGraph({
          readOnly: false,
          trail: 'auto',
          disableDay: function (d) {
            return d.getTime() < startDateTime ||
              ~excludedDays.indexOf(d.getDay());
          },
          monthSpacing: 0,
          data: Object.keys(data).reduce(function (obj, key) {
            obj[key] = data[key];
            return obj;
          }, {}),
          coloring: coloring,
          use: [
            new CalendarGraphTooltip()
          ]
        }).on('change', function (e) {
            var key = e.key;
            if (e.value) {
              data.$add(key, e.value);
            } else {
              data.$delete(key);
            }
            self.$dispatch('streak-updated');
          }).attach(this.$el);
      }
    }
  },
  computed: {
    // todo: (?) limit by year
    totalEntries: function () {
      var data = this.$data.streak.data;
      return Object.keys(data).length;
    },
    longestStreak: function () {
      var data = this.$data.streak.data;
      var timestamps = Object.keys(data);
      if (!timestamps.length) {
        return 0;
      }
      timestamps.sort();
      var longest = 1;
      var current = 1;
      for (var i = 0, end = timestamps.length - 1; i < end; i++) {

        if (moment(timestamps[i]).add(1, 'day')
            .format('YYYY-MM-DD') === timestamps[i + 1]) {
          current++;
        } else {
          if (longest < current) {
            longest = current;
          }
          current = 1;
        }
      }
      if (longest < current) {
        longest = current;
      }
      return longest;
    },
    currentStreak: function () {
      var data = this.$data.streak.data;
      var today = moment().startOf('day');
      var result = data[today.format('YYYY-MM-DD')] ? 1 : 0;
      today.subtract(1, 'day');
      while (data[today.format('YYYY-MM-DD')]) {
        result++;
        today.subtract(1, 'day');
      }
      return result;
    }
  }
});
