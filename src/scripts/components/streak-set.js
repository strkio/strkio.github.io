var Vue = require('vue');

module.exports = Vue.extend({
  template: require('../../templates/components/streak-set.html'),
  mixins: [
    require('../mixins/drag-and-drop')
  ],
  components: {
    'streak-settings': require('./streak-settings'),
    'streak-delete-confirmation': {
      template: require(
        '../../templates/components/streak-delete-confirmation.html')
    },
    'streak': require('./streak')
  },
  events: {
    'new-streak-requested': function () {
      this.add();
      return false;
    }
  },
  data: function () {
    return {
      streaks: []
    };
  },
  computed: {
    readOnly: function () {
      return !this.$root.$data.owner;
    }
  },
  methods: {
    edit: function (streak, e) {
      e.targetVM.$data.$add('activeView');
      if (e.targetVM.$data.activeView === 'streak-settings') {
        this.restoreDefaultView(e);
      } else {
        e.targetVM.$data.activeView = 'streak-settings';
      }
    },
    askForDeleteConfirmation: function (streak, e) {
      e.targetVM.$data.$add('activeView');
      if (e.targetVM.$data.activeView === 'streak-delete-confirmation') {
        this.restoreDefaultView(e);
      } else {
        e.targetVM.$data.activeView = 'streak-delete-confirmation';
      }
    },
    restoreDefaultView: function (e) {
      if (!e.targetVM.$data.streak.name) {
        this.streaks.$remove(e.targetVM.$data.streak);
      } else {
        e.targetVM.$data.$add('activeView');
        e.targetVM.$data.activeView = 'streak';
      }
    },
    add: function () {
      var pendingStreakIndex = this.streaks.findIndex(function (streak) {
        return !streak.name;
      });
      if (!~pendingStreakIndex) {
        this.streaks.push({
          data: {}
        });
        pendingStreakIndex = this.streaks.length - 1;
      }
      Vue.nextTick(function () {
        this._children[pendingStreakIndex].$el.scrollIntoView(false);
      }, this);
    },
    remove: function (streak) {
      this.streaks.$remove(streak);
    }
  }
});
