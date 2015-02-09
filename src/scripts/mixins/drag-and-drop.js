var Vue = require('vue');

module.exports = {
  ready: function () {
    this._placeholder = document.createElement('div');
    this._placeholder.className = 'row dnd-placeholder';
  },
  methods: {
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
            this.$el.removeChild(this._placeholder);
          }
          this._placeholderInPlace = false;
        } else {
          var posElem = sourceIndex < insertIndex ? e.targetVM.$el
            : e.targetVM.$el.previousSibling;
          this._placeholderInPlace = true;
          this.$el.insertBefore(this._placeholder, posElem.nextSibling);
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
    drop: function () {
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
        this.$el.removeChild(this._placeholder);
      }
      this._placeholderInPlace = false;
      var st = this._dragNode.style;
      Vue.nextTick(function () {
        st.opacity = 1;
      });
      e.preventDefault();
    }
  }
};
