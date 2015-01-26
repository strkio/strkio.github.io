var Vue = require('vue');

var placeholder = document.createElement('div');
placeholder.className = 'row dnd-placeholder';

function generateName () {
  return 'streak_' + Date.now();
}

module.exports = Vue.extend({
  template: require('../../templates/components/streak-set.html'),
  components: {
    'streak-settings': require('./streak-settings'),
    'streak-delete-confirmation': {
      template: require(
        '../../templates/components/streak-delete-confirmation.html')
    },
    'streak': require('./streak')
  },
  events: {
    'add-streak': function () {
      this.add();
      return false;
    }
  },
  data: function () {
    return {
      timestamp: Date.now(),
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
    remove: function (streak) {
      this.streaks.$remove(streak);
    },
    restoreDefaultView: function (e) {
      e.targetVM.$data.$add('activeView');
      e.targetVM.$data.activeView = 'streak';
    },
    add: function () {
      this.streaks.push({
        name: generateName(),
        data: {}
      });
    },
    updateName: function (streak, event) {
      streak.name = event.target.innerText.trim();
      this.$dispatch('streak-updated');
    },
    dragstart: function (e) {
      this._dragElem = e.targetVM;
      this._dragNode = e.targetVM.$el;
      e.dataTransfer.setDragImage(this._dragNode, e.x, e.layerY);
      var st = this._dragNode.style;
      Vue.nextTick(function () {
        st.opacity = 0.33;
      });
    },
    dragenter: function (e) {
      var sourceIndex = this._dragElem.$index;
      var insertIndex = e.targetVM.$index;
      if (this._insertIndex !== insertIndex) {
        if (sourceIndex === insertIndex) {
          if (this._placeholderInPlace) {
            this.$el.removeChild(placeholder);
          }
          this._placeholderInPlace = false;
        } else {
          var posElem = sourceIndex < insertIndex ? e.targetVM.$el
            : e.targetVM.$el.previousSibling;
          this._placeholderInPlace = true;
          this.$el.insertBefore(placeholder, posElem.nextSibling);
        }
        this._insertIndex = insertIndex;
      }
      e.preventDefault();
      return true;
    },
    dragover: function (e) {
      e.preventDefault();
      return true;
    },
    drop: function (e) {
      var sourceIndex = this._dragElem.$index;
      var insertIndex = this._insertIndex;
      if (sourceIndex === insertIndex) {
        return;
      }
      var removed = this.$data.streaks.splice(sourceIndex, 1);
      this.$data.streaks.splice(insertIndex, 0, removed[0]);
    },
    dragend: function (e) {
      if (this._placeholderInPlace) {
        this.$el.removeChild(placeholder);
      }
      this._placeholderInPlace = false;
      var st = this._dragNode.style;
      Vue.nextTick(function () {
        st.opacity = 1;
      });
      e.preventDefault();
    }
  }
});
