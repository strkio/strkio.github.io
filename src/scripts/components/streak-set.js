var Vue = require('vue');

module.exports = Vue.extend({
  template: require('../../templates/components/streak-set.html'),
  components: {
    'streak-set-item': require('./streak-set-item')
  },
  events: {
    'remove-streak': function (streak) {
      this.streaks.$remove(streak);
      return false;
    }
  },
  data: function () {
    return {
      streaks: []
    };
  },
  methods: {
    moveUp: function (streak) {
      this.moveStreak(streak, -1);
    },
    moveDown: function (streak) {
      this.moveStreak(streak, +1);
    },
    moveStreak: function (streak, offset) {
      var sourceIndex = this.$data.streaks.indexOf(streak);
      var insertIndex = sourceIndex + offset;
      var streaks = this.$data.streaks;
      if (insertIndex < 0 || insertIndex >= streaks.length) {
        return;
      }
      var removed = streaks.splice(sourceIndex, 1);
      streaks.splice(insertIndex, 0, removed[0]);
    }
  }
});
