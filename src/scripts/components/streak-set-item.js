var Vue = require('vue');

module.exports = Vue.extend({
  template: require('../../templates/components/streak-set-item.html'),
  components: {
    'streak-settings': require('./streak-settings'),
    'streak-delete-confirmation': {
      template: require(
        '../../templates/components/streak-delete-confirmation.html')
    },
    'streak': require('./streak')
  },
  computed: {
    readOnly: function () {
      // todo: eliminate dependency on root vm
      return !this.$root.$data.owner;
    }
  },
  ready: function () {
    this.$data.$add('activeView', this.$data.streak.name ? 'streak' :
      'streak-settings');
  },
  methods: {
    edit: function () {
      this.$data.activeView = 'streak-settings';
    },
    askForDeleteConfirmation: function () {
      this.$data.activeView = 'streak-delete-confirmation';
    },
    restoreDefaultView: function () {
      if (this.$data.streak.name) {
        this.$data.activeView = 'streak';
      } else {
        this.remove();
      }
    },
    remove: function () {
      this.$dispatch('remove-streak', this.$data.streak);
    }
  }
});
