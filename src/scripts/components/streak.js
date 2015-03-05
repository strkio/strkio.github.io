var Vue = require('vue');
var StreakSummary = require('../streak-summary');

module.exports = Vue.extend({
  template: require('../../templates/components/streak.html'),
  components: {
    'streak-calendar-graph': require('./streak-calendar-graph')
  },
  data: function () {
    return {
      totalEntries: 0, longestStreak: 0, currentStreak: 0
    };
  },
  events: {
    'set-updated': 'updateSummary'
  },
  ready: function () {
    this.streakSummary = new StreakSummary(this.$data.streak);
    this.updateSummary();
  },
  methods: {
    updateSummary: function () {
      var data = this.$data;
      var streakSummary = this.streakSummary;
      ['totalEntries', 'longestStreak', 'currentStreak']
        .forEach(function (key) {
          data[key] = streakSummary[key]();
        });
    }
  }
});
